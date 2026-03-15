---
description: 'Core JavaScript and Chrome Extension standards for ExtractMD'
alwaysApply: true
---

# Core Standards

## Project Context

- **Type:** Chrome Extension (Manifest V3)
- **Stack:** Vanilla JavaScript, ES modules, esbuild, pnpm
- **Purpose:** Extract content as Markdown from YouTube, Hacker News, X, articles, and universal pages

## Code Style

- Use ES6 modules (`import`/`export`)
- Prefer `async`/`await` over promise chains
- Use `const` by default, `let` only when mutation is required. Never use `var`.
- Clear, descriptive function names in `camelCase`.
- Use `console.debug` for development logs; never use `console.log` in production.
- Keep injected DOM IDs/classes prefixed with `extractmd-` to avoid host-page conflicts.

## Chrome Extension Patterns

- Use `chrome.storage.sync` for user settings and `chrome.storage.local` for local UI state (for example per-domain button position).
- Use `chrome.runtime.sendMessage` for cross-context communication.
- Follow Manifest V3 service worker patterns for `background.js`.
- Keep settings centralized in `extension/shared/defaults.js` and shared storage helpers in `extension/shared/storage.js`.
- When adding settings, update both `DEFAULTS` and `SETTING_SCHEMA`.

## Anti-Patterns to Avoid

- Duplicate `DEFAULTS` objects.
- Direct `chrome.storage` access spread across modules when shared helpers already exist.
- `alert()` or `confirm()` in content scripts (use extension UI/notifications).
- Monolithic files that should be split into smaller modules.
