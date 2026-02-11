# Contract: Selector Mode Interface and Behavior

## Scope

Public and internal behavior contract for native-like month/year selector mode.

## Public Component Contract

### New Prop

- Name: `selectorMode`
- Type: `boolean`
- Default: `false`
- Behavior:
  - `false`: existing month/year panel behavior remains unchanged.
  - `true`: header interaction toggles between calendar and selector views.

## Toggle Behavior Contract

1. Enter selector mode
- Trigger: click month or year label in header while calendar view is active.
- Result:
  - view switches to selector mode.
  - focus target is month/year column based on click target.

2. Exit selector mode
- Trigger: header toggle action from selector view.
- Result:
  - view switches back to calendar mode.
  - selected month/year remains applied.

3. Month/year selection
- Trigger: selecting month or year item in selector mode.
- Result:
  - updates calendar month/year for current `SelectionContext`.
  - does not force-close popover; user remains in selector until toggled back.

## Range-Context Semantics

### Single-panel range (`use-range` + `as-single`)

- Selector applies month/year updates to displayed context only.
- Existing range endpoint selection behavior remains unchanged.

### Double-panel range

- Selector applies month/year updates only to clicked panel context:
  - left header -> `previousPanel`
  - right header -> `nextPanel`
- Cross-panel switching inside selector is out of scope for v1.

## Year Virtualization Contract

- Year choices are conceptually unbounded.
- Implementation may render a moving window around `anchorYear`.
- Scrolling must not require pre-rendering the full integer range.

## Accessibility Contract

- Selector mode remains keyboard reachable.
- Focus transition on enter/exit is deterministic.
- Existing escape/cancel semantics for popover remain intact.
