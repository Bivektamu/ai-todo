# ADR 004: Todo enrichments (due dates, priority, filtering)

Status: Accepted

## Summary

Extend the existing Todo model and UI with optional due dates (date only, overdue highlighting), priority levels (LOW/MEDIUM/HIGH as a Postgres enum, defaulting to MEDIUM), and a client side filter bar that toggles all/active/completed and sorts by priority or due date. Existing CRUD behavior is preserved; the new fields are editable inline on each todo row.

## Context

The skateboard Todo CRUD (ADR 002) works and is deployed on Neon Postgres (ADR 003). The roadmap's next thickening step is "Todo enrichments": due dates, priority levels, and filtering. The current Todo model has five fields: `id`, `title`, `completed`, `createdAt`, `updatedAt`. The stack is Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, and Prisma with the Neon adapter.

## Requirements

**AC-1: Due dates.** User can set an optional due date (date only, no time) on any todo at creation or edit. Overdue todos (dueDate before today, UTC midnight) show a visual cue. Clearing the date input sets dueDate to null.

**AC-2: Priority.** User can set a priority (LOW, MEDIUM, HIGH) on any todo at creation or edit. Default is MEDIUM. Each priority level has a distinct color badge in the list.

**AC-3: Filter bar.** A filter bar between the form and the list provides: status toggles (All / Active / Completed) as pill buttons, and a sort dropdown (Priority: High first / Due date: soonest first / Newest: created descending). All filtering and sorting is client side.

**AC-4: Inline editing.** Each todo row shows editable priority (dropdown) and due date (date input) controls. Changes submit via a new `updateTodo` server action.

**AC-5: Backward compatibility.** All existing CRUD tests pass. Existing todos without priority or dueDate (null) display gracefully.

## Options considered

### Priority representation

| Option | Verdict |
|--------|---------|
| String with app-level validation | Simpler, no migration complexity, easy to extend. |
| **Postgres native enum** | **Chosen.** Stricter at the DB level, prevents invalid states, idiomatic for Postgres. |
| Integer (0/1/2) | Tiniest storage but loses readability in raw queries. |

### Due date representation

| Option | Verdict |
|--------|---------|
| **`DateTime?` (nullable)** | **Chosen.** Native Prisma/Postgres date type, sorts and filters correctly at the DB level. Stored as midnight UTC, rendered date-only. |
| `String?` (ISO date text) | Simpler to reason about but loses DB-level date operations. |

### Date picker

| Option | Verdict |
|--------|---------|
| **Native `<input type="date">`** | **Chosen.** Zero dependency, full browser support, Tailwind styled, fits the skateboard philosophy. |
| `react-day-picker` | Richer UX (custom calendar popover) but adds a dependency and ~15 KB. |

### Filtering approach

| Option | Verdict |
|--------|---------|
| **Client side state only** | **Chosen.** No server roundtrips for toggling filters, self contained, simple. Appropriate for the current scale (single user, tens to hundreds of todos). |
| URL based (server side) | Filter/sort state in URL params, server queries change. Over engineered for the current scale but a natural upgrade path later. |

### Editing pattern

| Option | Verdict |
|--------|---------|
| **Inline controls per row** | **Chosen.** Direct, no modal, follows the existing inline toggle/delete pattern. Each row carries a priority dropdown and a date input. |
| Modal/dialog | A full edit dialog per todo. More friction for quick changes. |
| Creation only | Priority and due date set once and frozen. Too restrictive. |

## Decision

### Data model changes

Add two fields to the `Todo` model:

