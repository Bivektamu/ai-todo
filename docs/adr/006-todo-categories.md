# ADR 006: Todo categories

Status: Proposed

## Summary

Add a full category model so users can organize todos into named, colour coded groups with a dedicated management modal, category colour badges on each todo row, and filter chips in the existing filter bar. A separate `Category` entity with CRUD; each todo optionally belongs to one category; deleting a category safely unassigns its todos.

## Context

The skateboard Todo CRUD (ADR 002) works, with enrichments (ADR 004) adding due dates, priority, and a client side filter bar, and drag and drop reorder (ADR 005) adding manual sort. The roadmap's next thickening step is "Todo categories": a full category model allowing users to group their growing todo list. The current Todo model has eight fields: `id`, `title`, `completed`, `priority`, `dueDate`, `sortOrder`, `createdAt`, `updatedAt`. The stack is Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, and Prisma with the Neon adapter.

## Requirements

**AC-1: Category CRUD.** User can create, rename, and delete categories via a modal dialog. Each category has a name and a colour from a curated palette of 10 swatches. Name must be unique and non empty.

**AC-2: Assign category to todo.** User can assign one category to any todo at creation (in `TodoForm`) or inline edit (in `TodoList`). Todos default to no category (null). A category dropdown appears in both the creation form and each todo row's inline edit controls.

**AC-3: Category badges.** Each todo row shows a coloured badge matching its category's colour. The badge shows the category name. Uncategorized todos show no badge and render without errors.

**AC-4: Category filter chips.** The filter bar shows a chip for each existing category. Clicking a chip toggles visibility for that category's todos. Multiple chips can be active at once (union filter: show todos matching any selected category). The chips sit above the existing status pill toggles.

**AC-5: Safe deletion.** Deleting a category sets all its todos' `categoryId` to null. No data loss. Concurrent deletion (two tabs) is handled gracefully.

**AC-6: Backward compatibility.** All existing CRUD, sort, drag and drop, and all tests (Vitest and Playwright) still pass. Existing todos without a category display correctly.

## Options considered

### Category relationship

| Option | Verdict |
|--------|---------|
| **Single category per todo (nullable FK)** | **Chosen.** Simple schema, simple UI, clear filter semantics. Matches the skateboard philosophy. |
| Multiple categories per todo (join table) | More powerful but needs a `TodoCategory` join table, multi select UI, and union/intersection filter logic. Overengineered for a personal todo list. |
| Free text tags (no Category entity) | Fastest to build but no colour, no rename, no management UI. Rejected earlier in roadmap planning for the full model. |

### Category management UI

| Option | Verdict |
|--------|---------|
| **Modal dialog** | **Chosen.** Keeps the main page clean. A "Manage Categories" button opens a modal with inline add/rename/delete controls and colour swatches per category. |
| Inline panel above the todo list | Always visible, more clutter. Good for power users but adds noise for casual use. |
| Sidebar | Separate column, always visible. Overkill for a single page skateboard app. |

### Modal implementation

| Option | Verdict |
|--------|---------|
| **Zero dependency Tailwind modal** | **Chosen.** Fixed overlay with a centred card, `useState` toggle, Escape key to close, backdrop click to close. Fits the skateboard's zero dependency philosophy. ~30 lines of markup. |
| `@headlessui/react` Dialog | Accessible, animated, handles focus trapping. One extra dependency (~15KB gzipped). |
| `@radix-ui/react-dialog` | Most accessible and composable. Heavier API, adds a dependency. |

### Colour picker

| Option | Verdict |
|--------|---------|
| **Curated palette of 10 predefined colours** | **Chosen.** A row of colour swatches, single click to select. Consistent look, no free text input. Colours: `#EF4444` (red), `#F97316` (orange), `#EAB308` (amber), `#22C55E` (green), `#14B8A6` (teal), `#3B82F6` (blue), `#8B5CF6` (purple), `#EC4899` (pink), `#78716C` (warm gray), `#A855F7` (violet). |
| Free text hex input | Full flexibility but ugly input field, error prone, and poor UX on mobile. |
| Swatches plus custom hex | Best of both but adds complexity for a feature most users rarely touch. |

### Per category views

| Option | Verdict |
|--------|---------|
| **Chip filter only (no dedicated view)** | **Chosen.** Clicking a category chip filters the list to that category. The filter bar already handles this pattern. No new route or view. |
| Dedicated category page per route | Adds URL based views (`?category=work`). A natural upgrade path but not needed for v1. |

