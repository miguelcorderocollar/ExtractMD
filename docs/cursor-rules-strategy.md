# Cursor AI Rules Configuration Strategy for ExtractMD (Updated Dec 2024)

## Executive Summary
Following the latest December 2024 Cursor documentation, we are adopting the **Project Rules** folder-based architecture. This replaces the legacy `.cursorrules` and `.mdc` formats with a modular, context-aware system.

---

## Architecture Overview

### 1. Primary: Project Rules (`.cursor/rules/`)
We use scoped rules to provide the AI with only the context it needs. Each rule lives in its own folder with a `RULE.md` file.

| Rule Name | Scope (Globs) | Description |
|-----------|---------------|-------------|
| `core-standards` | `*` | General JS standards, Chrome extension patterns, and anti-patterns. |
| `testing` | `*` | Mandatory test-first approach, Vitest/Playwright setup. |
| `refactoring` | `*` | Context for the 7-phase refactoring plan and current progress. |
| `git-conventions` | `*` | Branch and commit naming standards. |
| `content-scripts`| `extension/content/**` | Scoped logic for DOM isolation and MutationObservers. |

### 2. High-Level: `AGENTS.md`
Located in the root, this file provides the high-level project identity and "mission statement" for the AI Agent.

---

## Implementation Details

### Why this is the "Best Setup"
1. **Intelligent Application**: Cursor only loads "Testing" rules when relevant, saving context window space.
2. **Path Scoping**: We can enforce specific rules only for content scripts (e.g., "Always prefix IDs with `yt-transcript-`") without cluttering popup development.
3. **Version Controlled**: Rules are part of the repo, ensuring all contributors (and AI agents) follow the same guidelines.
4. **Future-Proof**: Aligns with Cursor's official deprecation roadmap for `.cursorrules`.

---

## Migration from Legacy
1. **DELETE** `.cursorrules` (Legacy)
2. **DELETE** `rules.mdc` (Legacy)
3. **MOVE** content into focused folders in `.cursor/rules/`

---

## Maintenance
- Review `.cursor/rules/refactoring/RULE.md` after every phase completion.
- Check Cursor settings to ensure all rules are active and recognized.
