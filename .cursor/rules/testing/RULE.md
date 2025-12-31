---
description: "Mandatory testing requirements for ExtractMD (Vitest and Playwright)"
alwaysApply: true
---

# Testing Requirements

## CRITICAL: Always Write Tests
- **Before refactoring:** Write tests for existing behavior.
- **New features:** Write tests alongside implementation.
- **Bug fixes:** Add a regression test.
- Run `npm test` before committing changes.

## Unit Tests (Vitest)
- Test pure functions and business logic.
- Mock Chrome APIs using `extension/__tests__/setup.js`.
- Aim for >80% coverage on refactored modules.
- Keep tests fast (<1s per suite).
- Use descriptive names: "should do X when Y".

## E2E Tests (Playwright)
- Test full user workflows.
- Use test fixtures in `tests/e2e/fixtures/`.
- Skip real site tests by default (use `.skip`).

## Test Commands
```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:coverage # With coverage
npm run test:e2e      # E2E tests
```

