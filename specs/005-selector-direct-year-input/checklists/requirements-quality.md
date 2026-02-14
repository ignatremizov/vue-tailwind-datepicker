# Requirements Quality Checklist: Selector Direct Year Input

**Purpose**: Assess whether requirements for selector direct-year input are complete, clear, consistent, and measurable before implementation.
**Created**: 2026-02-13
**Feature**: `specs/005-selector-direct-year-input/spec.md`

## Scope and Activation

- [ ] CHK001 Is the availability scope explicit that direct year typing is limited to selector mode entered from header toggle flow, with no conflicting statements elsewhere? [Spec Section User Story 1] [Spec Section CL-001] [Conflict]
- [ ] CHK002 Is the opt-in rollout requirement clear about default-off behavior and backward compatibility expectations? [Spec Section FR-010] [Spec Section CL-006]
- [ ] CHK003 Is the relationship between direct typing and existing scroll selector interaction defined as coexistence rather than replacement? [Spec Section FR-005] [Spec Section CL-002]
- [ ] CHK004 Is the active context targeting rule explicit for single mode versus active range panel mode? [Spec Section FR-017] [Spec Section CL-017] [Ambiguity]

## Input Grammar and Validation Semantics

- [ ] CHK005 Is the signed token grammar fully specified (optional leading minus, one to five digits) without relying on implementation assumptions? [Spec Section FR-007] [Spec Section CL-008]
- [ ] CHK006 Is normalization behavior clear about trim, minus preservation, and digit sanitization order? [Spec Section FR-011] [Spec Section CL-010] [Ambiguity]
- [ ] CHK007 Are numeric bounds clearly stated as inclusive and consistent across requirements, scenarios, and clarifications? [Spec Section FR-007] [Spec Section User Story 2]
- [ ] CHK008 Is year `0` validity unambiguous in both numbering modes and tied to a default mode requirement? [Spec Section FR-012] [Spec Section FR-013] [Spec Section FR-014]
- [ ] CHK009 Is the scope of `yearNumberingMode` constrained to text input parsing/validation with no implied effect on wheel behavior? [Spec Section FR-020] [Spec Section CL-020]
- [ ] CHK010 Do requirements distinguish invalid token, partial token, and valid token states with deterministic outcomes? [Spec Section FR-003] [Spec Section FR-009] [Gap]

## Live Commit and Reversion Rules

- [ ] CHK011 Is immediate live commit behavior for valid tokens explicit for both navigation state and emitted model state? [Spec Section FR-015] [Spec Section FR-016] [Spec Section CL-016]
- [ ] CHK012 Is the last-valid-year baseline lifecycle explicit about when it advances and when it is used for reversion? [Spec Section FR-015] [Spec Section CL-015] [Ambiguity]
- [ ] CHK013 Is Enter behavior clearly separated from close/apply semantics, including selector staying open? [Spec Section FR-009] [Spec Section CL-009]
- [ ] CHK014 Are Escape and blur outcomes clearly defined when text is invalid or partial? [Spec Section FR-009] [Spec Section User Story 2]
- [ ] CHK015 Is re-anchor behavior for out-of-window valid years explicit enough to avoid multiple interpretations of window regeneration? [Spec Section FR-008] [Spec Section CL-005] [Ambiguity]

## Range Chronology and Commit Boundaries

- [ ] CHK016 Is temporary inversion allowance during live typing explicit and free of hidden auto-correction language? [Spec Section FR-018] [Spec Section CL-018]
- [ ] CHK017 Is normalization timing explicit that Apply and close-with-persist are boundaries, while Enter-in-place is excluded? [Spec Section FR-019] [Spec Section FR-022] [Spec Section CL-019]
- [ ] CHK018 Is the normalization method explicit that endpoint auto-swap is the required outcome at boundary time? [Spec Section FR-021] [Spec Section CL-021]
- [ ] CHK019 Are cancel-like exits explicitly excluded from normalization triggers to prevent persistence-side ambiguity? [Spec Section FR-022] [Spec Section User Story 3]

## Measurability, Coverage, and Dependencies

- [ ] CHK020 Do success criteria include measurable statements for invalid-state prevention, mode-specific year-zero behavior, and immediate update behavior? [Spec Section SC-002] [Spec Section SC-004] [Spec Section SC-005]
- [ ] CHK021 Do user scenarios cover both single and range contexts, including active-panel targeting and inversion lifecycle? [Spec Section User Story 1] [Spec Section User Story 3]
- [ ] CHK022 Are keyboard-only and paste/IME edge cases represented in requirements or explicitly tracked as assumptions? [Spec Section Edge Cases] [Assumption]
- [ ] CHK023 Are non-functional expectations for responsiveness or synchronization stability defined enough for acceptance assessment? [Gap]
- [ ] CHK024 Is there complete traceability from each high-risk requirement area to at least one acceptance scenario and one success criterion? [Spec Section Requirements] [Spec Section User Scenarios & Testing] [Spec Section Success Criteria] [Gap]

## Notes

- Check items off as completed: `[x]`
- Record requirement fixes or clarifications inline next to affected check IDs.
