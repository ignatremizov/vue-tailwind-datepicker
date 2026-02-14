# Quickstart: Shortcut Extension Points

## 1. Baseline validation

```bash
npm install
npm run typecheck
npm run build
```

## 2. Opt in to modern built-in shortcuts

```vue
<template>
  <vue-tailwind-datepicker
    v-model="value"
    :use-range="true"
    :as-single="true"
    shortcut-preset="modern"
    :shortcuts="true"
  />
</template>
```

Expected modern actions:
- Today
- 3 business days
- Next week
- Next month

## 3. Keep legacy behavior (default)

```vue
<template>
  <vue-tailwind-datepicker
    v-model="value"
    :shortcuts="true"
  />
</template>
```

This is equivalent to `shortcut-preset="legacy"` and preserves existing built-ins.

## 4. Provide typed custom shortcuts (replace built-ins)

```vue
<script setup lang="ts">
const customShortcuts = [
  {
    id: 'next-billing-cycle',
    label: 'Next billing cycle',
    resolver: ({ now }) => {
      const next = new Date(now)
      next.setMonth(next.getMonth() + 1)
      return next
    },
  },
]
</script>

<template>
  <vue-tailwind-datepicker
    v-model="value"
    :shortcuts="customShortcuts"
    shortcut-preset="modern"
  />
</template>
```

Custom shortcuts replace built-ins by default.

## 5. Handle invalid shortcuts safely

```vue
<template>
  <vue-tailwind-datepicker
    v-model="value"
    :shortcuts="customShortcuts"
    @invalid-shortcut="onInvalidShortcut"
  />
</template>
```

`invalid-shortcut` payload:

- `id: string`
- `resolvedValue: Date | [Date, Date] | null`
- `reason: 'blocked-date' | 'mode-mismatch' | 'resolver-error' | 'invalid-result'`
- `mode: 'single' | 'range'`

## 6. Use per-item render extension

Use the `shortcut-item` slot payload and trigger activation only via `activate()` to preserve library-owned side effects/events.

```vue
<template>
  <vue-tailwind-datepicker v-model="value" :shortcuts="customShortcuts">
    <template #shortcut-item="{ id, label, isDisabled, meta, activate }">
      <button
        type="button"
        :data-shortcut-id="id"
        :disabled="isDisabled"
        @click="activate"
      >
        {{ label }}{{ meta?.hint ? ` (${meta.hint})` : '' }}
      </button>
    </template>
  </vue-tailwind-datepicker>
</template>
```

See executable example in `src/App.vue`.

## 7. Manual verification checklist

1. Confirm `shortcutPreset='legacy'` keeps current built-ins.
2. Confirm `shortcutPreset='modern'` enables modern built-ins only.
3. Confirm `3 business days` excludes today and weekends.
4. Confirm `Next month` clamps to end-of-month when destination date is invalid.
5. Confirm custom shortcuts replace built-ins and typed resolver output applies.
6. Confirm typed `[Date, Date]` in single mode is rejected and emits `invalid-shortcut`.
7. Confirm legacy `[Date, Date]` in single mode still uses first date.
8. Confirm blocked-date and resolver-error paths keep value unchanged and emit `invalid-shortcut`.
9. Confirm Enter/Space activates each shortcut.
10. Confirm post-activation close/open/focus behavior matches existing mode semantics.
11. Confirm `invalid-shortcut.reason` covers `blocked-date`, `mode-mismatch`, `resolver-error`, and `invalid-result`.

## 8. Timezone-boundary verification scenarios

1. Set local system time to `23:59` and click `Next week`; verify emitted value equals local `now + 7 calendar days`.
2. Set local system time to `00:01` and click `Today`; verify emitted value matches local date, not UTC date.
3. On `Jan 31 23:59` local time, click `Next month`; verify clamped local output (`Feb 28` or `Feb 29` when leap year).
4. On Saturday local time near midnight, click `3 business days`; verify Monday-Friday counting excludes weekend and excludes today.

## 9. Final checks before implementation handoff

```bash
npm run typecheck
npm run build
```
