# Theming options

Theme of Vue Tailwind Datepicker is customizable, so you can customize your theme with any color you want, via Tailwind CSS configuration. And all will work well.

Just modify your `main.css` to includes the plugin directive for `@tailwindcss/forms` and your `tailwind.config.js` file

```css
@plugin "@tailwindcss/forms";

/* Your tailwindconfig file */
@config "../../tailwind.config.js";
```

```js
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/vue-tailwind-datepicker/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        'vtd-primary': colors.sky,
        'vtd-secondary': colors.gray,
      },
    },
  },
}
```

## Light mode

Light mode color system using custom color `vtd-primary`.

## Dark mode

Dark mode color system using color palette `vtd-secondary`. Vue Tailwind Datepicker work it well with Tailwind CSS `dark` mode configuration.

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
