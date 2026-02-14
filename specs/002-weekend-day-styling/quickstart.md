# Quickstart: Weekend Day Styling Hooks

## 1. Install and baseline checks

```bash
npm install
npm run typecheck
npm run build
```

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

## 6. Success criteria evidence capture

Record QA outcomes to track SC-001 through SC-003.

| Date | Scenario | Weekend hooks present | Host CSS applies | Precedence preserved | Notes |
|------|----------|------------------------|------------------|----------------------|-------|
| YYYY-MM-DD | Baseline month | pass/fail | pass/fail | pass/fail | |
| YYYY-MM-DD | Off-month cells | pass/fail | pass/fail | pass/fail | |
| YYYY-MM-DD | Range + disabled overlap | pass/fail | pass/fail | pass/fail | |
