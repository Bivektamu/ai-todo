# Verify: Todo categories · ADR 006 · updated 2026-07-15
_Steps derived from ADR 006 acceptance criteria. `/verify` runs these; `/test` locks the durable ones._
## UI / manual
- [ ] Start dev server, open app. Click "Manage categories" → modal opens. Create category "Work" with a colour. Confirm it appears in list. Close modal with Escape and backdrop click. → AC-1
- [ ] Rename "Work" to "Office" inline in modal. Confirm name updates. → AC-1
- [ ] Create second category "Personal". Delete "Personal". Confirm it disappears and any assigned todos show no badge. → AC-1, AC-5
- [ ] Create a todo and select "Office" from category dropdown. Confirm todo appears with coloured "Office" badge. → AC-2, AC-3
- [ ] Inline edit a todo's category via the row select. Confirm badge updates. → AC-2, AC-3
- [ ] Create a todo with no category. Confirm it renders without a badge and without errors. → AC-6
- [ ] Click the "Office" filter chip. Confirm only Office todos show. Click it again → all show. Click two chips → union of both shows. → AC-4
- [ ] Select "Category" sort. Confirm todos group by category name, uncategorized at bottom. → AC-4
- [ ] Toggle, delete, drag-and-drop a todo. Confirm all existing features still work. → AC-6
## Acceptance-criteria coverage
- AC-1 covered by steps 1, 2, 3 · AC-2 covered by steps 4, 5 · AC-3 covered by steps 4, 5 · AC-4 covered by steps 7, 8 · AC-5 covered by step 3 · AC-6 covered by steps 6, 9
