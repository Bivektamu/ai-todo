# ADR 008: Authentication system

Status: In Progress

Date: 2026-07-18

## Summary

Add user authentication to the todo app so each user has a private, isolated todo list. Use Auth.js v5 with JWT sessions, Google and GitHub OAuth providers, and email/password credentials (OAuth first per the Skateboard build approach, credentials after). No sharing, no teams, no email verification in the initial slice.

## Context

The todo app currently has no authentication. Anyone who visits the page sees the same shared list. The roadmap calls for a hybrid OAuth + credentials system built on the Skateboard approach: ship OAuth first as the thinnest usable whole, then thicken with email/password. The stack is Next.js 16 (App Router), Prisma with Neon Postgres, TypeScript 5, Tailwind CSS 4.

## Requirements

The acceptance criteria that follow define the contract `/develop` builds to and `/verify` checks:

- **AC-1**: Sign in with Google OAuth
- **AC-2**: Sign in with GitHub OAuth
- **AC-3**: Sign up and sign in with email and password (no email verification in this slice)
- **AC-4**: Todos and categories are scoped per user; each user sees only their own data
- **AC-5**: Unauthenticated visitors to `/` are redirected to `/login`
- **AC-6**: Sign out clears the session and returns to `/login`
- **AC-7**: First sign in via any provider creates the user account (no separate signup flow)
- **AC-8**: All existing CRUD, reorder, filter, and category tests still pass after user scoping

## Options considered

### Auth library

| Option | Tradeoff |
|---|---|
| Auth.js v5 | Standard Next.js auth library, built in Prisma adapter, OAuth + credentials out of the box. Widely documented. **(chosen)** |
| Clerk | Hosted platform, drop in components. Fast to integrate but users live in Clerk's database, paid at scale. |
| Lucia Auth | Library approach, full control, more boilerplate. Overkill for this scope. |
| Roll your own | Maximum flexibility, maximum risk. Auth is not where originality pays off. |

### Session strategy

| Option | Tradeoff |
|---|---|
| JWT (stateless) | No session table, edge compatible, cookie based. Auth.js v5 default. **(chosen)** |
| Database sessions | Session table in DB, server side revocation. Heavier, adds a DB lookup per request. |

### Route protection

| Option | Tradeoff |
|---|---|
| Middleware + Auth.js edge config | Single check point, catches all routes. Standard Next.js pattern. **(chosen)** |
| Per page / per component | Flexible but easy to forget a check. |
| Layout based | Cleaner than per page but doesn't protect server actions directly. |

### Password hashing

| Option | Tradeoff |
|---|---|
| bcryptjs, 12 rounds | Pure JS, works everywhere (Edge, Serverless). Auth.js default. **(chosen)** |
| Argon2 | More GPU resistant, requires native bindings. Not worth the complexity here. |

## Decision

Use **Auth.js v5** with the **Prisma adapter** and **JWT session strategy**. Route protection via **Next.js middleware** that redirects unauthenticated requests to `/login`. Server actions call `auth()` at the top and scope all Prisma queries by `userId`. Password hashing with **bcryptjs at 12 rounds**. Rate limiting deferred to a later slice.

### Implementation skills

The Auth.js Agent Skill (`nextauthjs/next-auth`) was not installable (no valid SKILL.md found in the repo). Build from Auth.js v5 documentation directly.

## Rationale

Auth.js v5 is the standard choice for Next.js authentication. Its Prisma adapter maps cleanly to our existing Prisma + Neon stack. JWT sessions keep the architecture stateless and Edge compatible, matching the serverless Neon deployment model. Middleware based route protection is the idiomatic Next.js pattern and ensures no route is accidentally left unprotected. `bcryptjs` is the pure JS bcrypt implementation that works in all Next.js runtimes (Edge, Node.js, Serverless) without native bindings.

Every existing server action is scoped to the authenticated user by calling `auth()` at the top and adding `userId` to every `where` clause. This is explicit, auditable, and requires no changes to the Prisma schema beyond adding the `userId` foreign key.

## Feature design

### Data model

**User** (new table)

| Field | Type | Notes |
|---|---|---|
| id | Int (PK, autoincrement) | |
| name | String? | from OAuth or signup |
| email | String? | unique, nullable for rare OAuth without email |
| emailVerified | DateTime? | tracks verification status |
| image | String? | OAuth avatar URL |
| passwordHash | String? | null for OAuth only users |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Account** (new table, Auth.js adapter)

| Field | Type | Notes |
|---|---|---|
| id | Int (PK) | |
| userId | Int (FK → User, cascade delete) | |
| type | String | e.g. "oauth", "credentials" |
| provider | String | e.g. "google", "github" |
| providerAccountId | String | provider's user identifier |
| refresh_token | String? | |
| access_token | String? | |
| expires_at | Int? | |
| token_type | String? | |
| scope | String? | |
| id_token | String? | |
| session_state | String? | |

