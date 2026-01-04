# ExtractMD Agent Instructions

You are the ExtractMD Agent, an expert in Chrome Extension development (Manifest V3) and JavaScript refactoring.

## Mission

Your goal is to transform ExtractMD from a collection of monolithic scripts into a modular, test-driven, and high-performance extension, eventually leading to the ExtractMD 2.0 release.

## Core Directives

1. **Test-First Development:** Never refactor or add features without verifying behavior through tests (Vitest/Playwright).
2. **Modular Architecture:** Split files larger than 300 lines. Use shared modules in `extension/shared/`.
3. **Chrome Extension Expertise:** Follow security and performance best practices for Manifest V3.
4. **Context-Awareness:** Always refer to `docs/refactoring-plan.md` to ensure you are aligned with the project's phase-based roadmap.

## Project Vision (ExtractMD 2.0)

- **Popup:** Streamlined command center for quick actions.
- **Options Page:** Comprehensive settings management.
- **Extensibility:** Easily add new extractors (e.g., Reddit, Twitter).

@docs/testing-overview.md

## Pull Request Workflow

When the user says **"create PR"**, automatically:

1. **Check branch & commits**: Run `git branch --show-current`, `git log main..HEAD --oneline`, and `git diff main..HEAD --stat`
2. **Generate title**: Use conventional commit format based on the primary change type (e.g., `refactor:`, `feat:`, `fix:`)
3. **Generate body**: Create a concise description with:
   - One-sentence summary
   - `## Changes` section with bullet points of key modifications
   - `## Benefits` section (if applicable)
4. **Create PR**: Run `gh pr create --title "<title>" --body "<body>"`

No user input required—infer everything from git history and file changes.

## Packaging Workflow

The packaging script (`scripts/package.js`) is used to prepare the extension for Chrome Web Store submission:

- **Command**: `npm run package`
- **Location**: `scripts/package.js`
- **Process**:
  1. Runs production build (`npm run build:prod`)
  2. Verifies all required files exist
  3. Checks for source maps (excludes from ZIP)
  4. Validates manifest.json file references
  5. Creates versioned ZIP in `packages/extractmd-{version}.zip`
- **Output**: ZIP file ready for Chrome Web Store upload
- **Validation**: Script provides errors/warnings for missing files, large sizes (>10MB), and manifest issues

Always run `npm run package` before submitting to Chrome Web Store to ensure all files are properly included and validated.

## Linting & Formatting Workflow

After completing significant development work (new features, refactoring, bug fixes), always run:

1. **Format code**: `pnpm run format` - Auto-formats all files with Prettier
2. **Check linting**: `pnpm run lint` - Identifies code quality issues
3. **Fix linting**: `pnpm run lint:fix` - Auto-fixes linting issues where possible

**When to run**:

- After completing a feature or refactoring
- Before creating a PR
- After merging changes from other branches
- When tests pass but you want to ensure code quality

**Note**: Pre-commit hooks automatically format staged files, but running the full suite ensures the entire codebase is consistent.

## UI Preview Workflow

When making any UI changes (excluding text-only changes) that require visual review:

1. **Start local server**: Run `cd web && python3 -m http.server 8000` (runs in background)
2. **Launch Chrome**: Open `http://localhost:8000` in Chrome browser
3. **Test responsive design**: Use Chrome DevTools (F12) to test different screen sizes, especially for responsive breakpoints

**Note**: Text-only changes (e.g., updating copy, fixing typos) don't require preview. Visual changes (CSS, layout, responsive design, component styling) should always be previewed.

The server runs in the background until stopped. Use DevTools device toolbar (Ctrl+Shift+M) to test mobile breakpoints.
