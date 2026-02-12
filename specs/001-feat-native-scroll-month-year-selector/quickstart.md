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
  selector-year-scroll-mode="boundary"
  use-range
  as-single
  :no-input="true"
/>
```

Optional experimental variant:

```vue
<vue-tailwind-datepicker
  v-model="value"
  :selector-mode="true"
  selector-year-scroll-mode="fractional"
  use-range
  as-single
/>
```

## 3. Verify core flows

1. Calendar -> selector toggle via header month/year click.
2. Selector -> calendar toggle preserves selected month/year.
3. Single-date mode continues working with selector mode off and on.
4. Single-panel range (`use-range` + `as-single`) updates displayed month/year context only.
5. Double-panel range updates clicked panel context only.
6. `selector-year-scroll-mode="boundary"` keeps year movement discrete and clarity-first.
7. `selector-year-scroll-mode="fractional"` keeps year wheel in continuous month-synced drift.
8. Selector-mode header is a single combined month+year toggle with explicit button affordance.
9. Clicking month/year selector items recenters the wheel/list to the clicked item.
10. Selector-mode container size remains visually stable across calendar <-> selector toggles.

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
| 2026-02-11 | Codex | selector-mode demo (`src/App.vue`) | fail (non-picker favicon 404) | pass (manual visual check) | Month selector and year selector listboxes rendered; toggle flow observed |
| 2026-02-11 | Codex | SC-002 sample checks | pass | pass | Month change: 1 direct selection (`May`); Year change: 1 direct selection (`2030`) after selector open |
| 2026-02-11 | Codex | T021 double-panel range clicked-context sync (`:selector-mode=true`) | fail (non-picker favicon 404 only) | pass | Left panel month/year stayed on its own context while right-panel header interaction opened selector on right context; no cross-panel focus bleed observed |
| 2026-02-11 | Codex | T021 single-panel range sync (`use-range` + `as-single`) | fail (non-picker favicon 404 only) | pass | Selector transitions stayed scoped to single displayed context; no second-panel state was introduced |
| 2026-02-11 | Codex | T029 disabled-date constraints (`disableDate` weekend function) | fail (non-picker favicon 404 only) | pass | Weekend cells remained disabled after selector-mode month change and return to calendar |
| 2026-02-11 | Codex | T029 invalid/empty model seeds (`''`, `not-a-date ~ not-a-date`) | fail (non-picker favicon 404 only) | pass | Popovers opened without runtime exceptions; both scenarios anchored to stable calendar months (Feb/Mar 2026) |
| 2026-02-11 | Codex | T029 far-year offsets + small-screen 375x812 | fail (non-picker favicon 404 only) | pass with caveat | Year list remained virtually unbounded (visible through 2137 after jumping to 2077); mobile viewport stayed operable, but selected year vs header year showed offset drift in observed runs (`2035 -> 2037`, `2077 -> 2079`) requiring follow-up |

Checklist per run:
1. Open browser devtools console and confirm no errors during calendar -> selector -> calendar transitions.
2. Execute at least one scenario per mode (single, `use-range` + `as-single`, double-panel range).
3. Mark smoothness pass/fail using the SC-004 checklist in spec/plan.
4. Attach run notes to PR description.

## 8. Implementation TODO checkpoints (T002)

- [x] TODO-SC001-1: Run calendar -> selector -> calendar flow in browser and confirm no console errors.
- [x] TODO-SC001-2: Repeat console-error check for single, single-panel range, and double-panel range scenarios.
- [x] TODO-SC004-1: Validate smooth selector scrolling and selection response for month and year columns.
- [x] TODO-SC004-2: Record pass/fail outcomes in the QA evidence table with notes per scenario.

Notes:
- Observed console error is a dev demo static asset miss (`/favicon.ico` 404), not a picker runtime exception.
- T021 and T029 manual checks were executed with Playwright against `http://127.0.0.1:4173` on 2026-02-11.
- Added `src/App.vue` manual-test scenarios for `use-range + as-single`, `disableDate`, and empty/invalid model seeds to complete matrix coverage.