```prisma
enum Priority {
  LOW
  MEDIUM
  HIGH
}

model Todo {
  id        Int       @id @default(autoincrement())
  title     String
  completed Boolean   @default(false)
  priority  Priority  @default(MEDIUM)
  dueDate   DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

- **`priority`**: Postgres native enum `Priority` with values LOW, MEDIUM, HIGH. Defaults to MEDIUM. Required (non nullable) so every todo always has a priority.
- **`dueDate`**: nullable `DateTime`, stored as midnight UTC. Date only semantics (the app renders and edits the date component only).

### Server actions

`createTodo` extended to accept `priority` and `dueDate` from FormData alongside `title`. New `updateTodo` action patches `priority` and/or `dueDate` by id. `toggleTodo` and `deleteTodo` are unchanged.

### Overdue computation

Computed at render time in `page.tsx`: a todo is overdue when `dueDate` is set and `dueDate < new Date()` (midnight UTC comparison). No schema change, no generated column.

### Filter bar

Client side component (`TodoFilter.tsx`) rendered between `TodoForm` and `TodoList`. Holds three pieces of state: the active status filter (all / active / completed), the active sort (priority / dueDate / newest), and passes filtered/sorted todos to `TodoList`. No URL params, no server involvement.

### Inline editing UX

Each todo row in `TodoList` carries:
- A `<select>` for priority with three options, wrapped in a `<form>` with `action={updateTodo}`. Changing the dropdown auto submits.
- An `<input type="date">` for due date, also wrapped in a `<form>` with `action={updateTodo}`. Clearing the input (empty value) sets dueDate to null on the server.
- A hidden `id` field in each form.

## Rationale

The design layers enrichment onto the existing CRUD without disrupting it. The Postgres enum for priority is stricter than a plain string and costs no extra complexity with `prisma db push`. The native date input keeps the dependency count at zero and fits the skateboard's "just enough" philosophy. Client side filtering is the right call at this scale: a single user with tens to hundreds of todos gains nothing from server side filters and pays the cost of roundtrips. Inline editing avoids modals and follows the pattern already established by the inline toggle and delete buttons.

## Build plan

1. **Schema migration** (AC-1, AC-2): add `Priority` enum and `dueDate` field, run `prisma db push`, regenerate Prisma client. Verify `npx prisma generate` succeeds and the generated types include the new fields.

2. **Server actions** (AC-1, AC-2, AC-5): extend `createTodo` to accept `priority` and `dueDate` from FormData; add `updateTodo` action that patches `priority` and/or `dueDate` by id. Update existing action tests.

3. **TodoForm enrichment** (AC-1, AC-2): add a priority `<select>` (LOW / MEDIUM / HIGH, default MEDIUM) and a `<input type="date">` for due date to the creation form. Update `TodoForm` tests.

4. **TodoList enrichment** (AC-1, AC-2, AC-4): add priority badge (color coded: HIGH red, MEDIUM amber, LOW green), due date display with overdue highlight (red text when overdue), inline priority dropdown and date input in `<form>` wrappers per row. Update `TodoList` tests.

5. **Filter bar** (AC-3): new `TodoFilter` client component with status pill toggles and sort dropdown. Filtering and sorting logic applied to the todos array before passing to `TodoList`. Test the filter/sort logic.

6. **Page integration** (AC-1, AC-5): wire `TodoFilter` into `app/page.tsx` between `TodoForm` and `TodoList`. Add overdue computation (`dueDate < new Date()` for each todo). Verify the full page renders correctly.

## Critical test scenarios

- **Create with priority and due date**: form submission includes both fields, values persist in DB and render correctly (AC-1, AC-2).
- **Create without optional fields**: todo created with default MEDIUM priority and null dueDate, renders without badge crash and no date shown (AC-2, AC-5).
- **Inline edit priority**: changing the dropdown submits, page re renders with new priority badge (AC-4).
- **Inline edit due date**: changing the date submits, page re renders with updated date. Clearing the date sets it to null (AC-1, AC-4).
- **Overdue highlighting**: a todo with a past dueDate renders with the overdue visual cue. A todo with today's date or future date does not (AC-1).
- **Filter bar**: toggling Active hides completed todos. Toggling Completed hides active todos. All shows both. Sort by Priority puts HIGH first then MEDIUM then LOW. Sort by Due Date puts soonest first, nulls last. Sort by Newest preserves existing order (AC-3).
- **Existing tests pass**: all current Vitest and Playwright tests still pass after the changes (AC-5).

## Consequences

- Schema gains a Postgres enum and a nullable DateTime column. `prisma db push` handles the migration without data loss (existing rows get MEDIUM priority and null dueDate).
- Two new server action code paths: `createTodo` extracts two additional FormData fields; `updateTodo` is net new and needs its own input validation.
- Client side filtering works well at the current scale. If the list grows to thousands of todos, server side pagination and filtering will be needed — that is a separate feature.
- The native date input renders differently across browsers and OSes (Chrome shows a calendar picker, Firefox shows a text field with format validation). This is acceptable for a skateboard feature.

## Follow-up

- If the list grows beyond a few hundred items, server side filtering with URL search params should replace client side filtering.
- Drag and drop reordering was out of scope for this slice but is a natural next enrichment.
