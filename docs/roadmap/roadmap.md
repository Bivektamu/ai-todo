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
| 7 | Drag-and-drop reorder | Skateboard | medium | yes | done |
| 8 | Todo categories | Skateboard | medium | yes | done |
| 9 | Design system | Polish | full | yes | done |

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

### 7. Drag-and-drop reorder

Intent: let the user reorder todos by dragging them in the list, giving manual control over sequence beyond the existing sort options (priority, due date, newest).

Done when: user can drag any todo to a new position in the list; the order persists across page reloads; reordering works alongside the existing filter bar (filtered view reorder respects the full list order).

Weight: medium

ADR: [005-drag-and-drop-reorder](../adr/005-drag-and-drop-reorder.md)

Code area: `app/generated/prisma/schema.prisma`, `app/actions.ts`, `components/TodoList.tsx`, `components/TodoFilter.tsx`, `app/page.tsx`

Status: done

- [x] Design it (ADR)
- [x] Build it: `/develop drag-and-drop-reorder`
  - [x] Schema migration: add sortOrder field + backfill
  - [x] Server action: reorderTodo with transactional renumbering
  - [x] Drag-and-drop UI: @dnd-kit grip handle + DndContext + SortableContext
  - [x] Sort dropdown: Custom option, default sort to custom
  - [x] Filter coexistence: onDragEnd maps through full list
  - [x] createTodo sets sortOrder = max + 1
- [x] Verify it: `/verify drag-and-drop-reorder`
- [x] Test it: `/test drag-and-drop-reorder`

### 8. Todo categories

Intent: let users organize todos into named categories with colours, assign a category to any todo at creation or inline edit, and filter the list by category chips in the filter bar. A separate Category entity with full CRUD, colour picker, and per-category views.

Done when: user can create, rename, and delete categories with a colour picker; assign a category to any todo (at creation or inline edit); the list shows coloured category badges; the filter bar shows a chip for each category that toggles visibility; existing CRUD, sort, drag-and-drop, and all tests still pass.

Weight: medium

ADR: [006-todo-categories](../adr/006-todo-categories/index.md)

Code area: `app/generated/prisma/schema.prisma`, `app/actions.ts`, `components/CategoryModal.tsx`, `components/TodoForm.tsx`, `components/TodoList.tsx`, `components/TodoFilter.tsx`, `app/page.tsx`

Status: done

- [x] Design it (ADR)
- [x] Build it: `/develop todo-categories`
  - [x] Schema + actions: Category model, FK, createCategory/renameCategory/deleteCategory, modify createTodo/updateTodo (AC-1, AC-2, AC-5, AC-6)
  - [x] Category modal: Tailwind modal with inline add/rename/delete + colour picker (AC-1)
  - [x] Todo integration + filter: category select in form + inline, coloured badges, category chips in filter bar (AC-2, AC-3, AC-4)
  - [x] Tests: unit tests for new actions, component test updates, Playwright E2E scenarios (AC-6)
- [x] Verify it: `/verify todo-categories`
- [x] Test it: `/test todo-categories`

## Legend

- **Weight**: lean (skip design-review and harden) · medium (normal path) · full (design-review and harden required)
- **Status**: planned → in-progress → done; existing (pre-workflow); dropped (de-scoped)

## /develop complete

**Mode**: feature · Facade approach

**ADR**: [007-design-system](../adr/007-design-system.md)

**Built**:
- Design tokens: `@theme` block in `app/globals.css` with 7 colour tokens (background, surface, foreground, muted, border, primary, danger, success) plus light/dark overrides via `prefers-color-scheme`
- `components/ui/Button.tsx`: 5 variants (primary, secondary, danger, ghost, icon), 2 sizes (sm, md), focus rings, disabled state
- `components/ui/Input.tsx`: text and date, forwarded ref, focus rings
- `components/ui/Badge.tsx`: coloured pill with `color` prop
- `components/ui/Select.tsx`: custom chevron, focus rings
- `components/ui/Checkbox.tsx`: custom styled checkbox with checkmark SVG
- `components/ui/Modal.tsx`: overlay + panel, Escape/click to close, focus management
- `components/ui/CatalogueSection.tsx`: catalogue layout wrapper
- `app/ui/page.tsx`: component catalogue at `/ui` rendering every primitive with all variants
- Integration: `TodoForm.tsx`, `TodoList.tsx`, `TodoFilter.tsx`, `CategoryModal.tsx`, `app/page.tsx` all use design tokens and UI primitives instead of ad hoc Tailwind classes
- Unit tests: 6 test files with 37 tests for all primitives (Badge, Button, Checkbox, Input, Modal, Select)
- All 117 tests pass (12 test files, 0 failures)

**Recommended next**: `/verify design-system` to smoke test the dev server at `/` and `/ui`, then `/test design-system` for E2E.

## Polish

### 9. Design system &middot; Facade

Intent: establish a centralized design system with design tokens (colours, spacing, typography) and a set of reusable base UI components (Button, Input, Badge, Modal, Select), replacing ad hoc duplication across the existing todo UI with consistent primitives. Facade approach: build the visual component library and token definitions first as a standalone layer, then integrate into the app.

Done when: a `components/ui/` directory holds reusable primitives; design tokens are defined in one place (Tailwind theme or CSS custom properties); a component catalogue or story is viewable; existing pages use the new components and tokens; all existing tests still pass.

Weight: full

ADR: [007-design-system](../adr/007-design-system/index.md)

Code area: `components/ui/`, `app/globals.css`, `tailwind.config.ts`, `components/TodoForm.tsx`, `components/TodoList.tsx`, `components/TodoFilter.tsx`, `components/CategoryModal.tsx`, `app/page.tsx`

Status: done

- [x] Design it (ADR)
- [x] Build it: `/develop design-system`
  - [x] Design tokens + Button, Input primitives (AC-1, AC-2, AC-3)
  - [x] Badge, Select, Checkbox, Modal primitives (AC-1, AC-3)
  - [x] Catalogue page + integration into existing pages (AC-4, AC-6)
  - [x] Tests and verification (AC-1, AC-3, AC-5, AC-6)
- [x] Verify it: `/verify design-system`
- [x] Test it: `/test design-system`
