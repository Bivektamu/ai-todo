# ADR 005: Drag-and-drop reorder

Status: Accepted

## Summary

Add manual drag-and-drop reordering to the todo list with a new `sortOrder` field on the Todo model, a `reorderTodo` server action, and `@dnd-kit` for the drag interaction. A "Custom" sort option in the filter bar activates the drag handles; other sort modes hide them.

## Context

The skateboard Todo CRUD (ADR 002) works, with enrichments (ADR 004) adding due dates, priority, and a client side filter bar with sort options (priority, due date, newest). The roadmap's next thickening step is drag-and-drop reorder. The current Todo model has seven fields: `id`, `title`, `completed`, `priority`, `dueDate`, `createdAt`, `updatedAt`. The stack is Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, and Prisma with the Neon adapter.

## Requirements

**AC-1: Drag to reorder.** User can drag any todo row (via a grip handle) to a new position in the list. The order persists across page reloads.

**AC-2: Custom sort mode.** A "Custom" option in the sort dropdown activates the drag handles and sorts by `sortOrder` ascending. Other sort modes (Priority, Due date, Newest) hide drag handles and sort as before.

**AC-3: Filter coexistence.** When a status filter (All / Active / Completed) is active in Custom sort mode, drag handles remain visible. Dragging an item in the filtered view places it at the correct position in the full list, not just the visible subset.

**AC-4: Accessible.** Drag handles are keyboard operable (Space/Enter to pick up, arrow keys to move, Space/Enter to drop). Screen readers announce the interaction.

**AC-5: Backward compatibility.** All existing Vitest and Playwright tests pass. Existing todos get a `sortOrder` matching their creation order on migration. Creating a new todo sets its `sortOrder` above all existing todos.

## Options considered

### Order persistence

| Option | Verdict |
|--------|---------|
| Integer with gaps (1000, 2000, …) | Insert by averaging. Efficient for single moves, but gaps eventually exhaust and need rebalancing. |
| **Integer with renumbering on each reorder** | **Chosen.** Server renumbers all todos 0, 1, 2, … on every reorder. Simple, predictable, no gap management. The cost is O(n) updates per reorder, negligible for hundreds of items. |
| Fractional indexing (lexicographic keys) | Elegant for collaborative editing but overengineered for a single-user todo list. |

### Drag library

| Option | Verdict |
|--------|---------|
| **@dnd-kit/core + @dnd-kit/sortable** | **Chosen.** Modern, lightweight (~10KB gzipped), purpose-built for React, handles keyboard accessibility, touch, collision detection, and smooth animations. The standard choice for React drag-and-drop in 2025+. |
| Native HTML5 drag-and-drop | Zero dependency but no native touch support, poor accessibility (no keyboard reorder), and limited visual feedback control. |
| @hello-pangea/dnd | Mature fork of react-beautiful-dnd but heavier (~30KB), more opinionated API, and less active development. |

### Drag handle vs whole row

| Option | Verdict |
|--------|---------|
| **Grip handle on each row** | **Chosen.** A small grip icon (six dots) on the left of each row. Avoids conflicts with the existing inline controls (priority select, date input, toggle checkbox, delete button). More discoverable than hidden hit areas. |
| Whole row draggable | Simpler visual but conflicts with every interactive element in the row. Requires complex `onPointerDown` interception. |
| Drag by title only | Ambiguous with text selection. Poor discoverability. |

### Sort integration

