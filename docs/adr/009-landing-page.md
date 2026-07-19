# 009. Landing page

**Status**: Proposed

## Summary

Add a public marketing landing page at `/` for unauthenticated visitors, replacing the current redirect to `/login`. Authenticated users continue to see their todo dashboard. The page uses conditional server side rendering with a narrow `proxy.ts` change.

## Context

The app currently redirects all unauthenticated requests from `/` to `/login` via `proxy.ts`. There is no public facing surface. Adding a landing page gives the app a discoverable home page for search engines and social sharing, communicates the product's value before sign in, and provides a second conversion point after sign out.

The project uses Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, and a design system with UI primitives (`components/ui/`) and design tokens in `app/globals.css`. The Skateboard approach applies: ship the thinnest usable whole first.

## Requirements

**AC-1: Landing page for unauthenticated visitors.** Visiting `/` without a session renders a landing page with a hero section, feature highlights, a secondary call to action, and a footer. No redirect to `/login` occurs.

**AC-2: Authenticated users see the todo dashboard.** Visiting `/` with a valid session renders the existing todo app (list, form, filters, categories) unchanged.

**AC-3: Hero section.** The hero contains a benefit focused headline ("Never miss a deadline again"), supporting subcopy, and a "Get started" button linking to `/login`.

**AC-4: Feature highlights.** Three cards with colored icons (using the design system's primary, danger, and success tokens) describe key capabilities: Priorities (color badges), Categories (organize with colours), and Drag and drop (reorder your way). Each card has a short one line description.

**AC-5: Secondary CTA.** A "Ready to get organized?" section with a brief subcopy and a prominent CTA button linking to `/login` appears after the feature cards, before the footer.

**AC-6: Footer.** A footer with a copyright line ("© 2026 Todo"), a link to `/login`, and a link to the project's GitHub repository. Uses muted foreground from the design tokens.

**AC-7: SEO metadata.** The landing page includes a `<title>` tag, a `<meta name="description">`, and Open Graph tags (title, description). No structured data is required for this slice.

**AC-8: Sign out lands on the landing page.** After signing out, the user is redirected to `/` and sees the landing page (not `/login`).

**AC-9: Login page behaviour unchanged.** `app/login/page.tsx` still redirects authenticated users to `/`. The login page itself is unchanged.

**AC-10: No loading flash.** The auth check (`auth()`) runs server side, so there is no client side flash of the wrong view.

## Options considered

### Option A: Conditional page rendering + narrow proxy change (chosen)

Modify `proxy.ts` to allow `/` through for unauthenticated users. `app/page.tsx` calls `auth()` and conditionally renders the landing page (null session) or the todo dashboard (valid session). One URL, two views. No route restructuring.

### Option B: Separate routes

Move the todo app to a new route (e.g. `/app`) and keep `/` as the landing page. Changes URL structure for existing users, requires updating all server action redirects and tests.

## Decision

Use **Option A: conditional page rendering with a narrow proxy change**. The proxy allows `GET /` for unauthenticated users. `app/page.tsx` becomes a server component that branches on `auth()`: null session renders the landing page, valid session renders the existing dashboard. The landing page is extracted into a separate component (`components/LandingPage.tsx`) to keep `page.tsx` readable.

## Rationale

One URL for both views is the simplest user experience. It avoids breaking existing bookmarks and share URLs. The conditional branch in `page.tsx` is a single `if` statement — the existing dashboard code path is untouched. Extracting the landing page into its own component keeps the page file from becoming a monolith.

No new dependencies are needed. The existing design tokens and UI primitives (Button) cover all the landing page's visual needs. Tailwind CSS 4 utility classes handle layout and spacing without new configuration.

## Feature design

### Page composition

```
LandingPage (/)
├── Hero
│   ├── Headline: "Never miss a deadline again"
│   ├── Subcopy (1–2 sentences)
│   └── Button: "Get started" → /login
├── Feature cards (3 columns)
│   ├── Priorities card (icon, heading, description)
│   ├── Categories card (icon, heading, description)
│   └── Drag & drop card (icon, heading, description)
├── Secondary CTA
│   ├── Heading: "Ready to get organized?"
│   ├── Subcopy
│   └── Button → /login
└── Footer
    ├── © 2026 Todo
    ├── Login link → /login
    └── GitHub link
```

### Component inventory

| Component | Status |
|---|---|
| `Button` (primary variant) | Existing (`components/ui/Button.tsx`) |
| Feature card | New (inline in `LandingPage.tsx`, or a small internal component) |
| `LandingPage.tsx` | New server component |

### Routing

| Route | Auth required? | Behaviour |
|---|---|---|
| `GET /` | No | Renders `LandingPage` when unauthenticated, dashboard when authenticated |
| `GET /login` | No | Renders login page; redirects authenticated users to `/` |

### Proxy change

`proxy.ts` currently redirects all unauthenticated requests to `/login`. The change allows `GET /` to pass through unauthenticated. All other routes remain protected. The matcher is updated to exclude `/`.

### SEO metadata

```
<title>Todo — Stay organized, one task at a time</title>
<meta name="description" content="A simple, fast todo app with priorities, categories, and drag-and-drop reorder. Sign in to get started.">
<meta property="og:title" content="Todo — Stay organized, one task at a time">
<meta property="og:description" content="A simple, fast todo app with priorities, categories, and drag-and-drop reorder.">
```

### Critical test scenarios

| Scenario | AC |
|---|---|
| Unauthenticated visitor hits `/`, sees landing page with all sections | AC-1, AC-3, AC-4, AC-5, AC-6 |
| Authenticated user hits `/`, sees todo dashboard (not landing page) | AC-2 |
| Landing page has correct `<title>` and OG tags | AC-7 |
| Sign out redirects to `/` and shows landing page | AC-8 |
| Authenticated user hitting `/login` redirects to `/` (todo dashboard) | AC-9 |
| No client side flash when auth state resolves | AC-10 |
| Clicking "Get started" goes to `/login` | AC-3, AC-5 |

## Build plan

**Build approach**: Skateboard — ship a working landing page as the thinnest usable whole.

1. **Proxy change** (AC-1, AC-2, AC-10): modify `proxy.ts` to allow `GET /` through unauthenticated. Update the matcher.
2. **LandingPage component** (AC-1, AC-3, AC-4, AC-5, AC-6): create `components/LandingPage.tsx` as a server component with hero, three feature cards, secondary CTA, and footer. Use existing design tokens and `Button` primitive.
3. **Page routing** (AC-1, AC-2, AC-9): update `app/page.tsx` to branch on `auth()` — render `LandingPage` when the session is null, render the existing dashboard when authenticated.
4. **SEO metadata** (AC-7): add `<title>`, `<meta>`, and Open Graph tags to the landing page's metadata export.
5. **Sign out flow** (AC-8): verify the existing `signOut` redirect (currently goes to `/login`) lands on `/` instead.
6. **Tests** (AC-1 through AC-10): update `proxy.test.ts` for the new matcher, add `LandingPage` rendering tests, update E2E tests.

## Consequences

**Positive:**
- The app has a discoverable public home page
- No URL restructuring — existing bookmarks and flows are unchanged
- The landing page requires no new dependencies
- SEO metadata makes the page indexable and shareable

**Negative:**
- `page.tsx` grows a conditional branch (mitigated by extracting `LandingPage.tsx`)
- Sign out redirect target changes from `/login` to `/` — must verify the existing sign out server action handles this

## Follow-up

None for this slice. Future landing page iterations could add testimonials, a pricing section, or analytics tracking.

## References

None.
