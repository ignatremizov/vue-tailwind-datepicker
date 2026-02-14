<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.0.1
- Modified sections: Sources of Truth, Governance metadata
- Added sections: None
- Removed sections: None
- Templates requiring updates: None
- Deferred items:
  - TODO(ENGINEERING_GUIDE): repository-local AGENTS.md path is not present; define canonical engineering guide path.
-->

# vue-tailwind-datepicker Constitution

## Core Principles

### I. Backward Compatibility by Default
All new behavior MUST be opt-in unless explicitly approved as breaking. Existing consumers MUST
retain current behavior when new feature flags/props are not enabled.

### II. Spec-Driven Changes
Feature work MUST trace back to `spec.md`, `plan.md`, and `tasks.md` under `specs/`.
Implementation tasks MUST map to explicit requirements and success criteria.

### III. Deterministic UX Semantics
UI behavior MUST be explicit, testable, and mode-aware. For range flows, selection context
rules MUST be documented and preserved without hidden side effects.

### IV. Verification Before Merge
Changes MUST pass typecheck and build, and MUST include manual verification for UX-critical
flows and edge cases defined in the feature quickstart.

### V. Minimal-Risk Evolution
Prefer incremental, low-churn changes in existing architecture. Introduce new component or API
surface only when simpler extensions cannot satisfy requirements.

## Sources of Truth

- **Requirements, scope, and status**: active feature artifacts under `specs/NNN-feature-name/` (`spec.md`, `plan.md`, `tasks.md`), selected by the current feature branch/work item
- **Engineering standards and decision rules**: TODO(ENGINEERING_GUIDE): define repository-local AGENTS.md (or equivalent canonical standards file) path

## Quality Gates

All feature PRs MUST satisfy:
- `npm run typecheck`
- `npm run build`
- Manual checks documented in the relevant `quickstart.md`
- Traceability from tasks to requirements/success criteria

## Workflow & Review

Use Spec-Kit phases in order: specify -> plan -> tasks -> analyze -> implement.
Before implementation, cross-artifact analysis MUST report no unaddressed critical issues.
Warnings MUST be either resolved or explicitly accepted with rationale.

## Governance

This constitution governs feature-process rules for this repository and supersedes conflicting
local practices for spec-driven work.

Amendment policy:
- MAJOR: incompatible governance/principle changes
- MINOR: new principle or materially expanded requirement
- PATCH: clarifications and editorial updates

Compliance review expectations:
- Planning artifacts MUST include constitution check status
- Reviewers SHOULD verify traceability and quality-gate completion

**Version**: 1.0.1 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-13
