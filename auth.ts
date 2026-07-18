import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

// Fail fast if AUTH_SECRET is missing or too short
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  throw new Error(
    "AUTH_SECRET is missing or too short (minimum 32 characters). " +
    "Generate one with: npx auth secret"
  );
}

// The @auth/prisma-adapter passes string IDs (from JWTs) directly to Prisma,
// but our schema uses autoincrement Int IDs. The Adapter interface types declare
// id: string for UUID/cuid schemas, so we coerce to number at the boundary.
const baseAdapter = PrismaAdapter(prisma);
const intAdapter = {
  ...baseAdapter,
  getUser: (id: string) => (baseAdapter.getUser as any)(parseInt(id, 10)),
  updateUser: (user: { id: string; [key: string]: unknown }) =>
    (baseAdapter.updateUser as any)({ ...user, id: parseInt(user.id, 10) }),
  deleteUser: (id: string) => (baseAdapter.deleteUser as any)(parseInt(id, 10)),
} as typeof baseAdapter;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: intAdapter,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Reject excessively long inputs
        if (email.length > 254 || password.length > 128) {
          return null;
        }

        // Enforce minimum password length
        if (password.length < 8) {
          return null;
        }

        // Rate limit by email (5 attempts per 15 minute window)
        if (!checkRateLimit(email)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Existing user: verify password
        if (user) {
          if (!user.passwordHash) {
            return null; // OAuth only user, no password set
          }
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            return null;
          }
          resetRateLimit(email);
          return { id: String(user.id), name: user.name, email: user.email, image: user.image };
        }

        // New user: create account (sign up is implicit on first credentials sign in)
        // Wrap in try/catch to handle race condition: two concurrent requests
        // with the same email both pass findUnique, the second create hits P2002.
        const passwordHash = await bcrypt.hash(password, 12);
        try {
          const newUser = await prisma.user.create({
            data: {
              email,
              passwordHash,
            },
          });
          resetRateLimit(email);
          return { id: String(newUser.id), name: newUser.name, email: newUser.email, image: newUser.image };
        } catch (error: any) {
          if (error?.code === "P2002") {
            // Duplicate email from a concurrent sign-up, treat as failed auth
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Normalize email to lowercase for OAuth users to prevent case-collision
      // with credentials accounts (which already normalize in authorize).
      if (account?.provider !== "credentials" && user.email) {
        const normalized = user.email.toLowerCase().trim();
        if (normalized !== user.email) {
          await prisma.user.update({
            where: { id: parseInt(user.id!, 10) },
            data: { email: normalized },
          });
          user.email = normalized;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // Fetch tokenVersion from DB on sign-in to embed in JWT.
      // Incrementing tokenVersion on the user record invalidates all
      // future tokens (existing JWTs remain valid until natural expiry).
      if (account && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(token.sub, 10) },
          select: { tokenVersion: true },
        });
        if (dbUser) {
          token.tokenVersion = dbUser.tokenVersion;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