### Category deletion

| Option | Verdict |
|--------|---------|
| **Set categoryId to null on delete** | **Chosen.** Prisma's default referential action `SetNull` on optional relations handles this natively. No data loss, no friction. |
| Prevent deletion if todos use category | Protects against accidental unassignment but adds friction. The null fallback is safer. |
| Cascade delete the todos | Destructive and wrong for this use case. |

## Decision

### Data model changes

Add a `Category` model and a nullable foreign key on `Todo`:

```prisma
model Category {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  colour    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  todos     Todo[]
}

model Todo {
  id         Int       @id @default(autoincrement())
  title      String
  completed  Boolean   @default(false)
  priority   Priority  @default(MEDIUM)
  dueDate    DateTime?
  sortOrder  Int       @default(0)
  categoryId Int?
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

- **`Category.id`**: autoincrement integer primary key.
- **`Category.name`**: unique, non empty string. Validated before insert/update in server actions.
- **`Category.colour`**: hex colour string from the curated palette. Validated against the palette constant in the action.
- **`Todo.categoryId`**: nullable foreign key to `Category`. `onDelete: SetNull` means deleting a category unassigns its todos.
- **Relation**: one to many (Category → Todo), optional on the Todo side.

### Curated colour palette

Stored as a TypeScript constant in the category modal component, not in the database:

```ts
const CATEGORY_COLOURS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
  "#3B82F6", "#8B5CF6", "#EC4899", "#78716C", "#A855F7",
] as const;
```

### Server actions

Three new actions in `app/actions.ts`, following the existing pattern:

**`createCategory(formData)`** — extracts `name` and `colour`. Validates name is non empty and unique (catches Prisma `P2002` for duplicate), validates colour is in `CATEGORY_COLOURS`. Inserts and revalidates.

**`renameCategory(formData)`** — extracts `id` and `name`. Validates the same. Updates name and revalidates.

**`deleteCategory(formData)`** — extracts `id`. Deletes the row (FK sets null via `onDelete: SetNull`). Catches `P2025` (record not found) for concurrent deletion. Revalidates.

Two existing actions modified:

**`createTodo`** — additionally extracts optional `categoryId` from FormData. Parses to integer or null.

**`updateTodo`** — additionally extracts optional `categoryId` from FormData. Patches alongside priority and dueDate.

### Category management modal

New client component `CategoryModal.tsx`:

- Triggered by a "Manage Categories" button in the filter bar area.
- Fixed overlay (`fixed inset-0 bg-black/50 z-50`) with a centred white card.
- Close on Escape key (`onKeyDown` listener on the overlay), close on backdrop click, and a close button.
- Lists all existing categories, each showing: colour swatch, name (editable inline via a rename input), and a delete button.
- An "Add category" row at the bottom: name input, colour swatch picker row, and an add button.
- State: local useState for the open/closed toggle and the list of categories (passed as props from the server component).

### Todo integration

**`TodoForm`**: add a `<select>` for category between the priority and due date inputs. Options populated from categories passed as props from the server component. Default empty option: "No category."

**`TodoList`**: each todo row gets:
- An inline category `<select>` (same pattern as the existing priority select and date input, wrapped in a `<form>` with `action={updateTodo}`).
- A coloured badge showing the category name, with `backgroundColor` set to the category's colour. Hidden when `categoryId` is null.

### Filter bar integration

**`TodoFilter`**: receives the categories array as a new prop. Renders a row of category chips above the status pills:

- Each chip shows the category name with the category's colour as a left border or background tint.
- Clicking toggles a `Set<number>` of active category IDs in local state.
- When one or more chips are active, the filtered list is further narrowed to todos whose `categoryId` is in the active set.
- Zero active chips = show all (no category filter).

### Category sort option

A new "Category" sort option in the sort dropdown (alongside Priority, Due Date, Newest, Custom). When selected, todos group by category name alphabetically, with uncategorized todos at the end.

### Edge cases

- **Duplicate category name**: Prisma unique constraint throws `P2002`. Catch in `createCategory` and `renameCategory`, return silently (the UI can show an inline error).
- **Concurrent deletion**: `deleteCategory` catches `P2025` (record not found) and returns silently.
- **Empty name validation**: `name.trim().length > 0` check before any insert/update, same pattern as `createTodo`'s title validation.
- **Invalid colour**: validate against `CATEGORY_COLOURS` constant; reject unknown values.
- **Null category rendering**: todos with `categoryId === null` show no badge and no category select value. This is the default and the happy path.
- **Category assigned to non existent id**: the Prisma relation constraint prevents this at the DB level. The server action catches the error and returns.

## Rationale

The design layers categories onto the existing architecture without disrupting it. A separate `Category` entity is a natural extension of the data model — it uses Prisma relations idiomatically (`onDelete: SetNull`) and requires no raw SQL. The single category per todo with a nullable FK is the simplest correct model and matches what most personal todo apps offer (Apple Reminders, Things, Todoist).

The modal pattern for category management keeps the main page focused on the todo list while still giving full CRUD for categories. The zero dependency Tailwind modal fits the skateboard's "just enough" philosophy: accessible, lightweight, and no new packages.

The curated colour palette avoids the UX pitfalls of free text colour input (invalid values, poor contrast, inconsistent look) while giving enough variety (10 colours) for personal organization. Storing it as a TypeScript constant rather than in the database means no migration to change the palette later.

Filter chips follow the existing pattern from the status pills (All / Active / Completed). Union filter semantics (show todos matching any selected chip) are simpler to reason about than intersection and match how category filters typically work in todo apps.

## Consequences

- Schema gains a `Category` model (id, name, colour, timestamps) and a nullable `categoryId` FK on `Todo`. `prisma db push` handles the migration without data loss.
- Three new server actions (`createCategory`, `renameCategory`, `deleteCategory`) and two modified ones (`createTodo`, `updateTodo`). All follow the existing validation pattern.
- One new client component (`CategoryModal.tsx`) for the category management modal.
- The `TodoFilter`, `TodoForm`, and `TodoList` components receive categories as a new prop and gain category related UI.
- The `app/page.tsx` server component fetches categories alongside todos and passes them down.
- A "Category" sort option joins the existing sort dropdown.
- All existing tests need minor updates: mock the categories prop, add test cases for the new actions, and add E2E scenarios for category CRUD and filtering.

## Build plan

1. **Schema migration** (AC-1, AC-6): add `Category` model and `categoryId` FK to `Todo` in `app/generated/prisma/schema.prisma`. Run `npx prisma db push` and `npx prisma generate`. Verify the generated types include `Category` and `categoryId`.

2. **Server actions** (AC-1, AC-5): add `createCategory`, `renameCategory`, `deleteCategory` in `app/actions.ts`. Modify `createTodo` and `updateTodo` to accept optional `categoryId`. Add input validation for name uniqueness, empty name, valid colour, and concurrent deletion.

3. **Category management modal** (AC-1): new `CategoryModal.tsx` client component with zero dependency Tailwind modal (overlay, card, Escape/backdrop to close). List all categories with inline rename, delete, and colour swatch display. Add category row with name input and colour picker.

4. **Todo integration** (AC-2, AC-3): add category `<select>` to `TodoForm` and inline to `TodoList` rows. Render coloured category badge on each todo row. Handle null categoryId gracefully.

5. **Filter bar + sort** (AC-4): add category chips to `TodoFilter`. Implement union filter logic (`Set<number>` of active IDs). Add "Category" sort option that groups by category name.

6. **Tests** (AC-6): update server action unit tests for new and modified actions. Update component tests for new props and UI. Add Playwright E2E scenarios: create/rename/delete category, assign category to todo, filter by category chip, verify badge rendering, verify category sort.

## Critical test scenarios

- **Create category**: submit the modal form with name and colour. Category appears in the list and in the todo dropdown (AC-1).
- **Rename category**: rename inline in the modal. Name updates, existing todos show the new name (AC-1).
- **Delete category with assigned todos**: delete a category that has todos. Todos keep their other data but show no badge (AC-5).
- **Assign category at creation**: create a todo with a category selected. Todo appears with the correct badge (AC-2).
- **Inline edit category**: change a todo's category via the inline select. Badge updates immediately (AC-2, AC-3).
- **Filter by category chip**: click one chip, only that category's todos show. Click another, both show. Deselect both, all show (AC-4).
- **Duplicate category name**: try to create a category with an existing name. Action rejects it, modal shows the error (AC-1).
- **Empty category name**: try to create a category with only whitespace. Action rejects it (AC-1).
- **Existing tests pass**: all Vitest and Playwright tests still pass after the changes (AC-6).
