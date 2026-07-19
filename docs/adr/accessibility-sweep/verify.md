# Verify: accessibility sweep · updated 2026-07-19

_Steps derived from roadmap #13 acceptance criteria. `/verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Every `<button>`, `<select>`, and `<input>` on the todo page has an accessible name (visible label or `aria-label`) → AC-1
- [ ] Drag handles in Custom sort mode announce their state and respond to Space/Enter (pick up) and arrow keys (move) — test with keyboard only → AC-2
- [ ] CategoryModal traps focus when open: Tab from last focusable element cycles to first, Shift+Tab from first cycles to last → AC-3
- [ ] CategoryModal restores focus to trigger button on close → AC-3
- [ ] `aria-live` region updates when a todo is added, deleted, or toggled — test with screen reader → AC-4

## Commands

- [ ] `npx playwright test e2e/design-system.spec.ts` → visit `/ui`, verify all primitives render → AC-1
- [ ] `npx playwright test e2e/todo.spec.ts` → full CRUD flow passes → AC-4

## Acceptance-criteria coverage

- AC-1 (accessible names on all controls) covered by manual step 1 + design-system E2E
- AC-2 (keyboard drag and drop) covered by manual step 2
- AC-3 (focus trapping in modal) covered by manual steps 3, 4
- AC-4 (aria-live CRUD announcements) covered by manual step 5 + todo E2E
