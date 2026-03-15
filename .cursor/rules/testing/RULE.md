---
description: 'Mandatory testing requirements for ExtractMD (Vitest-first)'
alwaysApply: true
---

# Testing Requirements

## Core Rule

- **Before refactoring:** lock in behavior with tests first.
- **New features:** add tests in the same change.
- **Bug fixes:** add a regression test that fails before the fix.
- Run relevant tests before requesting review.

## Unit Tests (Vitest)

- Unit tests live in `tests/unit/`.
- Shared test setup lives in `tests/unit/setup.js`.
- Prefer focused tests near the touched behavior (content, popup, options, shared modules).
- Mock Chrome APIs through the existing test setup/mocks rather than ad-hoc globals.
- Use descriptive names that explain scenario + expectation.

## E2E Coverage

- There is no active `tests/e2e/` suite in this repo right now.
- If E2E tests are introduced later, add them under `tests/e2e/` and document the command in `package.json` and project docs.

## Test Commands

```bash
pnpm test                 # Watch mode
pnpm run test:run         # Run once
pnpm run test:coverage    # With coverage
```
