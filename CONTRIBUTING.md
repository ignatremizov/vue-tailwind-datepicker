# Contributing

Thanks for contributing to this fork.

Maintainer: **Ignat Remizov** (<ignat@ignatremizov.com>)

## Development

Use Node 24.22.3 and the npm 12.2.2 pin declared in `packageManager`. Review the
[install-script policy](./README.md#install-script-policy) before changing dependencies.

```bash
npm ci
npm --prefix docs ci
npm run test:npm-policy
npm run test:unit
npm run build
npm exec -- playwright install chromium
npm run test:browser
npm run lint
```

`test:browser` uses the built package directly, with no application bundler or
consumer Tailwind scan. It checks standalone rendering, both stylesheet orders,
host controls and responsive layouts, calendar selection, selectors, time wheels,
popovers, dark mode, and public theme tokens.

## Commit Style

Use Conventional Commits (for semantic-release):

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `test: ...`
- `chore: ...`

## Pull Requests

- Open PRs against `main`.
- Include behavior notes and test coverage updates.
- Keep docs in sync for user-facing changes.

## Credits

This fork keeps upstream attribution in:

- `CONTRIBUTORS.md`
- `LICENSE`
