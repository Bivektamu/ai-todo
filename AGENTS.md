<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project conventions

### Stack

Next.js 16 (App Router), React 19 (Compiler), TypeScript 5 (strict), Tailwind CSS 4, Prisma with libsql adapter (SQLite).

### Path alias

`@/*` maps to the project root.

### Data access

Use the Prisma singleton from `lib/prisma.ts` for all database access. Server components read directly from Prisma; mutations go through server actions.

### Server actions

All mutations live in `app/actions.ts` (marked `"use server"`). Each action calls `revalidatePath("/")` after mutating to refresh the page.

### Client components

Client components use `"use client"` and keep state minimal. Forms use the `action` prop with server actions for mutations (no client-side fetch for CRUD).

### Verification

When verifying features at runtime:

- **Start the dev server** with `cmd /c "start /b npx next dev"` (Windows). Use `cmd /c` wrappers for all shell commands to avoid PowerShell syntax issues (curl alias, `&&`, pipes with quotes).
- **Test page rendering** by fetching HTML and checking for expected components and server action IDs.
- **Verify CRUD** by writing a TypeScript script that imports `{ prisma }` from `lib/prisma.ts` and exercises create/read/update/delete, run with `npx tsx <script>.ts`.
- **Do NOT** use `prisma db execute` — it fails because the schema has no `datasource.url` (adapter-based connection).
- **Do NOT** try direct HTTP POST to server actions — Next.js requires RSC-specific content types and serialization that are non-trivial to craft manually.
- **PrismaLibSql adapter** constructor takes a raw config object `{ url: "file:./dev.db" }`, never a pre-created libsql client instance.

### Testing

Test stack: Vitest (unit/component) + @testing-library/react + @testing-library/jest-dom + jsdom, and Playwright for E2E. Preferences in `test-preferences.json`.

- **Unit/component tests**: run with `npx vitest run`. Test files are co-located in `__tests__/` next to source. Vitest config (`vitest.config.ts`) sets up jsdom environment, `@/*` path alias, and excludes `e2e/`.
- **E2E tests**: run with `npx playwright test`. Tests live in `e2e/`. Playwright config (`playwright.config.ts`) starts the Next.js dev server automatically and reuses it if already running.
- **Server action testing**: mock `next/cache` (revalidatePath) and `@/lib/prisma` using `vi.mock()`. Test each action's input validation (missing, empty, whitespace) and its happy path.
- **Component testing**: mock server action imports with `vi.mock("@/app/actions")`. Use `screen.getByRole` for accessible queries. When multiple elements share the same role+name, use `getAllByRole` with `.toHaveLength(N)`.
- **E2E cleanup**: the dev DB (`dev.db`) persists across test runs. Add a `beforeEach` that deletes all existing todos before each test. When targeting a specific todo's buttons, scope to its `<li>` with `page.getByRole("listitem").filter({ hasText: "..." })` to avoid strict mode violations.

### Known pitfalls

- **npm install can remove Prisma packages**: adding new devDependencies (like vitest, playwright, testing-library) may trigger npm's cleanup which removes `@prisma/client` and `@prisma/adapter-libsql`. After any `npm install -D`, verify with `npm ls @prisma/client` and reinstall if missing.
- **`@prisma/adapter-libsql` is not a standalone package**: it is bundled by Prisma's generator and cannot be resolved by Vite/Vitest directly. Do not attempt to unit test `lib/prisma.ts` in isolation — the singleton's behavior is covered indirectly through actions integration tests.
- **`npx prisma generate` output path**: the schema at `app/generated/prisma/schema.prisma` has `output = "../app/generated/prisma"`. Running `prisma generate` from the project root resolves this relative to the schema file location, causing incorrect output. The generated client at `app/generated/prisma/` should be treated as the source of truth.
- **PowerShell vs cmd**: always wrap shell commands with `cmd /c` to avoid PowerShell issues with `&&`, `||`, `2>&1`, and pipes.
