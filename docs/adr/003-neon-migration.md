# ADR 003: Neon Postgres migration

Status: Accepted

## Context

The todo app currently uses SQLite (libsql adapter, Turso compatible) as its database. The request is to replace it with Neon, a serverless Postgres platform. The app is a single-page Next.js 16 CRUD app with one `Todo` model. There is no production data to migrate.

## Decision

### Adapter: `@prisma/adapter-neon`

Replace `@prisma/adapter-libsql` with `@prisma/adapter-neon`. This is Prisma's official Neon adapter and follows the same driver-adapter pattern already in use. The singleton in `lib/prisma.ts` changes from:

```ts
import { PrismaLibSql } from "@prisma/adapter-libsql";
// ...
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.DATABASE_TOKEN,
});
```

To:

```ts
import { PrismaNeon } from "@prisma/adapter-neon";
// ...
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
```

No `authToken` needed — Neon authenticates via the connection string. The `as never` cast on `new PrismaClient({ adapter })` stays (it is a known Prisma 7 adapter typing workaround).

### Schema: `provider = "postgresql"`

Change the datasource in `app/generated/prisma/schema.prisma`:

```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
}
```

The `Todo` model needs no changes — `@default(autoincrement())` works identically for both providers.

### Connection: single `DATABASE_URL`

Neon provides a `postgresql://` connection string. Set it in `.env` as `DATABASE_URL`. The `DATABASE_TOKEN` env var used by Turso is no longer needed. For local dev without Neon, the `DATABASE_URL` can point to any Postgres instance (local, Docker, etc.).

### prisma.config.ts: unchanged

The config file still maps `DATABASE_URL` for CLI operations (`prisma db push`, `prisma generate`). The adapter handles runtime connections independently.

### Migration: `prisma db push`

Since there is no production data to preserve, `npx prisma db push` is sufficient. No `prisma migrate dev` needed at this stage.

### Package changes

- Remove: `@prisma/adapter-libsql`
- Add: `@prisma/adapter-neon`

`@prisma/client` and `prisma` stay at their current versions.

## Alternatives considered

- **`@neondatabase/serverless` directly**: Neon's native serverless driver gives more control over pooling and timeouts, but adds more boilerplate. The Prisma adapter is simpler and consistent with the existing pattern.
- **`pg` (node-postgres) with `@prisma/adapter-pg`**: mature and well tested, but not optimized for serverless cold starts the way Neon's driver is. Neon's adapter is the better fit for a Next.js app that may deploy to serverless.
- **Direct connection string (no adapter)**: Prisma 7 supports `url = env("DATABASE_URL")` in the datasource block for Postgres without an adapter. This skips the driver adapter but means Prisma manages the connection pool directly. The adapter approach is preferred because it keeps the pattern consistent and gives more control if pooling is needed later.

## Consequences

- Schema provider change requires `npx prisma generate` to regenerate the client (`@/app/generated/prisma/client`).
- The generated client path and import stay the same — no downstream changes to `app/actions.ts` or components.
- `prisma db push` creates a fresh Postgres schema. The existing SQLite `dev.db` file becomes unused and can be deleted.
- Adding an explicit `connectionString` parameter (no `??` fallback) means the app will fail fast at startup if `DATABASE_URL` is missing, which is the correct behavior for Postgres (there is no sensible file-based default like `file:./dev.db`).
