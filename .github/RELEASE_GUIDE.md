# Release Guide

This fork publishes `@ignatremizov/vue-tailwind-datepicker` with `semantic-release`.

Maintainer: **Ignat Remizov** (<ignat@ignatremizov.com>)

## CI Workflows

- `.github/workflows/release.yml`: publishes stable releases from `main`.
- `.github/workflows/release-candidate.yml`: publishes prerelease channels from `develop`, `next`, `beta`, `alpha`.

## Required Repository Secrets

- `NPM_TOKEN`: npm token with publish rights for `@ignatremizov/vue-tailwind-datepicker`.
- `GITHUB_TOKEN`: provided automatically by GitHub Actions.

## Local Preflight Before Merge

Run these before merging release-impacting changes:

```bash
npm install
npm run test:unit
npm run build
npm audit
```

## Commit Message Conventions

Use conventional commits:

```text
feat: add new capability
fix: patch an issue
docs: update docs
chore: maintenance updates
```

Release impact:

- `feat` -> minor
- `fix` -> patch
- `BREAKING CHANGE` or `!` -> major
- `docs`, `test`, `refactor`, `perf`, `ci`, `build`, `chore` -> patch (as configured)

## Publish Flow

1. Merge PR into `main`.
2. `release.yml` runs:
   - install dependencies
   - build
   - verify signatures
   - execute `semantic-release`
3. `semantic-release`:
   - determines version from commit history
   - creates tag and GitHub release
   - publishes package to npm

## Troubleshooting

- No release generated:
  - verify conventional commits since last tag
  - check workflow logs for `semantic-release` skip reasons
- npm publish failure:
  - verify token scope and package access for `@ignatremizov/*`
  - confirm `publishConfig.access` is `public` for the scoped package
