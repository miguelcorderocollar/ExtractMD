---
description: 'Git commit and branch naming conventions'
alwaysApply: true
---

# Git Conventions

## Branch Naming

Follow the pattern: `<category>/<reference>/<description-in-kebab-case>`

**Categories:** `feature`, `bugfix`, `hotfix`, `test`, `refactor`

**Examples:**

- `feature/issue-42/reddit-extraction`
- `refactor/phase-2/shared-defaults`
- `bugfix/issue-100/list-rendering`

## Commit Messages

Follow the pattern: `<category>: <imperative statement(s)>`

**Categories:** `feat`, `fix`, `refactor`, `test`, `chore`, `docs`

**Examples:**

- `feat: add Reddit content extraction`
- `refactor: extract floating button component`
- `test: add markdown conversion tests`

**Multi-action Commits:** Separate with semicolons:
`feat: add new button component; integrate into popup`
