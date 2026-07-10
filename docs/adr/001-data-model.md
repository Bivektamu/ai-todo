# ADR 001: Data model (Todo)

Status: Accepted

## Context

The todo app needs a persistence layer for todo items. The stack uses Prisma with SQLite. This ADR defines the core Todo entity schema.

## Decision

A single `Todo` model with five fields:

```prisma
model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- **`id`**: autoincrement integer. Chosen over UUID/cuid because SQLite handles it natively and a single-user app doesn't need distributed ID generation.
- **`title`**: plain String with no length constraint (SQLite doesn't enforce varchar limits anyway).
- **`completed`**: Boolean with default `false` — new todos start incomplete.
- **`createdAt` / `updatedAt`**: standard Prisma timestamps using `@default(now())` and `@updatedAt`.

## Alternatives considered

- **UUID/cuid for id**: more portable and collision resistant, but adds complexity with no benefit for a single-user SQLite app.
- **Separate `TodoList` model**: overkill for the MVP. One flat list is the thinnest usable whole. If grouping is needed later, it can be added as a new feature.

## Consequences

- Simple flat schema, easy to query: `findMany`, `create`, `update`, `delete`.
- No migrations needed early — `npx prisma db push` suffices for prototyping.
- Adding fields (due date, priority, etc.) later is a straightforward schema change.
