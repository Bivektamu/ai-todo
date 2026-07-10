# ADR 002: Todo CRUD architecture

Status: Accepted

## Context

The todo app needs a single page that supports creating, listing, toggling, and deleting todos. The stack is Next.js 16 (App Router) with Prisma/SQLite. This ADR defines how data flows between the client, server, and database.

## Decision

**Server Actions** (React Server Functions) for all mutations, with `revalidatePath` to refresh the UI.

### File structure

```
app/
  page.tsx           — async server component, fetches todos from Prisma
  actions.ts         — "use server" file: createTodo, toggleTodo, deleteTodo
components/
  TodoForm.tsx       — "use client" form with action={createTodo}
  TodoList.tsx       — "use client" receives todos, renders toggle + delete
lib/
  prisma.ts          — PrismaClient singleton
```

### Data flow

1. `page.tsx` (server) calls `prisma.todo.findMany({ orderBy: { createdAt: "desc" } })` and passes the result as props to `<TodoList>`.
2. `TodoForm` (client) submits to `createTodo(formData)` — a server action that extracts the title, inserts into the DB, and calls `revalidatePath("/")`.
3. Each todo item in `TodoList` has:
   - A toggle checkbox using `<button formAction={toggleTodo}>` — the server action toggles `completed` and revalidates.
   - A delete button using `<button formAction={deleteTodo}>` — the server action deletes the row and revalidates.
4. `revalidatePath("/")` causes the server to re-render `page.tsx` with fresh data after every mutation.

### Why Server Actions over API routes

- Single roundtrip: the server action returns updated UI + data in one response.
- Simpler: no client-side fetch/state management for CRUD. The form `action` prop handles submission natively.
- Progressive enhancement: forms work even without JavaScript.

### Prisma client singleton

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

This prevents multiple PrismaClient instances during Next.js dev hot-reload.

## Consequences

- All mutations are server-side; no client-side DB access.
- `revalidatePath` clears the full-page cache on every mutation — fine for a single-page app at this scale.
- Adding optimistic updates later would require refactoring to use `useOptimistic` in the client component, but this is unnecessary for the MVP.
