> Historical entries before this fork may reference the upstream repository (`elreco/vue-tailwind-datepicker`) in compare/commit links.

## [2.0.1](https://github.com/ignatremizov/vue-tailwind-datepicker/compare/v2.0.0...v2.0.1) (2026-02-23)

### :bug: Fixes

- Type declaration entrypoints now resolve correctly from package root (`types`/`exports.types` -> `dist/entry.d.ts`) and build output includes declaration files under `dist/`.
- Tailwind peer compatibility widened to support both `^3.4.0` and `^4.0.0`.

# [2.0.0](https://github.com/ignatremizov/vue-tailwind-datepicker/compare/v1.7.4...v2.0.0) (2026-02-23)

Compare: https://github.com/ignatremizov/vue-tailwind-datepicker/compare/v1.7.4...v2.0.0

### :boom: Breaking Changes

- Package scope renamed to `@ignatremizov/vue-tailwind-datepicker` — update your imports and dependency references.
- Shortcut system completely replaced with a fully customizable extension-point API, with built-in presets added for drop-in usage (`legacy` compatibility preset for the old list, plus `modern`).

### :sparkles: Features

- Brand-new native selector wheel mode shipped: canvas-backed year rendering, keyboard-first UX, dual-panel behavior stabilization, header quick-nav controls, and configurable year jump controls. ([#1](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/1))
- Direct year input shipped in selector mode with signed-year handling and range-boundary commit behavior. ([#4](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/4))
- Brand-new time picker support shipped (input + wheel modes); previously the picker was day-only calendar selection. ([#5](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/5))
- Brand-new customizable shortcut system shipped with typed extension points, disabled-state reason tracking, and layout customization hooks. Modern preset shortcut list: Today, Yesterday, 3 business days, Past week, Next week, Last Month, This Month, Next Month. ([#3](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/3), [#7](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/7))
- Brand-new keyboard accessibility support shipped: full keyboard traversal/activation flow, stronger focus management, and broader screen-reader support. ([#1](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/1), [#4](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/4), [#5](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/5))
- Tailwind v4 compatibility: legacy opacity utilities migrated to modern syntax and range-preview styling made deterministic. ([#1](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/1))
- Weekend days are now styleable via stable Saturday/Sunday/weekend hooks for host theming. ([#2](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/2))
- Docs experience expanded with an all-features demo plus automated screenshot/video generation for gallery coverage. ([#4](https://github.com/ignatremizov/vue-tailwind-datepicker/pull/4))

### :bug: Fixes

- Year selection overflow clipped (`overflow-hidden`) via upstream cherry-pick contributed by [Stijn Pint](https://github.com/stijnpint) ([d32d394](https://github.com/ignatremizov/vue-tailwind-datepicker/commit/d32d39488b7fd29049be487aa66531af978d4f3f)).
- Layout and styling reliability fixes, including deterministic range preview behavior.
- Lint/type follow-up: strict calendar day flag typing and import-order rule cleanup.

### :white_check_mark: Testing

- Introduced Vitest + jsdom test harness with dedicated `vitest.config.ts` and `tests/setup.ts`.
- Added 24 new spec files (~6 000 lines) covering selector wheels, keyboard navigation, shortcuts, time-panel layout, weekend styling, accessibility regressions, locale isolation, and more.

### :wrench: Maintenance

- ESLint migrated to flat config and normalized across the repo.
- Project metadata/governance aligned to this fork:
  - package scope moved to `@ignatremizov/vue-tailwind-datepicker`
  - ownership/contact/funding/release docs updated
  - contributor attribution preserved in `CONTRIBUTORS.md`.
- Docs toolchain split from core package and dependency baseline modernized.
- Demo app locale picker switched to flag buttons.

### :memo: Docs & Specs

- Added and maintained Spec-Kit artifacts for selector, weekend styling, shortcuts extension points, datetime integration, and direct year input feature streams.
- Updated props and advanced usage documentation for new selector/shortcut/datetime behavior.

## [1.7.4](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.7.3...v1.7.4) (2025-10-06)

### Bug Fixes

- fix ignored `disableDate` function when date has been set ([c6af96c](https://github.com/elreco/vue-tailwind-datepicker/commit/c6af96ca7586a4c17eeb330458f5d217ea3f8dda))

### :repeat: Chore

- update dependencies and migrate Tailwind CSS v3 to v4 ([4b31eaa](https://github.com/elreco/vue-tailwind-datepicker/commit/4b31eaad7d20c582e491f1a04232fd2fca98acf2))
- improve release workflows and add documentation ([da3b8bb](https://github.com/elreco/vue-tailwind-datepicker/commit/da3b8bb819ca0a8aceb7f926ebde79232a7e2552))

## [1.7.3](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.7.2...v1.7.3) (2024-03-05)

### :rewind: Reverts

- revert "feat(i18n): import locales outside the component" ([3f394ed](https://github.com/elreco/vue-tailwind-datepicker/commit/3f394ed76c8fd9562fa6c2f13d8b09617d6568a7))

### :repeat: Chore

- update package ([0f7d1b5](https://github.com/elreco/vue-tailwind-datepicker/commit/0f7d1b50a35e229c1f8b85795288a2b243158991))

## [1.7.2](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.7.1...v1.7.2) (2024-03-01)

### Bug Fixes

- **i18n:** fix locale import ([3507c52](https://github.com/elreco/vue-tailwind-datepicker/commit/3507c52816482a312067ae5674e7405cb545865b))

## [1.7.1](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.7.0...v1.7.1) (2024-02-21)

### :repeat: Chore

- improve publish with semantic release ([8a9c63b](https://github.com/elreco/vue-tailwind-datepicker/commit/8a9c63b4372e8bbe42b525f76c2243ab02b135e6))

# [1.7.0](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.6.6...v1.7.0) (2024-02-21)

### Features

- **i18n:** import locales outside the component ([62e7590](https://github.com/elreco/vue-tailwind-datepicker/commit/62e7590b86076aae0202610cc8672e05d31b84b7))

## [1.6.6](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.6.5...v1.6.6) (2024-02-05)

### :repeat: Chore

- update github release ([cd44edf](https://github.com/elreco/vue-tailwind-datepicker/commit/cd44edf492c18810b4c1f32422a43daab2a5b01f))

## [1.6.5](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.6.4...v1.6.5) (2024-02-05)

### :repeat: Chore

- update gh token ([ea501c7](https://github.com/elreco/vue-tailwind-datepicker/commit/ea501c7878594ab1d656de89fe5102074dfe847d))

## [1.6.4](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.6.3...v1.6.4) (2024-02-05)

_Release-only version bump — no user-facing changes._

## [1.6.3](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.6.2...v1.6.3) (2024-02-05)

### :repeat: Chore

- update release ([c325818](https://github.com/elreco/vue-tailwind-datepicker/commit/c3258189611781a7353e52d038f096bc57da4189))

## [1.6.2](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.6.1...v1.6.2) (2024-01-31)

### Bug Fixes

- export types ([5f6173c](https://github.com/elreco/vue-tailwind-datepicker/commit/5f6173c6c248d56b9a88ce54ba9fd3ee25ac8316))

## [1.6.1](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.6.0...v1.6.1) (2023-10-12)

### Bug Fixes

- **version:** fix version ([edc239c](https://github.com/elreco/vue-tailwind-datepicker/commit/edc239c3a268a60318b99ee6baa89e451397e5ea))

# [1.6.0](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.5.4...v1.6.0) (2023-10-12)

### Bug Fixes

- **shortcuts:** update css to fix visual glitch when picker use as-single use-range at the same time ([90c96ff](https://github.com/elreco/vue-tailwind-datepicker/commit/90c96ffda97cd03cb1be26bfa71f1da63d246476))

### Features

- **typing:** add event typing and refactor locale loading ([2445527](https://github.com/elreco/vue-tailwind-datepicker/commit/244552703323873f93683abde217039e8a902cb2))

## [1.5.4](https://github.com/elreco/vue-tailwind-datepicker/compare/v1.5.3...v1.5.4) (2023-10-12)

### Bug Fixes

- **release:** add build step ([1a2edf7](https://github.com/elreco/vue-tailwind-datepicker/commit/1a2edf78da228efae239c7832310e08512ecb0ab))

## [v1.5.3](https://github.com/elreco/vue-tailwind-datepicker/compare/1.5.3...v1.5.3) (2023-10-12)

### :repeat: Chore

- configure semantic-release, commitlint, commitizen, and husky hooks ([be89a71](https://github.com/elreco/vue-tailwind-datepicker/commit/be89a716fb46e70a2f2e25e1c3f21c4f4dfc0ced), [2ff5175](https://github.com/elreco/vue-tailwind-datepicker/commit/2ff5175), [9184e72](https://github.com/elreco/vue-tailwind-datepicker/commit/9184e72), [7cdc438](https://github.com/elreco/vue-tailwind-datepicker/commit/7cdc438), [8a6f3f6](https://github.com/elreco/vue-tailwind-datepicker/commit/8a6f3f6), [ce26f42](https://github.com/elreco/vue-tailwind-datepicker/commit/ce26f42))

> Tags switched from bare `1.x.y` to `v1.x.y` at this point. Earlier entries reference unversioned tags.

## [1.5.3](https://github.com/elreco/vue-tailwind-datepicker/compare/1.5.2...1.5.3) (2023-10-09)

### Bug Fixes

- **input:** stop event propagation on input typing ([f9d5740](https://github.com/elreco/vue-tailwind-datepicker/commit/f9d5740))

## [1.5.2](https://github.com/elreco/vue-tailwind-datepicker/compare/1.5.1...1.5.2) (2023-10-02)

### Features

- **calendar:** add new props to show week number in calendar ([63ed3f0](https://github.com/elreco/vue-tailwind-datepicker/commit/63ed3f0))

## [1.5.1](https://github.com/elreco/vue-tailwind-datepicker/compare/1.5.0...1.5.1) (2023-09-28)

### Features

- **slot:** add new slot for input icon ([fc80130](https://github.com/elreco/vue-tailwind-datepicker/commit/fc80130))

### Bug Fixes

- **reactivity:** track v-model change to reflect it into the picker ([016f1d4](https://github.com/elreco/vue-tailwind-datepicker/commit/016f1d4))

# [1.5.0](https://github.com/elreco/vue-tailwind-datepicker/compare/1.4.6...1.5.0) (2023-09-26)

### Features

- **global:** full project TypeScript conversion ([591f32b](https://github.com/elreco/vue-tailwind-datepicker/commit/591f32b))
- **locale:** add locale selector for development ([117769c](https://github.com/elreco/vue-tailwind-datepicker/commit/117769c))
- **locale:** use `import.meta.glob` to lazy-load locale files ([591f32b](https://github.com/elreco/vue-tailwind-datepicker/commit/591f32b))

## [1.4.6](https://github.com/elreco/vue-tailwind-datepicker/compare/1.4.5...1.4.6) (2023-08-10)

### Bug Fixes

- add boolean type for shortcuts props ([a362b94](https://github.com/elreco/vue-tailwind-datepicker/commit/a362b94))

## [1.4.5](https://github.com/elreco/vue-tailwind-datepicker/compare/1.4.4...1.4.5) (2023-06-04)

### Bug Fixes

- fix wrong classes for responsive layout ([eaee781](https://github.com/elreco/vue-tailwind-datepicker/commit/eaee781))

## [1.4.4](https://github.com/elreco/vue-tailwind-datepicker/compare/1.4.3...1.4.4) (2023-05-01)

### Features

- add `disabled` prop to handle a fully disabled date picker ([6167c2a](https://github.com/elreco/vue-tailwind-datepicker/commit/6167c2a))

### Bug Fixes

- fix dark-mode styling for before-triangle element ([3c3618c](https://github.com/elreco/vue-tailwind-datepicker/commit/3c3618c))

## [1.4.3](https://github.com/elreco/vue-tailwind-datepicker/compare/1.4.1...1.4.3) (2023-03-14)

### :rewind: Reverts

- remove `tw-` prefix for all Tailwind classes ([33cd7ee](https://github.com/elreco/vue-tailwind-datepicker/commit/33cd7ee))

## [1.4.1](https://github.com/elreco/vue-tailwind-datepicker/compare/1.3.2...1.4.1) (2023-03-14)

### Features

- add `clearPicker` as public method for use outside of component ([cb4f62c](https://github.com/elreco/vue-tailwind-datepicker/commit/cb4f62c))

### Bug Fixes

- fix calendar not rendering properly after Tailwind classes were modified ([4785065](https://github.com/elreco/vue-tailwind-datepicker/commit/4785065))

## [1.3.2](https://github.com/elreco/vue-tailwind-datepicker/compare/1.3.1...1.3.2) (2023-03-01)

_Patch update — no user-facing changes._

## [1.3.1](https://github.com/elreco/vue-tailwind-datepicker/compare/1.3.0...1.3.1) (2023-02-17)

### Bug Fixes

- export datepicker props interface ([b3b54f5](https://github.com/elreco/vue-tailwind-datepicker/commit/b3b54f5))

# [1.3.0](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.12...1.3.0) (2023-02-17)

### Features

- add `weekdaysSize` prop ([bbb9954](https://github.com/elreco/vue-tailwind-datepicker/commit/bbb9954))

## [1.2.12](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.11...1.2.12) (2023-02-08)

### Bug Fixes

- fix single-date selection issue ([9bb2c17](https://github.com/elreco/vue-tailwind-datepicker/commit/9bb2c17))

## [1.2.11](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.10...1.2.11) (2023-02-01)

### Bug Fixes

- fix responsive width ([628ff33](https://github.com/elreco/vue-tailwind-datepicker/commit/628ff33))

### :repeat: Chore

- add esbuild ([d04cdfa](https://github.com/elreco/vue-tailwind-datepicker/commit/d04cdfa))

## [1.2.10](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.9...1.2.10) (2023-01-26)

### Bug Fixes

- better TypeScript config on shortcuts ([4ea9bda](https://github.com/elreco/vue-tailwind-datepicker/commit/4ea9bda))

## [1.2.9](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.8...1.2.9) (2023-01-23)

### Bug Fixes

- model-value check and CSS improvements ([c3c44ee](https://github.com/elreco/vue-tailwind-datepicker/commit/c3c44ee))

## [1.2.8](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.7...1.2.8) (2023-01-23)

### Bug Fixes

- fix close function and import `onBeforeMount` ([fd272f8](https://github.com/elreco/vue-tailwind-datepicker/commit/fd272f8))

## [1.2.7](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.6...1.2.7) (2023-01-22)

### Features

- emit events for month/year/page (prev/next) changes ([2bf2bbf](https://github.com/elreco/vue-tailwind-datepicker/commit/2bf2bbf))

### Bug Fixes

- set initial value when mounting component ([5519ab2](https://github.com/elreco/vue-tailwind-datepicker/commit/5519ab2))

## [1.2.6](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.5...1.2.6) (2022-12-26)

### Bug Fixes

- better focus management ([8c7dbd3](https://github.com/elreco/vue-tailwind-datepicker/commit/8c7dbd3))

## [1.2.5](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.4...1.2.5) (2022-12-26)

### Bug Fixes

- full width for single date picker ([ce9773c](https://github.com/elreco/vue-tailwind-datepicker/commit/ce9773c))

## [1.2.4](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.3...1.2.4) (2022-12-26)

### Bug Fixes

- fix focus state ([ba9c5a7](https://github.com/elreco/vue-tailwind-datepicker/commit/ba9c5a7))

## [1.2.3](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.2...1.2.3) (2022-12-13)

_Release-only version bump — no user-facing changes._

## [1.2.2](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.1...1.2.2) (2022-12-13)

### Features

- enable shortcuts for range and single mode ([acb7eaf](https://github.com/elreco/vue-tailwind-datepicker/commit/acb7eaf))

## [1.2.1](https://github.com/elreco/vue-tailwind-datepicker/compare/1.2.0...1.2.1) (2022-12-12)

### Bug Fixes

- conditional close behavior ([2138dcf](https://github.com/elreco/vue-tailwind-datepicker/commit/2138dcf))

# [1.2.0](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.8...1.2.0) (2022-12-11)

### Features

- display datepicker without input ([f569745](https://github.com/elreco/vue-tailwind-datepicker/commit/f569745))

### Bug Fixes

- fix mobile version styling ([c0cef36](https://github.com/elreco/vue-tailwind-datepicker/commit/c0cef36))
- hide cancel button in mobile version ([ce931dd](https://github.com/elreco/vue-tailwind-datepicker/commit/ce931dd))

## [1.1.8](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.7...1.1.8) (2022-12-07)

### Bug Fixes

- check for optional parameter ([54e5ff0](https://github.com/elreco/vue-tailwind-datepicker/commit/54e5ff0))

## [1.1.7](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.6...1.1.7) (2022-11-29)

_Release-only version bump — no user-facing changes._

## [1.1.6](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.5...1.1.6) (2022-11-29)

### Bug Fixes

- fix first day of the month depending on locale ([45fec1b](https://github.com/elreco/vue-tailwind-datepicker/commit/45fec1b))

## [1.1.5](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.4...1.1.5) (2022-11-16)

### :repeat: Chore

- revert vite-plugin-dts version; set `skipLibCheck: true` in tsconfig ([d762099](https://github.com/elreco/vue-tailwind-datepicker/commit/d762099), [f5dea6b](https://github.com/elreco/vue-tailwind-datepicker/commit/f5dea6b))

## [1.1.4](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.3...1.1.4) (2022-11-16)

### :repeat: Chore

- bump vite-plugin-dts, dayjs, vite-plugin-css-injected-by-js, vue, postcss ([59b4c79](https://github.com/elreco/vue-tailwind-datepicker/commit/59b4c79))

## [1.1.3](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.2...1.1.3) (2022-11-15)

### Bug Fixes

- fix CSS on date hovered ([f02946f](https://github.com/elreco/vue-tailwind-datepicker/commit/f02946f))

## [1.1.2](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.1...1.1.2) (2022-11-06)

### Bug Fixes

- add type definition file to build output ([ce22b3f](https://github.com/elreco/vue-tailwind-datepicker/commit/ce22b3f))

## [1.1.1](https://github.com/elreco/vue-tailwind-datepicker/compare/1.1.0...1.1.1) (2022-11-06)

### Bug Fixes

- fix Start/End date string not assignable to `modelValue` type ([5d3c196](https://github.com/elreco/vue-tailwind-datepicker/commit/5d3c196))

# [1.1.0](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.10...1.1.0) (2022-10-27)

### Features

- add typing definitions ([e00907f](https://github.com/elreco/vue-tailwind-datepicker/commit/e00907f))

### Bug Fixes

- ignore 1Password, Dashlane and LastPass popups ([9b0aa9b](https://github.com/elreco/vue-tailwind-datepicker/commit/9b0aa9b))

## [1.0.10](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.9...1.0.10) (2022-10-20)

_Release-only version bump — no user-facing changes._

## [1.0.9](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.8...1.0.9) (2022-10-20)

### Bug Fixes

- fix disable date ([16c15d4](https://github.com/elreco/vue-tailwind-datepicker/commit/16c15d4))

## [1.0.8](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.7...1.0.8) (2022-09-28)

### :repeat: Chore

- update packages ([4bd5051](https://github.com/elreco/vue-tailwind-datepicker/commit/4bd5051))

## [1.0.7](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.6...1.0.7) (2022-09-19)

### :repeat: Chore

- add auto-publish on npm GitHub workflow ([d10bebd](https://github.com/elreco/vue-tailwind-datepicker/commit/d10bebd))

## [1.0.6](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.5...1.0.6) (2022-09-09)

### :repeat: Chore

- update homepage ([1d93461](https://github.com/elreco/vue-tailwind-datepicker/commit/1d93461))

## [1.0.5](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.4...1.0.5) (2022-09-08)

### Bug Fixes

- replace dynamic import with glob import ([b337431](https://github.com/elreco/vue-tailwind-datepicker/commit/b337431))

## [1.0.4](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.3...1.0.4) (2022-09-08)

### Bug Fixes

- add locale folder to published files ([1dc0c6c](https://github.com/elreco/vue-tailwind-datepicker/commit/1dc0c6c))

## [1.0.3](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.2...1.0.3) (2022-09-07)

### Bug Fixes

- update popover panel z-index ([32b78b4](https://github.com/elreco/vue-tailwind-datepicker/commit/32b78b4))

## [1.0.2](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.1...1.0.2) (2022-09-07)

### Bug Fixes

- fix modal placement ([75380e6](https://github.com/elreco/vue-tailwind-datepicker/commit/75380e6))

## [1.0.1](https://github.com/elreco/vue-tailwind-datepicker/compare/1.0.0...1.0.1) (2022-09-07)

### Bug Fixes

- delete console log and add fallback ([2766c87](https://github.com/elreco/vue-tailwind-datepicker/commit/2766c87))

# [1.0.0](https://github.com/elreco/vue-tailwind-datepicker/releases/tag/1.0.0) (2022-09-07)

Initial release.
