# `components/ui/` — Design system primitives

## What this area is

Reusable base UI components built with pure Tailwind CSS 4. These primitives replace ad hoc styling across the app and are the single source of truth for the visual language.

## Design tokens

Design tokens are defined centrally in `app/globals.css` via Tailwind CSS 4's `@theme` directive. Colour tokens (background, surface, foreground, muted, border, primary, danger, success, plus priority-low/medium/high with foreground variants) each have a light default and a dark override via `@media (prefers-color-scheme: dark)`. Primitives reference semantic tokens (`bg-surface`, `text-foreground`, `border-border`) rather than raw colour values, so dark mode works without per-component logic.

## Component conventions

Every primitive follows these rules:

- Supports `className` for overrides and spreads standard HTML attributes.
- Uses semantic HTML (`<button>`, `<input>`, `<select>`, `<dialog>`).
- Every interactive element has `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- Meets WCAG AA colour contrast.

### Primitives

| Component | File | Key props |
|---|---|---|
| Button | `Button.tsx` | `variant` (primary, secondary, danger, ghost, icon), `size` (sm, md) |
| Input | `Input.tsx` | `type` (text, date), forwarded ref |
| Badge | `Badge.tsx` | `color` (CSS colour), `children` |
| Select | `Select.tsx` | Custom chevron, spreads `<select>` attrs |
| Modal | `Modal.tsx` | `open`, `onClose`, `title`, Escape/click-to-close |
| Checkbox | `Checkbox.tsx` | Controlled/uncontrolled, custom checkmark SVG |

### Catalogue

A component catalogue is rendered at the `/ui` route (`app/ui/page.tsx`) showing every primitive with all variants.

## Testing

Unit tests live in `__tests__/` co-located with each primitive. Run with `npx vitest run`. E2E coverage in `e2e/design-system.spec.ts`.

## Reference

ADR: [007-design-system](../../docs/adr/007-design-system/index.md)
