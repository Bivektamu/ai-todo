# 007 Design system

**Status**: Accepted

## Summary

Establish a centralized design system for the todo app: a set of reusable UI primitives (Button, Input, Badge, Select, Modal, Checkbox) and design tokens (colours, spacing, typography, border radius, shadows) defined in Tailwind CSS 4's `@theme` directive. The primitives, tokens, component catalogue, and integration into all existing pages ship as one deliverable — no deferred integration. An in-app `/ui` route serves as the component catalogue.

## Context

The existing todo app has four ad hoc components (`TodoForm`, `TodoList`, `TodoFilter`, `CategoryModal`) that each duplicate their own button styles, input styles, badge colours, spacing, and text sizing. There is no single source of truth for the visual language. Adding new features means copying styles again, and tweaking the look across the app means hunting through every file individually.

The roadmap feature (#9, Polish phase) calls for extracting common primitives, defining tokens centrally, and integrating them into every existing page. The build approach for this feature is **Facade**: build the visual component library and tokens first, then integrate into the existing pages — but both phases ship in one deliverable, not deferred.

## Requirements

- **AC-1**: A `components/ui/` directory holds reusable **Button**, **Input**, **Badge**, **Select**, **Modal**, and **Checkbox** primitives.
- **AC-2**: Design tokens (colours, spacing scale, typography, border radius, shadows) are defined in one central place — Tailwind CSS 4's `@theme` directive in `app/globals.css`.
- **AC-3**: Each primitive supports its declared variants (Button: primary / secondary / danger / ghost / icon; Badge: coloured pill; Modal: overlay + panel; etc.).
- **AC-4**: A component catalogue is viewable at `/ui` so each primitive can be inspected in isolation with all its variants.
- **AC-5**: All existing tests still pass after the primitives are created and integrated.
- **AC-6**: Existing components (`TodoForm`, `TodoList`, `TodoFilter`, `CategoryModal`, `app/page.tsx`) use the new primitives instead of ad hoc Tailwind classes for buttons, inputs, badges, selects, modals, and checkboxes.

## Options considered

### Component approach

| Option | Tradeoff |
|---|---|
| Pure Tailwind CSS 4 (chosen) | Zero new dependencies, uses the project's existing toolchain, keeps the bundle small. Tokens via `@theme` integrate directly with Tailwind's utility classes. |
| Radix UI + Tailwind | Accessible primitives out of the box (`Dialog`, `Select`), but adds boilerplate and dependencies (`@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-checkbox`). Overkill for this app's six simple components. |
| shadcn/ui | Popular convention, builds on Radix, but brings `class-variance-authority`, `clsx`, `tailwind-merge`, and a CLI. Adds dependencies the project does not need for six primitives. |

### Component catalogue

| Option | Tradeoff |
|---|---|
| In-app `/ui` route (chosen) | A single Next.js page (`app/ui/page.tsx`) that renders every primitive with its variants. Zero new dependencies, lives in the same build, always in sync with the actual components. |
| Storybook | Full component explorer with interactive controls, but adds 200+ packages and a separate build step. Overkill for six primitives. |

### Dark mode

Chosen to support light and dark mode from the start, driven by `prefers-color-scheme` via Tailwind's `dark:` variant. Each token defines a light value and a dark override in the `@theme` block. This avoids a costly retrofit later when the primitives are already integrated.

## Decision

Build six reusable primitives as pure Tailwind CSS 4 components under `components/ui/`:

1. **Button** — variants: primary, secondary, danger, ghost, icon. Sizes: sm, md.
2. **Input** — default text and date input.
3. **Badge** — coloured pill, colour driven by a prop.
4. **Select** — styled dropdown with custom chevron.
5. **Modal** — overlay + centered panel, close on Escape and overlay click.
6. **Checkbox** — custom styled checkbox for todo completion.

Define design tokens via Tailwind CSS 4's `@theme` directive in `app/globals.css`, covering colours (background, surface, foreground, muted, border, primary, danger, success), spacing, typography, border radius, and shadows. Each colour token defines a light value and a `dark:` override.

Provide a component catalogue at `app/ui/page.tsx` that renders each primitive with all its variants in one view.

All primitives support `className` for overrides and spread standard HTML attributes. All support responsive behaviour and meet accessibility best practices (focus visible rings, semantic HTML, adequate contrast).

## Rationale

Pure Tailwind CSS 4 is the simplest path: the project already uses Tailwind, the primitives are straightforward (no complex focus management or portalling beyond what a basic `<dialog>` or `useEffect` handles), and zero new dependencies means no risk of npm cleanup removing them (a known pitfall in this project).

An in-app `/ui` route is always in sync with the actual components (same build, same Tailwind config, same tokens), needs no extra tooling, and is discoverable by any developer working on the app.

Dark mode from the start avoids the double cost of building light only and retrofitting later, and the `@theme` + `dark:` pattern makes it a simple per-token override with no runtime toggle needed.

Accessibility is handled by semantic HTML (`<button>`, `<input>`, `<select>`, `<dialog>`) styled with Tailwind, plus explicit `focus-visible:ring` on every interactive element. This is sufficient for WCAG AA without adding a headless library.

## Feature design

### Design tokens

Defined in `app/globals.css` via `@theme`:

**Colours** — each token has a light default and a `dark:` override using `prefers-color-scheme`:

```
@theme {
  --color-background: white;
  --color-surface: #f9fafb;    /* gray-50 */
  --color-foreground: #111827;  /* gray-900 */
  --color-muted: #6b7280;       /* gray-500 */
  --color-border: #e5e7eb;      /* gray-200 */
  --color-primary: #2563eb;     /* blue-600 */
  --color-danger: #dc2626;      /* red-600 */
  --color-success: #16a34a;     /* green-600 */
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: #0a0a0a;    /* gray-950 */
    --color-surface: #111827;        /* gray-900 */
    --color-foreground: #f9fafb;     /* gray-50 */
    --color-muted: #9ca3af;          /* gray-400 */
    --color-border: #1f2937;         /* gray-800 */
    --color-primary: #60a5fa;        /* blue-400 */
    --color-danger: #f87171;         /* red-400 */
    --color-success: #4ade80;        /* green-400 */
  }
}
```

**Other tokens**: spacing, font sizes, font weights, border radius, and shadows use Tailwind's defaults extended via `@theme` where needed (e.g. `--radius-md: 0.5rem`).

### Component specifications

**Button** (`components/ui/Button.tsx`):
- Props: `variant` (primary | secondary | danger | ghost | icon), `size` (sm | md), `className`, and all `<button>` HTML attributes.
- `primary`: `bg-primary text-white hover:brightness-90`
- `secondary`: `bg-surface border border-border text-foreground hover:bg-border/50`
- `danger`: `bg-danger text-white hover:brightness-90`
- `ghost`: `text-foreground hover:bg-surface`
- `icon`: same as ghost, square aspect ratio (`p-2`)
- `sm`: `px-3 py-1.5 text-sm`, `md`: `px-4 py-2 text-sm`
- All: `rounded-md font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`

**Input** (`components/ui/Input.tsx`):
- Props: `type` (text | date, default text), `className`, and all `<input>` HTML attributes.
- `bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`

**Badge** (`components/ui/Badge.tsx`):
- Props: `color` (CSS colour value or Tailwind class), `children`, `className`.
- `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`
- Colour applied via inline style `{ backgroundColor: color }` or a Tailwind class.

**Select** (`components/ui/Select.tsx`):
- Props: `className`, and all `<select>` HTML attributes (including `children` for `<option>` elements).
- Same base as Input: `bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`
- Custom chevron via `appearance-none` + CSS background image arrow.

**Modal** (`components/ui/Modal.tsx`):
- Props: `open`, `onClose`, `title`, `children`, `className`.
- Renders a `<dialog>` element with `useEffect` driven open/close (or the native `showModal()` / `close()` API).
- Overlay: `fixed inset-0 bg-black/50 z-50`
- Panel: `fixed inset-0 m-auto bg-surface rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto z-50`
- Close on Escape (native `<dialog>` behaviour) and overlay click (onClick on the overlay backdrop).
- Traps focus within the modal when open.

**Checkbox** (`components/ui/Checkbox.tsx`):
- Props: `checked`, `onChange`, `className`, and all `<input type="checkbox">` HTML attributes.
- Custom styled: hides native checkbox, renders a `h-5 w-5 rounded border-2 border-border` box, checked state fills with `bg-primary border-primary` and a checkmark (CSS pseudo-element or inline SVG).

### Dark mode

All colour tokens switch via `@media (prefers-color-scheme: dark)` in `@theme`. Primitives reference the semantic token (e.g. `bg-surface`, `text-foreground`) rather than raw colour values, so dark mode Just Works without per-component logic.

### Responsive

Primitives are responsive aware: Button sizes, Modal max-width, and spacing tokens all use Tailwind's responsive prefixes where sensible. The app is currently desktop oriented but the primitives do not lock out mobile use.

### Accessibility

- All interactive elements are native HTML (`<button>`, `<input>`, `<select>`, `<dialog>`).
- Every interactive element has `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- Modal uses `<dialog>` for native focus trapping and Escape-to-close.
- Colour contrast meets WCAG AA: the token palette uses Tailwind's built in colour scale which passes AA contrast ratios (e.g. blue-600 on white = 4.6:1, gray-500 on white = 4.5:1 at large text).
- Checkbox and Select labels are associated via `htmlFor` / wrapping `<label>`.

### Critical test scenarios

- **Button**: renders all five variants and both sizes; fires `onClick`; is disabled when `disabled` prop is set; renders `className` overrides. (maps to AC-1, AC-3)
- **Input**: renders text and date types; responds to typing; shows focus ring on focus visible. (AC-1, AC-3)
- **Badge**: renders with a colour prop; renders children inside. (AC-1, AC-3)
- **Select**: renders `<option>` children; fires `onChange`; shows focus ring. (AC-1, AC-3)
- **Modal**: renders when `open` is true; hides when `open` is false; fires `onClose` on overlay click and Escape; traps focus. (AC-1, AC-3)
- **Checkbox**: renders checked and unchecked states; fires `onChange`; shows focus ring. (AC-1, AC-3)
- **Catalogue page**: navigable at `/ui`; renders every primitive with all variants. (AC-4)
- **No regressions**: all 61 existing tests pass after primitives are created. (AC-5)

## Build plan

The Facade approach builds the visual layer first, then integrates — both phases ship in one deliverable.

1. **Define design tokens** — add `@theme` block with colour, spacing, typography, border radius, and shadow tokens to `app/globals.css`. Include dark mode overrides via `@media (prefers-color-scheme: dark)`. (AC-2)
2. **Build Button and Input primitives** — create `components/ui/Button.tsx` and `components/ui/Input.tsx` with all variants, sizes, focus rings, and disabled states. (AC-1, AC-3)
3. **Build Badge, Select, Checkbox primitives** — create `components/ui/Badge.tsx`, `components/ui/Select.tsx`, `components/ui/Checkbox.tsx`. (AC-1, AC-3)
4. **Build Modal primitive** — create `components/ui/Modal.tsx` with overlay, focus trapping, and Escape/click to close. (AC-1, AC-3)
5. **Build component catalogue** — create `app/ui/page.tsx` rendering every primitive with all its variants in a single scrollable view. (AC-4)
6. **Integrate into existing pages** — replace ad hoc Tailwind classes in `TodoForm.tsx`, `TodoList.tsx`, `TodoFilter.tsx`, `CategoryModal.tsx`, and `app/page.tsx` with the new primitives. Remove duplicated styles. (AC-6)
7. **Write tests and verify no regressions** — unit tests for each primitive covering rendering, variants, events, and accessibility behaviours. Update existing component tests if needed. Verify all existing tests pass. (AC-1, AC-3, AC-5, AC-6)

## Consequences

**What this enables**: a single place to change the visual language. Tweaking a button style, the border radius, or the primary colour updates the whole app. New features use the primitives instead of copying styles.

**What this makes harder**: the primitives are opinionated. A one-off component that needs a slightly different button must either extend the Button primitive (via `className`) or consciously break the pattern.

## Follow-up

- **Visual regression**: run the Playwright E2E suite to confirm the UI looks correct with the new primitives.
- **Design token audit**: scan for any raw Tailwind colour values (e.g. `bg-red-500`) still used outside the token system and migrate them.
