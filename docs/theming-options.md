# Theming options

Customize the published stylesheet with CSS variables. Consumers do not need to
configure Tailwind or install the forms plugin. Internal utilities stay isolated,
while colors can come from the application's Tailwind theme.

To use existing `vtd-primary` and `vtd-secondary` palettes with Tailwind 3 or 4,
register the theme bridge in the application's Tailwind configuration:

```js
import datepickerTheme from '@ignatremizov/vue-tailwind-datepicker/tailwind-theme'
import colors from 'tailwindcss/colors'

export default {
  theme: {
    extend: {
      colors: {
        'vtd-primary': colors.green,
        'vtd-secondary': colors.gray,
      },
    },
  },
  plugins: [datepickerTheme],
}
```

The bridge exports only the configured palettes as inherited
`--color-vtd-primary-*` and `--color-vtd-secondary-*` variables. It does not
generate datepicker utilities or reset controls. Tailwind 4 applications already
exporting these variables can omit the bridge. Overrides on a parent element
also flow into the datepicker; no package source scanning is needed.

Existing component tokens such as `--vtd-calendar-day-selected-bg` and
`--vtd-selector-month-selected-text` keep their names. Apply component tokens to
`.vtd-datepicker` to theme both inline and popover calendars.

The built palette also exposes `--vtd-color-vtd-primary-50` through
`--vtd-color-vtd-primary-950` and the corresponding `secondary` shades used by the
component as fallbacks when no application palette is present. Override those
shades for standalone use, or use `--color-vtd-primary-*` and
`--color-vtd-secondary-*` to override an inherited application palette. For example:

```css
.vtd-root {
  --color-vtd-primary-500: #009d64;
  --color-vtd-primary-600: #007d50;
  --color-vtd-primary-700: #005f3d;
}

.vtd-datepicker {
  --vtd-calendar-day-selected-bg: #009d64;
  --vtd-selector-month-selected-text: #005f3d;
}
```

## Light mode

Light mode uses the application's primary palette when present, with package
defaults and component tokens as fallbacks.

## Dark mode

Add `.dark` to an ancestor to enable dark mode. Dark surfaces use the package's
secondary palette when no application palette is present, and the dark component
tokens below.

## Selector Wheel Tokens

When `selector-mode` is enabled, month/year wheel visuals can be tuned via CSS variables on `.vtd-datepicker`.

```css
.vtd-datepicker {
  --vtd-selector-wheel-cell-height: 40px;

  /* Shared wheel text tokens (used by selector + time wheels) */
  --vtd-wheel-text: rgb(82 82 91 / 100%);
  --vtd-wheel-text-dark: rgb(163 163 163 / 100%);
  --vtd-wheel-selected-text: rgb(3 105 161 / 100%);
  --vtd-wheel-selected-text-dark: rgb(56 189 248 / 100%);

  --vtd-selector-month-font-family: inherit;
  --vtd-selector-month-font-size: 0.875rem;
  --vtd-selector-month-font-weight: 500;
  --vtd-selector-month-line-height: 1.5rem;
  --vtd-selector-month-text: var(--vtd-wheel-text);
  --vtd-selector-month-hover-bg: rgb(14 165 233 / 10%);
  --vtd-selector-month-hover-border: rgb(56 189 248 / 45%);
  --vtd-selector-month-hover-border-width: 0.85px;
  --vtd-selector-month-hover-text: rgb(14 116 144 / 100%);
  --vtd-selector-month-selected-bg: rgb(14 165 233 / 13%);
  --vtd-selector-month-selected-border: rgb(14 165 233 / 62%);
  --vtd-selector-month-selected-border-width: 0.85px;
  --vtd-selector-month-selected-text: var(--vtd-wheel-selected-text);

  --vtd-selector-year-font-family: inherit;
  --vtd-selector-year-font-size: 0.875rem;
  --vtd-selector-year-font-weight: 500;
  --vtd-selector-year-text: var(--vtd-wheel-text);
  --vtd-selector-year-hover-bg: rgb(14 165 233 / 10%);
  --vtd-selector-year-hover-border: rgb(56 189 248 / 45%);
  --vtd-selector-year-hover-border-width: 0.85px;
  --vtd-selector-year-hover-text: rgb(14 116 144 / 100%);
  --vtd-selector-year-selected-bg: rgb(14 165 233 / 13%);
  --vtd-selector-year-selected-border: rgb(14 165 233 / 62%);
  --vtd-selector-year-selected-border-width: 0.85px;
  --vtd-selector-year-selected-text: var(--vtd-wheel-selected-text);

  /* Time wheel text tokens */
  --vtd-time-wheel-text: var(--vtd-wheel-text);
  --vtd-time-wheel-selected-text: var(--vtd-wheel-selected-text);

  /* Advanced year-canvas tuning */
  --vtd-selector-year-canvas-border-width-scale: 0.5;
  --vtd-selector-year-canvas-dpr: 4;
  --vtd-selector-year-text-offset-y: 0px;
}
```

## Calendar Range Preview Tokens

You can tune the in-range background (including opacity) without custom selectors:

```css
.vtd-datepicker {
  --vtd-calendar-range-preview-bg: rgb(224 242 254 / 60%);
  --vtd-calendar-range-preview-bg-dark: rgb(55 65 81 / 50%);

  /* Range edge caps (start/end) */
  --vtd-calendar-range-preview-edge-bg: var(--vtd-calendar-day-selected-bg);
  --vtd-calendar-range-preview-edge-bg-dark: var(--vtd-calendar-day-selected-bg);
}
```

## Weekend Day Hook Theming

Weekend day-cell theming is available through stable hooks:

- `.vtd-weekend` applies to Saturday and Sunday.
- `.vtd-saturday` applies to Saturday only.
- `.vtd-sunday` applies to Sunday only.

```css
/* Weekend tint with optional per-day override */
.vtd-datepicker-date.vtd-weekend {
  color: rgb(220 38 38 / 100%);
}

.vtd-datepicker-date.vtd-saturday {
  color: rgb(234 88 12 / 100%);
}

.vtd-datepicker-date.vtd-sunday {
  color: rgb(185 28 28 / 100%);
}
```

These classes remain stable across locales and in selector mode (`:selector-mode="true"`), so the same host CSS can be reused for default and wheel-selector flows.

These hooks are additive selectors layered on top of existing day states.
Selected/range/disabled/today semantics remain the base behavior unless host CSS intentionally overrides them.

## Highlighted Day Hook Theming

Specific day-cell theming is available through the `highlightDates` prop and a stable hook:

- `.vtd-highlighted` applies to any day included in `highlightDates`.

```css
.vtd-datepicker-date.vtd-highlighted {
  color: rgb(15 118 110 / 100%);
}
```

`highlightDates` accepts an array of `Date`, `dayjs`, or strings matching the configured `formatter.date` (or its date-only form).
Strings that do not match are ignored.
Matching is date-only, so time parts are ignored when resolving the hook.
Like the weekend hooks, `.vtd-highlighted` is additive with selected/range/disabled/today states.