| Option | Verdict |
|--------|---------|
| **"Custom" sort option in the dropdown** | **Chosen.** A fourth option "Custom" joins Priority, Due date, and Newest. When active, todos sort by `sortOrder` and drag handles appear. Clear, discoverable, minimal UI change. |
| Always-on drag handles | Drag handles visible in all sort modes, but reordering while sorted by priority or due date creates confusing behavior (item snaps to a new position that doesn't match the current sort). |

### Reorder action strategy

| Option | Verdict |
|--------|---------|
| **Send targetId, server renumbers all** | **Chosen.** The client sends the dragged todo's `id` and the `targetId` (the todo it lands after, or `"__first__"` for the top). The server fetches all todos, computes the new order, and updates every `sortOrder`. Simple server logic, no risk of client/server order mismatch. |
| Client sends full ordered ID array | Client computes the new order and sends it. More network data, more client logic, risk of stale data if another mutation happened between render and drop. |
| Update only the moved item | Requires gap-based ordering (see above) and doesn't cleanly handle filter coexistence. |

### Filter coexistence strategy

| Option | Verdict |
|--------|---------|
| **Map filtered index to full list index** | **Chosen.** The client has the full todos array as props and the filtered subset for display. On drop in a filtered view, the client maps the drop position in the filtered list to the correct position in the full list, then sends the `targetId` from the full list. The server renumbers based on the full list, so the order is always correct regardless of the active filter. |
| Disable drag when filter is active | Simpler but violates AC-3. |
| Drag only within the filtered subset | Items can only reorder within their filtered group. Breaks the mental model of a single ordered list. |

## Decision

### Data model changes

Add one field to the `Todo` model:

```prisma
model Todo {
  id        Int       @id @default(autoincrement())
  title     String
  completed Boolean   @default(false)
  priority  Priority  @default(MEDIUM)
  dueDate   DateTime?
  sortOrder Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

- **`sortOrder`**: non-nullable integer. Lower numbers appear first. Defaults to `0` for new todos (the `createTodo` action will set it to `max(sortOrder) + 1`). Renumbered sequentially on every reorder.

### New server action: `reorderTodo`

```ts
export async function reorderTodo(formData: FormData) {
  const id = formData.get("id");
  const targetId = formData.get("targetId");

  // Validate id
  // Fetch all todos ordered by sortOrder
  // Remove the dragged todo from the array
  // Insert it after the targetId (or at position 0 if targetId === "__first__")
  // Renumber all sortOrder values 0, 1, 2, ...
  // Update all in a transaction
  // revalidatePath("/")
}
```

Uses `prisma.$transaction` with individual `update` calls for correctness. For a list of N todos, this is N individual updates wrapped in a single transaction, which is the safest pattern with Prisma and avoids raw SQL.

### Client: `@dnd-kit` integration

Install `@dnd-kit/core` and `@dnd-kit/sortable`. The `TodoFilter` component (which already holds filter/sort state and passes sorted todos to `TodoList`) manages the drag-and-drop state.

- When sort is "Custom", wrap the todo list in `<DndContext>` + `<SortableContext>`.
- Each todo row gets a `<SortableItem>` wrapper with a drag handle (`useSortable` + grip icon).
- On `onDragEnd`, compute the target position:
  1. Get the dragged item's `active.id` and the `over.id` (the item it landed on).
  2. Find both in the **full** todos array (not the filtered subset).
  3. Determine the `targetId` — the todo the dragged item now follows in the full list.
  4. Submit a form with `action={reorderTodo}`, passing `id` and `targetId`.

The `targetId` computation handles the filter case: if the user drags item E between A and C in a filtered view (showing only A, C, E), the client finds A and C in the full list, and the target for E is A (the item it now follows in the full order).

### Drag handle UI

A six-dot grip icon (⋮⋮ or a compact SVG grid) rendered at the left edge of each row, only when sort is "Custom". Styled with Tailwind:

```
cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300
```

The handle is a `<button>` with `aria-label="Drag to reorder"` for accessibility. `@dnd-kit`'s keyboard sensors handle Space/Enter to pick up and arrow keys to move.

### Migration

`prisma db push` adds the `sortOrder` column with a default of `0`. After push, run a one-time script that sets `sortOrder` to match creation order for all existing todos. New todos created after migration get `max(sortOrder) + 1`.

### Sort dropdown

Add "Custom" as a `SortKey` option:

```ts
type SortKey = "priority" | "dueDate" | "newest" | "custom";
```

When `sort === "custom"`, the `sortTodos` function sorts by `sortOrder` ascending and the `TodoFilter` enables drag-and-drop.

## Rationale

The design layers reordering onto the existing sort infrastructure without disrupting it. The "Custom" sort mode is a natural extension of the dropdown: it's just another way to sort, with the bonus of manual control via drag handles. Using `@dnd-kit` keeps the dependency footprint small while handling the hard parts (keyboard accessibility, touch, collision detection) that a native implementation would need dozens of lines to cover poorly. Server side renumbering is the simplest correct approach and avoids stale client state bugs.

## Build plan

1. **Schema migration** (AC-5): add `sortOrder Int @default(0)` to the Todo model, run `prisma db push`, regenerate client. Backfill existing todos with sequential `sortOrder` values matching `createdAt` order.

2. **Server action** (AC-1): add `reorderTodo` action that accepts `id` and `targetId`, fetches all todos, renumbers `sortOrder`, and updates in a transaction. Add unit tests.

3. **Drag-and-drop UI** (AC-1, AC-2, AC-4): install `@dnd-kit/core` and `@dnd-kit/sortable`. Add grip handle to `TodoList` rows. Wire `DndContext` and `SortableContext` in `TodoFilter` when sort mode is "Custom". Handle `onDragEnd` to compute `targetId` and submit the reorder action.

4. **Sort dropdown** (AC-2): add "Custom" option to the sort dropdown in `TodoFilter`. When selected, sort by `sortOrder` and show drag handles.

5. **Filter coexistence** (AC-3): ensure `onDragEnd` maps the drop position through the full todos array, not just the filtered subset, so reordering in a filtered view respects the full list order.

6. **Create with sortOrder** (AC-5): update `createTodo` to set `sortOrder` to the current maximum + 1, so new todos appear at the bottom.

7. **Test and verify** (AC-5): update existing unit tests for the new sort option and action. Add E2E tests for drag-and-drop. Verify all existing tests still pass.

## Critical test scenarios

- **Drag reorder**: drag a todo from position 2 to position 0. Page re-renders with the new order. Reload confirms persistence (AC-1).
- **Custom sort activates handles**: selecting "Custom" sort shows drag handles on every row. Selecting any other sort hides them (AC-2).
- **Filter + drag**: filter to "Active", drag an active todo to a new position. Switch to "All" filter and confirm the reorder respected the full list, not just the active subset (AC-3).
- **Keyboard reorder**: Tab to a drag handle, press Space to pick up, arrow keys to move, Space to drop. Order updates (AC-4).
- **New todo gets correct sortOrder**: create a todo, confirm it appears at the bottom of the Custom-sorted list (AC-5).
- **Existing tests pass**: all Vitest and Playwright tests still pass after the changes (AC-5).

## Consequences

- Schema gains a non-nullable `sortOrder` integer column. `prisma db push` handles the addition without data loss.
- One new server action (`reorderTodo`) with input validation and transactional updates.
- Two new npm dependencies: `@dnd-kit/core` and `@dnd-kit/sortable` (~10KB gzipped combined).
- The `TodoFilter` component gains drag-and-drop state management. The `TodoList` component gains drag handle markup and `@dnd-kit` hooks.
- The "Custom" sort option changes the default sort behavior: previously "Newest" was the default; "Custom" becomes the new default so users see their manual order on page load. The initial `sort` state in `TodoFilter` changes from `"newest"` to `"custom"`.

## Follow-up

- If the list grows beyond a few hundred items, per-reorder full renumbering could be replaced with gap-based ordering and lazy rebalancing.
- Drag between filtered groups (e.g., dragging a completed todo into the active section to uncomplete it) is a potential future enhancement but out of scope for this slice.
