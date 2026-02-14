# Quickstart: Selector Direct Year Input

## 1. Install and baseline checks

```bash
npm install
npm run typecheck
npm run build
```

## 2. Enable direct year input in a local usage example

```vue
<vue-tailwind-datepicker
  v-model="value"
  :selector-mode="true"
  :direct-year-input="true"
  year-numbering-mode="historical"
/>
```

Range example (active panel semantics):

```vue
<vue-tailwind-datepicker
  v-model="rangeValue"
  :selector-mode="true"
  :direct-year-input="true"
  year-numbering-mode="astronomical"
  use-range
/>
```

## 3. Core behavior checks

1. Open selector mode from header and type a valid year token (for example `2034`); confirm calendar context updates immediately.
2. Type a valid negative year token (for example `-44`); confirm signed-year support.
3. Type a value outside bounds (for example `100000` or `-100000`); confirm no invalid commit occurs.
4. Type mixed paste content (for example `  - 20a3b4 `); confirm deterministic normalization and validation behavior.
5. Press Enter on valid token; confirm selector remains open while current committed year stays applied.
6. Press Escape during invalid/partial text; confirm reversion to last valid year.
7. Blur with invalid/partial text; confirm reversion to last valid year.

## 4. Numbering mode checks

1. With `year-numbering-mode="historical"`, type `0`; confirm `0` is rejected.
2. With `year-numbering-mode="astronomical"`, type `0`; confirm `0` is accepted.

## 5. Range chronology boundary checks

1. In range mode, type a year on active panel that creates temporary inversion (`start > end`); confirm temporary inversion is allowed during live typing.
2. Trigger `Apply`; confirm endpoints are normalized via auto-swap.
3. Repeat inversion scenario and exit with close-with-persist path; confirm normalization occurs.
4. Repeat inversion scenario and use Enter-in-place; confirm no normalization is triggered by Enter alone.
5. Repeat inversion scenario and exit with Escape/Cancel/backdrop; confirm no commit-boundary normalization side effect occurs.

## 6. Non-regression checks

1. Disable `direct-year-input`; confirm scroll-only selector behavior remains unchanged.
2. Confirm month selection semantics remain unchanged with and without direct year input.

## 7. Final validation

```bash
npm run typecheck
npm run build
```