Unique compound index on `(provider, providerAccountId)`.

**Todo** (modified existing)

Add `userId Int (not null, FK → User, cascade delete)`. Add a non unique index on `userId` for query performance.

**Category** (modified existing)

Add `userId Int (not null, FK → User, cascade delete)`. Add a non unique index on `userId` for query performance.

### Security model

- **Ownership**: a user may only read, create, update, and delete their own todos and categories. Every server action validates `userId` from the session against the resource's `userId`.
- **Session**: JWT stored in an httpOnly, secure, SameSite=Lax cookie. Auth.js `auth()` returns the session (or null if unauthenticated).
- **Passwords**: hashed with bcryptjs at 12 rounds. The `passwordHash` column is null for OAuth only users.
- **Rate limiting**: deferred. The app serves a handful of users; rate limiting on login attempts is unnecessary for the initial slice.
- **CSRF**: Auth.js handles CSRF protection for the sign in flow natively.

### Critical test scenarios

| Scenario | AC |
|---|---|
| Google OAuth sign in creates user, scopes data | AC-1, AC-4, AC-7 |
| GitHub OAuth sign in creates user, scopes data | AC-2, AC-4, AC-7 |
| Email/password sign up and sign in | AC-3, AC-7 |
| Unauthenticated request to `/` redirects to `/login` | AC-5 |
| Sign out clears session, returns to `/login` | AC-6 |
| User A cannot see User B's todos | AC-4 |
| Existing CRUD, filter, reorder, category tests pass | AC-8 |
| Same provider + providerAccountId cannot create duplicate account | data model |

## Build plan

The build approach is **Skateboard**: ship OAuth first as the thinnest usable whole, then thicken with credentials.

### Milestone 1: Schema migration (AC-1, AC-2, AC-3, AC-4)

- [x] Add User and Account models to `app/generated/prisma/schema.prisma`
- [x] Add `userId Int` to Todo and Category models with foreign keys and cascade delete
- [x] Add non unique indexes on `userId` for Todo and Category
- [x] Run `npx prisma db push` to apply the migration to Neon
- [x] Regenerate Prisma client

### Milestone 2: Auth.js setup and OAuth providers (AC-1, AC-2, AC-6, AC-7)

- [x] Install Auth.js v5 and the Prisma adapter
- [x] Create `auth.ts` with Auth.js config (Prisma adapter, JWT strategy, Google and GitHub providers)
- [x] Set up `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `AUTH_SECRET` environment variables
- [x] Create the `/api/auth/[...nextauth]` route handler
- [ ] Verify OAuth sign in flow with Google and GitHub

### Milestone 3: Route protection and user scoping (AC-4, AC-5)

- [x] Add `middleware.ts` that redirects unauthenticated requests to `/login` (skip `/login` and `/api/auth/*`)
- [x] Scope every server action (`createTodo`, `toggleTodo`, `updateTodo`, `deleteTodo`, `reorderTodo`, `createCategory`, `renameCategory`, `deleteCategory`) to the authenticated user
- [x] Scope `page.tsx` data fetching to the authenticated user

### Milestone 4: Login page and sign out (AC-5, AC-6)

- [x] Create `/login` page with Google and GitHub sign in buttons
- [x] Add sign out button to the todo page header
- [x] Handle OAuth callback errors (redirect to `/login` with a generic error message)

### Milestone 5: Email/password credentials (AC-3)

- [x] Add the Credentials provider to Auth.js config
- [x] Add email and password fields to the login page
- [x] Implement sign up logic (first credentials sign in with unknown email creates the user)
- [x] Hash passwords with bcryptjs on account creation and verify on sign in

### Milestone 6: Test updates (AC-8)

- [x] Update existing unit tests: mock `auth()` and add `userId` to test data
- [x] Update existing component tests: wrap providers or mock session
- [x] Update Playwright E2E tests: sign in before each test, scope assertions to the test user
- [x] Add new tests: auth flow, user isolation, middleware redirect

## Consequences

- Every server action gains a mandatory `auth()` call and a `userId` filter. This is explicit and auditable.
- The Prisma schema gains two new models (User, Account) and two existing models gain a required foreign key. This means existing anonymous data must be wiped (truncate Todo and Category tables before or after migration).
- `AUTH_SECRET` and OAuth provider credentials become required environment variables. Without them the app won't start.
- Auth.js v5 adds a dependency that must be kept current for security patches.
- The login page is a new route. SEO is irrelevant (it's an auth walled page behind redirect).

## Follow-up

- Install the Auth.js Agent Skill once a valid SKILL.md is available in the `nextauthjs/next-auth` repo. The install attempt on 2026-07-18 failed (no valid skills found).
- Add rate limiting on login attempts in a later slice (Redis/Upstash or in memory store).
- Add email verification for credentials sign up in a later slice.
- Add password reset flow in a later slice.
