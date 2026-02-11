# Quickstart: Native-Like Month/Year Scrolling Selector

## 1. Install and baseline checks

```bash
npm install
npm run typecheck
npm run build
```

## 2. Enable selector mode in a local usage example

In a consumer or local demo usage, enable the new prop:

```vue
<vue-tailwind-datepicker
  v-model="value"
  :selector-mode="true"
  use-range
  as-single
  :no-input="true"
/>
```

## 3. Verify core flows

1. Calendar -> selector toggle via header month/year click.
2. Selector -> calendar toggle preserves selected month/year.
3. Single-date mode continues working with selector mode off and on.
4. Single-panel range (`use-range` + `as-single`) updates displayed month/year context only.
5. Double-panel range updates clicked panel context only.

## 4. Verify non-regression behaviors

1. `selector-mode` omitted (`false`) keeps legacy month/year panels.
2. `autoApply` and manual apply still behave as before.
3. Keyboard navigation/focus remains usable.

## 5. Verify SC-002 interaction-count criterion

1. Open selector mode from calendar view.
2. Validate that choosing the target month/year requires no more than 2 direct interactions (selection actions), excluding scroll travel distance.
3. Repeat for single-date, single-panel range (`use-range` + `as-single`), and double-panel range contexts.

## 6. Final validation

```bash
npm run typecheck
npm run build
```

## 7. QA evidence tracking (SC-001, SC-004)

Record each manual run to make success criteria auditable.

| Date | Tester | Scenario | Console Errors (SC-001) | Smooth Interaction Pass (SC-004) | Notes |
|------|--------|----------|---------------------------|-----------------------------------|-------|
| YYYY-MM-DD | name | single / single-range / double-range | pass/fail | pass/fail | details |

Checklist per run:
1. Open browser devtools console and confirm no errors during calendar -> selector -> calendar transitions.
2. Execute at least one scenario per mode (single, `use-range` + `as-single`, double-panel range).
3. Mark smoothness pass/fail using the SC-004 checklist in spec/plan.
4. Attach run notes to PR description.

## 8. Implementation TODO checkpoints (T002)

- [ ] TODO-SC001-1: Run calendar -> selector -> calendar flow in browser and confirm no console errors.
- [ ] TODO-SC001-2: Repeat console-error check for single, single-panel range, and double-panel range scenarios.
- [ ] TODO-SC004-1: Validate smooth selector scrolling and selection response for month and year columns.
- [ ] TODO-SC004-2: Record pass/fail outcomes in the QA evidence table with notes per scenario.
