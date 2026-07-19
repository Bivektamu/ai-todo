<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project conventions

### Stack

Next.js 16 (App Router), React 19 (Compiler), TypeScript 5 (strict), Tailwind CSS 4, Prisma with Neon adapter (PostgreSQL).

### Path alias

`@/*` maps to the project root.

### Data access

Use the Prisma singleton from `lib/prisma.ts` for all database access. Server components read directly from Prisma; mutations go through server actions. The singleton uses a Proxy pattern with lazy initialization: the Neon connection is established on first use, not at import time, so the module loads even if the database is temporarily unreachable. `DATABASE_URL` is required (no file-based fallback).

### Server actions

All mutations live in `app/actions.ts` (marked `"use server"`). Every action calls `auth()` at the top to get the authenticated user and scopes all Prisma queries by `userId`. Each action calls `revalidatePath("/")` after mutating to refresh the page. Eight actions: `createTodo`, `toggleTodo`, `updateTodo` (priority, dueDate, and/or categoryId), `deleteTodo`, `reorderTodo`, `createCategory`, `renameCategory`, `deleteCategory`, `signOutEverywhere`. The `updateTodo` action patches only the fields present in the form submission. Category actions validate name uniqueness and colour against a curated palette constant.

### Authentication

Auth.js v5 with JWT sessions, Prisma adapter, and three providers: Google OAuth, GitHub OAuth, and email/password credentials. Route protection via `proxy.ts` (Next.js 16 convention; supersedes `middleware.ts`). The proxy redirects unauthenticated requests to `/login` with a matcher that excludes `/api/auth`, `/login`, static assets, and favicon.

- **`auth.ts`**: Auth.js configuration with Prisma adapter, JWT strategy, three providers, callbacks that embed `userId` and `tokenVersion` in the JWT, and a `signIn` callback that normalizes OAuth email to lowercase. The Prisma adapter is wrapped (`intAdapter`) to convert Auth.js string IDs to our schema's autoincrement Int IDs at the boundary (`getUser`, `updateUser`, `deleteUser`). Google and GitHub providers have `allowDangerousEmailAccountLinking: true` so verified OAuth emails automatically link to existing accounts (safe because both providers verify emails).
- **`proxy.ts`**: Route guard that wraps Auth.js `auth()`. Redirects unauthenticated requests to `/login`.
- **`app/login/page.tsx`**: Async server component that redirects authenticated users to `/` via `auth()`. Displays error messages from `?error=` search params (OAuthAccountNotLinked, Configuration, AccessDenied, etc.). Google OAuth, GitHub OAuth, and email/password sign in forms. OAuth `signIn` calls pass `{ redirectTo: "/" }` to avoid the default Referer based callback URL; credentials form uses `signIn("credentials", formData)`.
- **`app/api/auth/[...nextauth]/route.ts`**: Catch-all route handler exporting Auth.js GET/POST handlers.
- **Credentials flow**: email is lowercased and trimmed; passwords must be ≥ 8 characters and ≤ 128 characters; inputs over 254 characters are rejected. Implicit sign up on first credentials sign in. Rate limited at 5 attempts per email per 15 minute window via `lib/rate-limit.ts`.
- **Session revocation**: `signOutEverywhere` server action increments `tokenVersion` on the User record. New sign-ins embed the new version; existing JWTs remain valid until natural expiry (30 days).
- **Security**: `AUTH_SECRET` must be ≥ 32 characters (validated at startup). bcryptjs at 12 rounds for password hashing. P2002 race condition on concurrent sign up is caught and returns `null`.

### Client components

Client components use `"use client"` and keep state minimal. Forms use the `action` prop with server actions for mutations (no client-side fetch for CRUD).

### Design system

See [components/ui/AGENTS.md](components/ui/AGENTS.md) for the full primer. In short:

