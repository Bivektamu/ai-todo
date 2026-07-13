# Todo App Roadmap

Build approach: Skateboard — ship the thinnest usable whole first, then thicken.

## At a glance

| # | Feature | Phase | Weight | Needs ADR | Status |
|---|---|---|---|---|---|
| 1 | Stack & architecture | Foundation | medium | yes | existing |
| 2 | Coding standards & tooling | Foundation | lean | no | existing |
| 3 | Data model | Foundation | lean | yes | done |
| 4 | Todo CRUD | Skateboard | medium | yes | done |
| 5 | Replace Turso with Neon Postgres | Foundation | medium | yes | done |

## Foundation

### 1. Stack & architecture

Stack: Next.js 16 (App Router), React 19 (Compiler), TypeScript 5 (strict), Tailwind CSS 4, Prisma (SQLite).

Code area: `app/`, `prisma/`, `next.config.ts`, `package.json`

Status: existing

- [x] Scaffold project

### 2. Coding standards & tooling

ESLint 9 flat config, TypeScript strict mode, Geist fonts, path alias `@/*`.

Code area: `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `app/globals.css`

Status: existing

- [x] Tooling installed and configured

### 3. Data model

Intent: define the Todo entity in the Prisma schema so the CRUD page has a persistence layer to read and write through.

Done when: `prisma/schema.prisma` has a Todo model with id, title, completed, createdAt, and updatedAt fields; `npx prisma db push` succeeds.

Weight: lean

ADR: [001-data-model](../adr/001-data-model.md)

Code area: `prisma/schema.prisma`

Status: done

- [x] Design it: `/architect data-model`

### 5. Replace Turso with Neon Postgres

Intent: swap the persistence layer from SQLite (libsql adapter, Turso compatible) to Neon's serverless Postgres. The app's CRUD behavior stays the same; only the database underneath changes.

Done when: the Prisma schema uses the `postgresql` provider, the adapter is `@prisma/adapter-neon`, a Neon connection string is wired via `DATABASE_URL`, and all four CRUD operations (create, read, toggle, delete) pass their existing tests.

Weight: medium

ADR: [003-neon-migration](../adr/003-neon-migration.md)

Code area: `lib/prisma.ts`, `prisma.config.ts`, `app/generated/prisma/schema.prisma`, `app/actions.ts`

Status: done

- [x] Design it: `/blueprint neon-migration`
- [x] Build it: `/develop neon-migration`
  - [x] Swap adapter in `lib/prisma.ts`
  - [x] Change schema provider to `postgresql`
  - [x] Regenerate Prisma client
  - [x] Wire Neon `DATABASE_URL`
- [x] Verify it: `/verify neon-migration`
- [x] Test it: `/test neon-migration`

### 4. Todo CRUD

Intent: a single page where the user can create a todo, see the full list, toggle complete/incomplete, and delete items — the thinnest working whole.

Done when: user can add a todo with a title, see it appear in the list, check it off (and uncheck), and delete it; empty state renders when the list is empty.

Weight: medium

ADR: [002-todo-crud](../adr/002-todo-crud.md)

Code area: `app/page.tsx`, `app/actions.ts`, `components/`, `lib/prisma.ts`

Status: done

- [x] Design it: `/architect todo-crud`
- [x] Build it: `/develop todo-crud`
  - [x] Prisma client singleton (`lib/prisma.ts`)
  - [x] Server actions (`app/actions.ts`)
  - [x] Page + components (`app/page.tsx`, `components/`)
- [x] Verify it: `/verify todo-crud`
- [x] Test it: `/test todo-crud`

## Legend

- **Weight**: lean (skip design-review and harden) · medium (normal path) · full (design-review and harden required)
- **Status**: planned → in-progress → done; existing (pre-workflow); dropped (de-scoped)

## /roadmap complete

**Mode**: add

**Feature enrolled**:
- 5. Replace Turso with Neon Postgres — medium, needs ADR, inherits Skateboard approach

**Recommended next**: `/blueprint neon-migration` to design the adapter choice, schema migration, and connection strategy.
