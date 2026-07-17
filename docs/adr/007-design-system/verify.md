# Verify: Design system · ADR 007 · updated 2026-07-18
_Steps derived from ADR 007 acceptance criteria. `/verify` runs these; `/test` locks the durable ones._
## UI / manual
- [ ] Visit `/ui`: confirm all six primitives render with every variant: Button (5 variants, 2 sizes, disabled), Input (text, date, disabled), Badge (3 colours), Select (with options), Checkbox (checked, unchecked), Modal (open/close) → AC-1, AC-3, AC-4
- [ ] Visit `/`: confirm the main todo page renders with the new design tokens (background, foreground, muted text), the form uses Button + Input + Select instead of raw styled elements, the todo list uses Badge for priority/category, and the CategoryModal opens with the Modal primitive → AC-6
- [ ] Toggle dark mode (browser devtools: emulate `prefers-color-scheme: dark`): confirm all colours invert correctly via the `@theme` dark overrides → AC-2
- [ ] Keyboard navigation: Tab through interactive elements on `/` and `/ui`, confirm `focus-visible:ring-2` appears on every Button, Input, Select, Checkbox → AC-3
## Commands
- [ ] `npx vitest run` → all 117 tests pass → AC-5
## Acceptance-criteria coverage
- AC-1: covered by `/ui` catalogue check + test suite (6 primitive test files)
- AC-2: covered by dark mode toggle check
- AC-3: covered by `/ui` variant check + keyboard navigation check + test suite
- AC-4: covered by `/ui` catalogue check
- AC-5: covered by `npx vitest run` (117/117 passing)
- AC-6: covered by `/` page check