- Six reusable primitives live in `components/ui/`: **Button**, **Input**, **Badge**, **Select**, **Modal**, **Checkbox**.
- Design tokens (background, surface, foreground, muted, border, primary, danger, success, priority-low/medium/high plus foreground variants) are defined in `app/globals.css` via Tailwind CSS 4's `@theme` directive with light and dark overrides (`prefers-color-scheme`).
- Every primitive supports `className` overrides, spreads standard HTML attributes, and has `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- A component catalogue is viewable at `/ui` (`app/ui/page.tsx`).
- Use the primitives instead of ad hoc Tailwind classes for buttons, inputs, badges, selects, modals, and checkboxes.
- All interactive elements (`<button>`, `<select>`, `<input>`) carry an accessible name via visible label or `aria-label`. Status toggle buttons have `aria-pressed`. Decorative SVGs use `aria-hidden="true"`. The Modal traps focus within its panel. The TodoFilter includes an `aria-live` region for screen reader announcements.

### Verification

When verifying features at runtime:

- **Start the dev server** with `cmd /c "start /b npx next dev"` (Windows). Use `cmd /c` wrappers for all shell commands to avoid PowerShell syntax issues (curl alias, `&&`, pipes with quotes).
- **Test page rendering** by fetching HTML and checking for expected components and server action IDs.
- **Verify CRUD** by writing a TypeScript script that imports `{ prisma }` from `lib/prisma.ts` and exercises create/read/update/delete, run with `npx tsx <script>.ts`.
- **Do NOT** try direct HTTP POST to server actions — Next.js requires RSC-specific content types and serialization that are non-trivial to craft manually.
- The `page.tsx` server component uses `export const dynamic = "force-dynamic"` to skip static prerendering during build (required because the page reads from a database at runtime).

### Project docs

- [docs/adr/](docs/adr/) — Architecture Decision Records (001 data model, 002 CRUD, 003 Neon migration, 004 enrichments, 005 drag-and-drop reorder, 006 categories, 007 design system, 008 authentication system)
- [docs/roadmap/](docs/roadmap/) — Feature roadmap (skateboard build approach)

### Testing

Test stack: Vitest (unit/component) + @testing-library/react + @testing-library/jest-dom + jsdom, and Playwright for E2E. Preferences in `test-preferences.json`.

- **Unit/component tests**: run with `npx vitest run`. Test files are co-located in `__tests__/` next to source. Vitest config (`vitest.config.ts`) sets up jsdom environment, `@/*` path alias, and excludes `e2e/`.
- **E2E tests**: run with `npx playwright test`. Tests live in `e2e/`. Playwright config (`playwright.config.ts`) starts the Next.js dev server automatically and reuses it if already running.
- **Server action testing**: mock `next/cache` (revalidatePath), `@/lib/prisma`, and `@/auth` using `vi.mock()`. Set `process.env.AUTH_SECRET` before importing auth modules. Test each action's input validation (missing, empty, whitespace) and its happy path, including `userId` scoping in all Prisma call expectations.
- **Auth testing**: mock `bcryptjs` and `next-auth` providers. The `authorize` function from the Credentials provider is testable by capturing the NextAuth config object on import. Test the `proxy.ts` handler by mocking `@/auth` to return authenticated or null auth objects.
- **Component testing**: mock server action imports with `vi.mock("@/app/actions")`. Use `screen.getByRole` for accessible queries. When multiple elements share the same role+name, use `getAllByRole` with `.toHaveLength(N)`.
- **E2E cleanup**: the database persists across test runs. Add a `beforeEach` that deletes all existing todos and categories before each test (use button iteration since there is no direct DB reset hook). For categories, open the "Manage categories" modal, iterate delete buttons, then close with Escape. When targeting a specific todo's buttons, scope to its `<li>` with `page.getByRole("listitem").filter({ hasText: "..." })` to avoid strict mode violations.

### Known pitfalls

- **npm install can remove Prisma packages**: adding new devDependencies (like vitest, playwright, testing-library) may trigger npm's cleanup which removes `@prisma/client` and `@prisma/adapter-neon`. After any `npm install -D`, verify with `npm ls @prisma/client` and reinstall if missing.
- **`npx prisma generate` output path**: the schema at `app/generated/prisma/schema.prisma` has `output = "."`. Running `prisma generate` from the project root resolves this relative to the schema file location, causing incorrect output. The generated client at `app/generated/prisma/` should be treated as the source of truth.
- **`lib/prisma.ts` is not unit-testable in isolation**: it imports `@prisma/adapter-neon` which cannot be resolved by Vite/Vitest directly. The singleton's behavior is covered indirectly through actions integration tests.
- **PowerShell vs cmd**: always wrap shell commands with `cmd /c` to avoid PowerShell issues with `&&`, `||`, `2>&1`, and pipes.
- **`middleware.ts` is deprecated in Next.js 16**: use `proxy.ts` instead. Having both files present causes a startup error. The project uses `proxy.ts` for route protection.
