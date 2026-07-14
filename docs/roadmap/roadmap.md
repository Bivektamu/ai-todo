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
| 6 | Todo enrichments | Skateboard | medium | yes | done |

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

### 6. Todo enrichments

Intent: thicken the skateboard todo with due dates (optional deadline with overdue highlighting), priority levels (low/medium/high with color badges), and a filter bar (all/active/completed toggles, sort by priority or due date).

Done when: user can set a due date and priority on any todo; the list shows priority badges and overdue visual cues; a filter bar toggles all/active/completed and re-sorts by priority or due date; existing CRUD still works; all existing tests pass.

Weight: medium

ADR: [004-todo-enrichments](../adr/004-todo-enrichments.md)

Code area: `app/generated/prisma/schema.prisma`, `app/actions.ts`, `components/TodoForm.tsx`, `components/TodoList.tsx`, `components/TodoFilter.tsx`, `app/page.tsx`

Status: done

- [x] Design it (ADR)
- [x] Build it: `/develop todo-enrichments`
  - [x] Schema migration: add Priority enum + dueDate field (AC-1, AC-2)
  - [x] Server actions: extend createTodo, add updateTodo (AC-1, AC-2, AC-5)
  - [x] TodoForm: priority select + date input (AC-1, AC-2)
  - [x] TodoList: priority badges, due date display, inline editing (AC-1, AC-2, AC-4)
  - [x] Filter bar + page integration (AC-3, AC-1, AC-5)
- [x] Verify it: `/verify todo-enrichments`
- [x] Test it: `/test todo-enrichments`

## Legend

- **Weight**: lean (skip design-review and harden) · medium (normal path) · full (design-review and harden required)
- **Status**: planned → in-progress → done; existing (pre-workflow); dropped (de-scoped)

## /roadmap complete

**Mode**: add

**Feature enrolled**:
- 6. Todo enrichments — medium, needs ADR, inherits Skateboard approach. Due dates, priority levels (low/medium/high), and a filter bar (all/active/completed, sort by priority or due date).

**Recommended next**: `/blueprint todo-enrichments` to design the data model changes, filter strategy, and priority representation.
