# Hardening: Authentication system (ADR 008)

**Date**: 2026-07-18
**Scope**: auth.ts, app/actions.ts, proxy.ts, app/login/page.tsx, app/page.tsx
**Test signal**: vitest + playwright (configured, 139 unit tests + auth E2E)

## Risk posture: Harden before merge

Three issues must be fixed before this ships to production. The remaining items are should-harden or watch/accept.

---

## Must-fix before merge (3)

### 1. Race condition in implicit sign-up (Concurrency) · `auth.ts:47-54`

**The bug**: The `authorize` function checks if a user exists, then creates one if not. Two concurrent requests with the same new email both pass the `findUnique` check and both attempt `create`. The database unique constraint on `email` stops a duplicate, but the losing request gets an unhandled `P2002` Prisma error instead of a clean `null` return.

**Evidence**: Lines 43-54 in `auth.ts`. The `findUnique` and `create` are not wrapped in a transaction or handled for the unique constraint violation.

**Fix**: Wrap the find-or-create in a try/catch that catches `P2002` (unique constraint) and returns `null`, or use an upsert. Alternatively, swallow Prisma errors in the authorize function and always return `null` on failure.

**Regression test**: Write a Vitest test that simulates `findUnique` returning `null` but `create` throwing `P2002`. Assert `authorize` returns `null`, not an error.

### 2. No rate limiting on credentials endpoint (Security) · `auth.ts:27-55`

**The bug**: The credentials `authorize` function has no rate limiting. An attacker can submit unlimited login attempts against the `/api/auth/callback/credentials` endpoint, brute-forcing passwords or enumerating valid emails.

**Evidence**: No rate limit middleware, no attempt counter in the authorize function. The ADR explicitly defers rate limiting to a later slice, but the credentials provider is shipping now.

**Fix**: Add in-memory rate limiting (a simple Map with TTL, or `next-rate-limit`) on the credentials sign-in. Block after 5 failed attempts per IP/email within 15 minutes. Log and return a generic error.

**Regression test**: E2E test that submits 6 rapid credential attempts and verifies the 6th is rejected with a non-revealing error.

### 3. No password strength validation (Input validation) · `auth.ts:27-55`

**The bug**: The credentials provider accepts any non-empty password string. A user can set `"a"` as their password. There is no minimum length, no complexity requirement, and no feedback.

**Evidence**: Lines 33-35 only check `!credentials?.email || !credentials?.password`. No length or complexity check on the password value.

**Fix**: Add minimum password length (8+ characters). Reject with `null` for passwords shorter than the minimum. Do not enforce character class requirements (uppercase/digit/symbol) unless the ADR or roadmap calls for it.

**Regression test**: Vitest test that passes a 3-character password and asserts `authorize` returns `null`.

---

## Should-harden (5)

### 4. No session revocation mechanism · `auth.ts:8-10`

JWT sessions are stateless and cannot be revoked server-side. If a user reports account compromise or wants to "sign out everywhere," there is no mechanism. Risk is low for a personal todo app but grows with user count. Consider a `tokenVersion` field on User, incremented on password change or "sign out everywhere," and validated in the JWT callback.

### 5. Email case collision between OAuth and credentials · `auth.ts:37`

The credentials `authorize` lowercases email on sign-in and sign-up. OAuth providers (Google, GitHub) return email as-is from the provider. If a user signs up with `User@Example.com` via Google, then tries `user@example.com` via credentials, they become separate accounts. Add email normalization in the JWT/session callbacks or enforce lowercase on User creation from OAuth.

### 6. No AUTH_SECRET validation at startup · `auth.ts:9`

If `AUTH_SECRET` is missing or weak, JWTs can be forged. Auth.js uses the secret for signing. Add an assertion at the top of `auth.ts`: if `process.env.AUTH_SECRET` is not set or is shorter than 32 characters, throw immediately. This fails fast in development rather than silently accepting weak tokens.

### 7. Silent failure on server action errors · `app/actions.ts:*`

All server actions swallow errors with `console.error` and return `undefined`. The UI gets no feedback when a mutation fails (network error, DB down, constraint violation). For a personal app this is acceptable but fragile. Consider returning a result type (`{ ok: true } | { ok: false, error: string }`) so the UI can surface "Something went wrong" to the user.

### 8. No request size limit on credentials form · `app/login/page.tsx:62-88`

The credentials form posts email and password via FormData with no size limit enforcement. A malicious client could send a multi-megabyte payload. Next.js has a default body size limit (1MB for server actions), which provides some protection, but no explicit guard exists in the authorize function. Add a length check on credentials (email < 255 chars, password < 128 chars).

---

## Watch / accept (3)

### 9. JWT token lifetime is Auth.js default (30 days) · `auth.ts:10`

No explicit `maxAge` configured. The default 30-day session is generous for a productivity app. If this moves to a SaaS model, reduce to 7 days with refresh. Acceptable for a personal app.

### 10. `parseInt(session.user.id, 10)` repeated in every action · `app/actions.ts:*`

If the session shape changes (e.g., Auth.js v6 changes the ID type), every action breaks. A single `getUserId(session)` helper would isolate this. Low risk since the session contract is stable.

### 11. Auth.js dependency pinned to v5 · `package.json`

Auth.js releases security patches regularly. Without a lockfile audit step in CI, a critical CVE in `next-auth` could go unnoticed. Add `npm audit` or Dependabot to the project pipeline.

---

## Verification

- [ ] Race condition test passes (must-fix 1)
- [ ] Rate limit test passes (must-fix 2)
- [ ] Password minimum length test passes (must-fix 3)
- [ ] All 139 existing tests still pass
- [ ] `npx tsc --noEmit` is clean
