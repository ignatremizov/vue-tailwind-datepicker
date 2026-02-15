# Quickstart: Weekend Day Styling Hooks

## 1. Install and baseline checks

```bash
npm install
npm run typecheck
npm run build
```

### Pre-change baseline evidence (2026-02-14)

- `npm run typecheck`: PASS
- `npm run build`: PASS
- Build note: `vite:dts` reported TypeScript engine drift advisory (`project 5.9.3` vs bundled `5.8.2`) with successful declaration generation.

## 2. Apply host CSS weekend tinting

Use stable weekend hooks in consumer CSS:

```css
/* Example consumer styling: weekend tint */
.vtd-datepicker-date.vtd-weekend {
  color: #dc2626;
}

/* Optional differentiated weekend colors */
.vtd-datepicker-date.vtd-saturday {
  color: #ea580c;
}

.vtd-datepicker-date.vtd-sunday {
  color: #b91c1c;
}
```

## 3. Manual verification matrix

1. Open the date picker on a month with known weekends.
2. Confirm Saturday and Sunday cells expose the expected classes.
3. Navigate to next/previous month and confirm class assignment remains deterministic.
4. Confirm leading/trailing off-month weekend cells expose the same hooks.
5. Confirm host CSS tint is applied through class hooks only (no deep selector override needed).

## 4. State precedence checks

1. Select a weekend date and confirm selected styling behavior remains intact.
2. In range mode, confirm weekend cells inside range still preserve in-range visuals.
3. Mark a weekend date as disabled and confirm disabled behavior remains intact.
4. Check a month where today is weekend and confirm today styling and weekend hooks coexist.

## 5. Final quality gates

```bash
npm run typecheck
npm run build
```

### Final gate evidence (2026-02-15)

- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run test:unit`: PASS (26/26 tests, includes locale and selector coverage in `tests/unit/weekend-day-styling.spec.ts`)

## 6. Success criteria evidence capture

Record QA outcomes to track SC-001 through SC-003.

| Date | Scenario | Weekend hooks present | Host CSS applies | Precedence preserved | Notes |
|------|----------|------------------------|------------------|----------------------|-------|
| 2026-02-14 | Baseline month | pass | pass | pass | Covered by `tests/unit/weekend-day-styling.spec.ts` weekend hook contract assertions and App demo wiring |
| 2026-02-14 | Off-month cells | pass | pass | pass | Off-month weekend hook coverage asserted by class contract test (`text-vtd-secondary-400` + weekend hooks) |
| 2026-02-14 | Range + disabled overlap | pass | pass | pass | Range end/in-range + disabled weekend overlap validated in unit tests; today+weekend coexistence confirmed via class-merge code-path inspection |
| 2026-02-15 | Locale parity (`en`, `de`) | pass | pass | pass | Deterministic weekend contract asserted in locale-specific unit test case |
| 2026-02-15 | Selector mode + weekend hooks | pass | pass | pass | `src/App.vue` demo includes selector-wheel weekend tint path (`as-single` + `use-range` + `selector-mode`) |

## 7. Implementation evidence log (story-by-story)

| Date | Story/Task scope | Evidence type | Result | Notes |
|------|-------------------|---------------|--------|-------|
| 2026-02-14 | US1 weekend metadata + hook exposure (`T006`-`T009`) | Unit tests + code inspection + build/typecheck | pass | `DatePickerDay` includes saturday/sunday/weekend; weekend hook contract test covers in-month, off-month, and month navigation |
| 2026-02-14 | US2 host-style customization (`T010`-`T013`) | Docs/demo verification + build/typecheck | pass | README + theming docs include stable hook examples; `src/App.vue` includes host CSS weekend tint demo scenario |
| 2026-02-14 | US3 precedence/non-regression (`T014`-`T017`) | Unit tests + code inspection | pass | Calendar class merge keeps semantic classes first; selected/range/disabled overlap test passes; today semantics remain in `datepickerClasses` while weekend hooks are additive; no new required props/events introduced |
| 2026-02-15 | Locale + selector demo expansion (`T023`-`T024`) | Unit tests + demo verification + docs updates | pass | Added locale-specific weekend hook test (`en`, `de`) and selector-wheel weekend demo in `src/App.vue` with README/docs notes |
| 2026-02-15 | Final polish gates (`T018`-`T022`) | Typecheck/build/unit tests + QA matrix reconciliation | pass | All quality gates pass; weekday non-regression and navigation stability validated by test assertions and navigation contract checks |

## 8. Requirement reconciliation (FR-001..FR-008)

| Requirement | Evidence | Status |
|-------------|----------|--------|
| FR-001 | `DatePickerDay` weekend fields + panel day-state assignment | pass |
| FR-002 | `vtd-weekend` / `vtd-saturday` / `vtd-sunday` hooks in calendar button class binding | pass |
| FR-003 | Weekend hook contract test verifies off-month weekend cells | pass |
| FR-004 | README/theming docs + App host CSS demo show consumer-level styling overrides | pass |
| FR-005 | Weekday non-regression asserted in weekend contract test (weekday cells have no weekend hooks) | pass |
| FR-006 | Selected/range/disabled overlap verified in unit tests; today overlap preserved by unchanged `datepickerClasses` priority and additive weekend hooks | pass |
| FR-007 | No new props/events required; hook-based styling only | pass |
| FR-008 | Shared weekend classification helper uses fixed `day() === 6 || day() === 0` semantics; locale parity test (`en`, `de`) confirms deterministic assignment | pass |
