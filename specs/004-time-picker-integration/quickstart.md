# Quickstart: Integrated Time Selection for Date Picker

## 1. Install and baseline checks

```bash
npm install
npm run typecheck
npm run build
```

## 2. Enable datetime mode in a local usage example

```vue
<vue-tailwind-datepicker
  v-model="value"
  :datetime="true"
  :auto-apply="true"
  :formatter="{ date: 'YYYY-MM-DD HH:mm' }"
/>
```

Range example with defaults and endpoint toggle flow:

```vue
<vue-tailwind-datepicker
  v-model="rangeValue"
  :datetime="true"
  use-range
  :as-single="true"
  default-time="09:00"
  default-end-time="17:00"
  :formatter="{ date: 'YYYY-MM-DD h:mm A' }"
/>
```

## 3. Verify core behavior

1. Select date then time in one panel; no second popover opens.
2. In datetime mode, confirm no commit occurs until explicit Apply, even with `autoApply=true`.
3. Apply with valid date/time and confirm emitted value includes time while preserving existing model container shape.
4. Edit only time and confirm date portion remains unchanged after Apply.
5. Omit/disable `datetime` and confirm date-only behavior is unchanged.

## 4. Verify formatter and default-time contract

1. Use formatter without time tokens while `datetime=true`; confirm Apply is blocked.
2. Confirm inline error appears and one `error` event emits with `code='config-missing-time-token'` on blocked Apply attempt.
3. Provide `defaultTime` / `defaultEndTime` using both 24-hour and 12-hour forms and confirm normalization to active formatter contract.

## 5. Verify range and validation behavior

1. In range mode, confirm one time input plus explicit Start/End endpoint toggle.
2. Set end datetime earlier than start and confirm Apply blocks with `code='range-end-before-start'`.
3. Type an invalid time and confirm inline validation blocks Apply until corrected.
4. Confirm blocked-Apply error events emit only on Apply attempts, not on each edit.

## 6. Verify DST behavior

1. Use a locale/date where spring-forward creates a nonexistent local time and confirm Apply blocks with `code='dst-nonexistent-time'`.
2. Use a fall-back ambiguous local time and confirm deterministic first-occurrence resolution.

## 7. Verify initialization hydration

1. Pass incoming model values with date but no time while `datetime=true`.
2. Confirm time hydrates from `defaultTime`/`defaultEndTime` or `00:00[:00]` internally.
3. Confirm hydration does not emit `update:modelValue` before explicit Apply.

## 8. Final validation

```bash
npm run typecheck
npm run build
```
