# Verify: authentication system · ADR 008 · updated 2026-07-18
_Steps derived from ADR 008 acceptance criteria. `/verify` runs these; `/test` locks the durable ones._
## UI / manual
- [ ] Visit `/` unauthenticated → redirected to `/login` → AC-5
- [ ] Click "Continue with Google" on `/login` → redirected to Google OAuth → AC-1
- [ ] Click "Continue with GitHub" on `/login` → redirected to GitHub OAuth → AC-2
- [ ] Sign up with email `test@example.com` + password → redirected to `/` with empty todo list → AC-3, AC-7
- [ ] Sign out → redirected to `/login` → AC-6
- [ ] Sign in again with same email/password → sees todos created earlier → AC-3, AC-4
- [ ] Sign up with different email, create todos → cannot see the other user's todos → AC-4
## Commands
- [ ] `npx vitest run` → 120 tests pass (13 test files) → AC-8
- [ ] `npx tsc --noEmit` → clean, no errors
- [ ] `npx playwright test` → all E2E tests pass with auth helper → AC-1 through AC-7
## Acceptance-criteria coverage
- AC-1 covered by Google OAuth flow · AC-2 by GitHub OAuth flow · AC-3 by email/password sign up/in · AC-4 by user isolation check · AC-5 by redirect test · AC-6 by sign out test · AC-7 by first sign in creates account · AC-8 by vitest run
