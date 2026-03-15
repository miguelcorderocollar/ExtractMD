# Contributing to ExtractMD

Thanks for your interest in contributing to ExtractMD! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js** (LTS version recommended)
- **pnpm** (package manager)
- **Chrome** or a Chromium-based browser

### Setup

```bash
# Clone the repository
git clone https://github.com/miguelcorderocollar/ExtractMD.git
cd ExtractMD

# Install dependencies
pnpm install

# Run the development build
pnpm run build

# Run tests
pnpm test
```

### Loading the Extension Locally

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder from the project root

## Development Workflow

### Branch Naming

Create a branch from `main` using one of these prefixes:

- `feat/<description>` — new feature
- `fix/<description>` — bug fix
- `refactor/<description>` — code refactoring
- `chore/<description>` — tooling, CI, docs, etc.

### Code Quality

Before submitting your changes, make sure everything passes:

```bash
# Format code
pnpm run format

# Lint
pnpm run lint

# Run tests
pnpm test
```

Pre-commit hooks will automatically format staged files, but running the full suite ensures consistency.

### Testing

ExtractMD uses **Vitest** for unit tests and **Playwright** for end-to-end tests.

- Unit tests live in `tests/unit/`
- E2E tests live in `tests/e2e/`

When adding a new feature or fixing a bug, include tests that verify the behavior.

### Changelog

Update `CHANGELOG.md` under `## [Unreleased]` with a brief description of your change. Follow the [Keep a Changelog](https://keepachangelog.com/) format.

## Submitting a Pull Request

1. Push your branch to your fork (or the repository if you have access)
2. Open a pull request against `main`
3. Fill out the PR template — it will appear automatically
4. Make sure CI checks pass
5. A maintainer will review your PR

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Write a clear title using conventional commit style (e.g., `feat: add Reddit integration`)
- Include before/after screenshots for UI changes
- Reference related issues (e.g., `Closes #42`)

## Reporting Issues

Use our [issue templates](https://github.com/miguelcorderocollar/ExtractMD/issues/new/choose) to:

- **Report a bug** — include reproduction steps, expected vs. actual behavior, and browser/version info
- **Request a feature** — describe the use case and proposed solution
- **Ask a question** — if you need help using or configuring ExtractMD

## Architecture Overview

ExtractMD is a Chrome Extension (Manifest V3) with this structure:

```
extension/
├── content/           # Content scripts (per-site extractors)
│   ├── components/    # Shared UI components (FloatingButton, etc.)
│   ├── youtube/       # YouTube integration
│   ├── hackernews/    # Hacker News integration
│   ├── x/             # X/Twitter integration
│   └── ...
├── shared/            # Shared utilities and modules
├── popup.html/js      # Extension popup
├── options.html/js    # Settings page
├── background.js      # Service worker
└── manifest.json
```

Key principles:

- **Modular extractors** — each site integration lives in its own directory
- **Shared components** — reusable UI elements in `content/components/`
- **Local processing** — all data processing happens in the browser, no external servers

## Code of Conduct

Be respectful and constructive. We're building something useful together.

## Questions?

Open a [question issue](https://github.com/miguelcorderocollar/ExtractMD/issues/new?template=question.yml) or reach out through the project's GitHub page.
