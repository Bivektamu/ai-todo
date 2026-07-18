import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// We test the authorize function by importing auth.ts and accessing
// the provider configuration. Since NextAuth is a module-level call,
// we spy on it and capture the Credentials provider's authorize callback.

const mockNextAuth = vi.fn(() => ({
  handlers: { GET: vi.fn(), POST: vi.fn() },
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("next-auth", () => ({
  default: mockNextAuth,
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google", type: "oauth" })),
}));

vi.mock("next-auth/providers/github", () => ({
  default: vi.fn(() => ({ id: "github", type: "oauth" })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config: any) => ({
    id: "credentials",
    type: "credentials",
    ...config,
  })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

import bcrypt from "bcryptjs";

describe("auth.ts (Auth.js configuration)", () => {
  let authorizeFn: (credentials: Record<string, string>) => Promise<any>;
  let savedCallArgs: any;

  beforeAll(async () => {
    // Import triggers the NextAuth call which captures the config
    await import("@/auth");
    savedCallArgs = mockNextAuth.mock.calls[0][0];
    const credsProvider = savedCallArgs.providers.find(
      (p: any) => p.id === "credentials"
    );
    authorizeFn = credsProvider.authorize;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when email is missing (covers: AC-3)", async () => {
    const result = await authorizeFn({ password: "test123" });
    expect(result).toBeNull();
  });

  it("returns null when password is missing (covers: AC-3)", async () => {
    const result = await authorizeFn({ email: "test@example.com" });
    expect(result).toBeNull();
  });

  it("returns null when email is empty string (covers: AC-3)", async () => {
    const result = await authorizeFn({ email: "", password: "test123" });
    expect(result).toBeNull();
  });

  it("returns null when password is empty string (covers: AC-3)", async () => {
    const result = await authorizeFn({ email: "test@example.com", password: "" });
    expect(result).toBeNull();
  });

  it("creates a new user on first sign in with valid credentials (covers: AC-3, AC-7)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue("hashed_password_xyz");
    mockPrisma.user.create.mockResolvedValue({
      id: 42,
      email: "new@example.com",
      name: null,
      image: null,
    });

    const result = await authorizeFn({
      email: "  NEW@Example.COM  ",
      password: "securepassword",
    });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "new@example.com" },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("securepassword", 12);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "new@example.com",
        passwordHash: "hashed_password_xyz",
      },
    });
    expect(result).toEqual({
      id: "42",
      name: null,
      email: "new@example.com",
      image: null,
    });
  });

  it("returns user when existing user provides correct password (covers: AC-3)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: "existing@example.com",
      passwordHash: "stored_hash",
      name: "Existing User",
      image: "avatar.png",
    });
    (bcrypt.compare as any).mockResolvedValue(true);

    const result = await authorizeFn({
      email: "existing@example.com",
      password: "correctpassword",
    });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "existing@example.com" },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith("correctpassword", "stored_hash");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: "7",
      name: "Existing User",
      email: "existing@example.com",
      image: "avatar.png",
    });
  });

  it("returns null when existing user provides wrong password (covers: AC-3)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: "existing@example.com",
      passwordHash: "stored_hash",
      name: "User",
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    const result = await authorizeFn({
      email: "existing@example.com",
      password: "wrongpassword",
    });

    expect(result).toBeNull();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("returns null for OAuth only user with no passwordHash set (covers: AC-3)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: "oauth@example.com",
      passwordHash: null,
      name: "OAuth User",
    });

    const result = await authorizeFn({
      email: "oauth@example.com",
      password: "somepassword",
    });

    expect(result).toBeNull();
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("configures JWT session strategy", async () => {
    expect(savedCallArgs.session).toEqual({ strategy: "jwt" });
  });

  it("configures three providers: Google, GitHub, Credentials", async () => {
    const providerIds = savedCallArgs.providers.map((p: any) => p.id);
    expect(providerIds).toContain("google");
    expect(providerIds).toContain("github");
    expect(providerIds).toContain("credentials");
  });

  it("configures signIn page to /login and error page to /login", async () => {
    expect(savedCallArgs.pages).toEqual({ signIn: "/login", error: "/login" });
  });

  it("JWT callback adds user id to token", async () => {
    const result = await savedCallArgs.callbacks.jwt({
      token: { sub: "existing" },
      user: { id: "99" },
    });
    expect(result).toEqual({ sub: "existing", id: "99" });
  });

  it("JWT callback preserves token when no user provided", async () => {
    const result = await savedCallArgs.callbacks.jwt({
      token: { sub: "existing" },
    });
    expect(result).toEqual({ sub: "existing" });
  });

  it("session callback adds user id from token", async () => {
    const result = await savedCallArgs.callbacks.session({
      session: { user: { name: "Test" } },
      token: { id: "42" },
    });
    expect(result).toEqual({ user: { name: "Test", id: "42" } });
  });

  it("session callback does not add id when token id is missing", async () => {
    const result = await savedCallArgs.callbacks.session({
      session: { user: { name: "Test" } },
      token: {},
    });
    expect(result).toEqual({ user: { name: "Test" } });
  });
});
