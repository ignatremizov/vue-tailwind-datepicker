# Screenshot Assets

This folder contains curated UI screenshots for the docs, captured from `src/App.vue` in the **All-features playground**.

## Coverage

| File                                                  | Intent                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `all-features-wheel-page-single-calendar.png`         | Wheel-page, single range, calendar view                                                          |
| `all-features-wheel-page-single-selector.png`         | Wheel-page, selector view                                                                        |
| `all-features-wheel-page-single-time.png`             | Wheel-page, time view                                                                            |
| `all-features-wheel-page-single-time-after-date.png`  | Wheel-page, `timePageMode=after-date`                                                            |
| `all-features-wheel-page-dual-calendar.png`           | Wheel-page, dual range, calendar                                                                 |
| `all-features-wheel-page-dual-time.png`               | Wheel-page, dual range, time                                                                     |
| `all-features-wheel-inline-below-single.png`          | Wheel-inline, below, single                                                                      |
| `all-features-wheel-inline-below-dual.png`            | Wheel-inline, below, dual                                                                        |
| `all-features-wheel-inline-right-single.png`          | Wheel-inline, right, single                                                                      |
| `all-features-wheel-inline-right-dual.png`            | Wheel-inline, right, dual                                                                        |
| `all-features-time-input-single.png`                  | `timePickerStyle=input`                                                                          |
| `all-features-time-none-single.png`                   | `timePickerStyle=none`                                                                           |
| `all-features-selector-page-calendar.png`             | `selectorStyle=page`, calendar                                                                   |
| `all-features-selector-page-month-view.png`           | `selectorStyle=page`, month view                                                                 |
| `all-features-shortcuts-off.png`                      | `shortcutsMode=off`                                                                              |
| `all-features-shortcuts-modern-preset.png`            | `shortcutsMode=modern preset`                                                                    |
| `all-features-shortcuts-legacy-preset.png`            | `shortcutsMode=legacy preset`                                                                    |
| `all-features-shortcuts-off-dual-page-below.png`      | `shortcutsMode=off`, dual, `timePickerStyle=wheel-page`                                          |
| `all-features-shortcuts-off-dual-input-below.png`     | `shortcutsMode=off`, dual, `timePickerStyle=input`                                               |
| `all-features-shortcuts-off-dual-inline-below.png`    | `shortcutsMode=off`, dual, `timePickerStyle=wheel-inline`, `wheelInlinePosition=below`           |
| `all-features-shortcuts-legacy-dual-page-below.png`   | `shortcutsMode=legacy`, dual, `timePickerStyle=wheel-page`                                       |
| `all-features-shortcuts-legacy-dual-input-below.png`  | `shortcutsMode=legacy`, dual, `timePickerStyle=input`                                            |
| `all-features-shortcuts-legacy-dual-inline-below.png` | `shortcutsMode=legacy`, dual, `timePickerStyle=wheel-inline`, `wheelInlinePosition=below`        |
| `all-features-shortcuts-modern-dual-page-below.png`   | `shortcutsMode=modern preset`, dual, `timePickerStyle=wheel-page`                                |
| `all-features-shortcuts-modern-dual-input-below.png`  | `shortcutsMode=modern preset`, dual, `timePickerStyle=input`                                     |
| `all-features-shortcuts-modern-dual-inline-below.png` | `shortcutsMode=modern preset`, dual, `timePickerStyle=wheel-inline`, `wheelInlinePosition=below` |
| `all-features-weekend-styling-off.png`                | Weekend tint disabled                                                                            |
| `all-features-direct-year-input-off-selector.png`     | Direct year input disabled                                                                       |
| `all-features-year-astronomical-selector.png`         | `yearNumberingMode=astronomical`                                                                 |
| `all-features-wheel-scroll-boundary-selector.png`     | Selector wheels in `wheelScrollMode=boundary` (static selector state)                            |
| `all-features-selector-year-bottom-edge-clock.png`    | Selector year-wheel bottom edge loading/clock indicator                                          |
| `all-features-locale-de-calendar.png`                 | Locale switch (`de`)                                                                             |
| `all-features-format-hh-mm-time.png`                  | Time format `HH:mm`                                                                              |
| `all-features-format-hh-mm-a-time.png`                | Time format `hh:mm A`                                                                            |
| `all-features-format-hh-mm-ss-time.png`               | Time format `HH:mm:ss`                                                                           |
| `all-features-format-hh-mm-ss-a-time.png`             | Time format `hh:mm:ss A`                                                                         |

## Animation Coverage

| File                                                     | Intent                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `animations/time-wheel-boundary-noon-flip.mp4`           | Time wheel carry at noon (`11:59:59 AM -> 12:00:00 PM`) in `boundary` mode   |
| `animations/time-wheel-fractional-noon-flip.mp4`         | Time wheel carry at noon (`11:59:59 AM -> 12:00:00 PM`) in `fractional` mode |
| `animations/selector-wheel-boundary-year-rollover.mp4`   | Month/year selector rollover in `boundary` mode                              |
| `animations/selector-wheel-fractional-year-rollover.mp4` | Month/year selector rollover in `fractional` mode                            |

## Update workflow

1. Run app dev server (default Vite dev URL is typically `http://127.0.0.1:5173/`).
2. Run `npm run docs:screenshots` (or pass a custom URL, for example `npm run docs:screenshots -- http://127.0.0.1:4180/`).
3. Run `npm run docs:videos` (or `npm run docs:videos -- http://127.0.0.1:4180/`) to regenerate wheel animation MP4 files.
4. Overwrite existing files in this folder and update `docs/screenshot-gallery.md` when adding/removing scenarios.

Video scenarios are seeded to deterministic start values before capture:

- `time-wheel-boundary-noon-flip`: `11:59:57 AM`
- `time-wheel-fractional-noon-flip`: `11:59:52 AM`

The script hard-fails when wheel state does not match the expected seed (for example `Boundary seed mismatch` / `Fractional seed mismatch`) to avoid producing misleading videos from stale UI state.

Video quality tuning is available via env vars:

- `DOC_SCREENSHOT_VIEWPORT_WIDTH` (default `1800`)
- `DOC_SCREENSHOT_VIEWPORT_HEIGHT` (default `1300`)
- `DOC_SCREENSHOT_DEVICE_SCALE` (default `2`)
- `DOC_SCREENSHOT_ZOOM` (default `1.0`)

- `CAPTURE_FPS` (default `60`)
- `VIDEO_FPS` (default `60`)
- `VIDEO_INTERPOLATE_FPS` (default `0`, disabled; set non-zero to enable optical-flow interpolation)
- `VIDEO_SCALE_WIDTH` (default `0`, keep native capture size; set e.g. `1920` to force width)
- `VIDEO_CRF` (default `16`, lower is higher quality/larger files)

The generator writes:

- Picker-only captures to `docs/assets/screenshots/`
- Wider settings+picker context captures to `docs/assets/screenshots/context/`
- Animation videos to `docs/assets/screenshots/animations/`

Only keep curated documentation assets here; keep transient debug captures out of this folder.
