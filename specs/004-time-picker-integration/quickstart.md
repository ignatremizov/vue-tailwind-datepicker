# Quickstart: Integrated Time Selection for Date Picker

## 1. Install and baseline checks

```bash
npm install
npm run typecheck
npm run build
npm run test:unit -- tests/unit/time-panel-layout.spec.ts
```

## 2. Enable integrated time mode (`timePickerStyle`)

Single-date input mode:

```vue
<vue-tailwind-datepicker
  v-model="value"
  :auto-apply="true"
  time-picker-style="input"
  :formatter="{ date: 'YYYY-MM-DD HH:mm', month: 'MMM' }"
/>
```

Single-panel range wheel mode:

```vue
<vue-tailwind-datepicker
  v-model="rangeValue"
  use-range
  as-single
  time-picker-style="wheel-inline"
  time-inline-position="right"
  time-wheel-scroll-mode="fractional"
  default-time="09:00"
  default-end-time="17:00"
  :formatter="{ date: 'YYYY-MM-DD hh:mm:ss A', month: 'MMM' }"
/>
```

## 3. Verify core behavior

1. Select date and time in one picker surface; no second popover opens.
2. In any non-`none` time mode, confirm value is committed only after explicit Apply, even when `autoApply=true`.
3. Confirm output includes time and preserves original `v-model` container shape.
4. Confirm date-only behavior remains unchanged in `timePickerStyle='none'`.

## 4. Verify range endpoint behavior

1. In `input` mode with `useRange + asSingle`, confirm both Start/End inputs render together.
2. In wheel modes with `useRange + asSingle`, confirm one active endpoint is edited at a time via Start/End toggle.
3. Click active endpoint toggle again and confirm it flips to the opposite endpoint.
4. With `timePageMode='after-date'`, confirm time page opens on Start endpoint after date actions.

## 5. Verify validation and error lifecycle

1. Use formatter without time tokens in time-enabled mode and confirm Apply is blocked with `config-missing-time-token`.
2. Set end datetime earlier than start and confirm Apply blocks with `range-end-before-start`.
3. Confirm range-order error stays visible when switching endpoint only, and clears only after correcting end >= start.
4. Confirm range-order message is human-friendly and includes start time context (time-only).
5. Confirm invalid typed times block Apply and inline errors update correctly.
6. Confirm blocked-Apply `error` events emit only on Apply attempts.

## 6. Verify wheel behavior and keyboard flow

1. Verify `timeWheelScrollMode='boundary'` and `'fractional'` both work and stay synchronized with endpoint state.
2. Stress minute/second boundary transitions (rapid up/down) and confirm no duplicate carry jumps.
3. In wheel mode, verify Tab/Shift+Tab cycle includes endpoint toggle, wheels, and footer actions.

## 7. Verify layout stability

1. In `input` mode, trigger range validation errors and confirm picker width does not expand.
2. While picker is open, switch `wheel-page -> wheel-inline (right) -> wheel-page` and confirm no stale clipping/ghost layout.

## 8. Verify DST behavior

1. Test spring-forward nonexistent local time and confirm Apply is blocked with `dst-nonexistent-time`.
2. Test fall-back ambiguous local time and confirm first-occurrence deterministic resolution.

## 9. Verify initialization hydration

1. Pass incoming model values with date but missing time while time mode is enabled.
2. Confirm hydration uses `defaultTime` / `defaultEndTime` (or `00:00[:00]`) internally.
3. Confirm hydration does not emit `update:modelValue` before explicit Apply.

## 10. Verification Log (2026-02-18)

### Command outcomes

- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run test:unit -- tests/unit/time-panel-layout.spec.ts`: PASS

### Build note

- Vite DTS warns API Extractor bundles TypeScript `5.8.2` while project uses `5.9.3`; build still succeeds.

## 11. Datetime Scenario Matrix

| Scenario | Status | Evidence |
| --- | --- | --- |
| Single datetime apply flow | PASS | Time-enabled modes render in-panel controls; Apply commits shape-preserving datetime output. |
| Range endpoint UI by style | PASS | Input mode renders dual start/end fields; wheel modes render explicit endpoint toggle with endpoint-scoped edits. |
| Range-order validation lifecycle | PASS | `range-end-before-start` persists until corrected; endpoint switching alone does not clear error. |
| Formatter missing time tokens | PASS | Apply guard blocks with `config-missing-time-token`; inline error + structured `error` payload emitted on blocked Apply. |
| Input-mode error layout stability | PASS | Validation messages wrap without expanding picker width. |
| Open-state mode-switch stability | PASS | `wheel-page -> wheel-inline(right) -> wheel-page` no stale lock artifacts after reset/re-measure. |
| DST nonexistent local time | PASS | Local datetime validation rejects nonexistent local time and emits `dst-nonexistent-time`. |
| Initialization hydration without emit | PASS | Missing time components hydrate internal drafts using defaults/fallback before Apply, without early `update:modelValue`. |
