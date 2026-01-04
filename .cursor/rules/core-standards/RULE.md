---
description: 'Core JavaScript and Chrome Extension standards for ExtractMD'
alwaysApply: true
---

# Core Standards

## Project Context

- **Type:** Chrome Extension (Manifest V3)
- **Stack:** Vanilla JavaScript, ESBuild bundler
- **Purpose:** Extract content (YouTube, HN, Articles) to Markdown

## Code Style

- Use ES6 modules (`import`/`export`)
- Prefer `async`/`await` over promise chains
- Use `const` by default, `let` only when mutation is required. Never use `var`.
- Clear, descriptive function names in `camelCase`.
- Use `console.debug` for development logs; never use `console.log` in production.

## Chrome Extension Patterns

- Use `chrome.storage.sync` for user settings.
- Use `chrome.runtime.sendMessage` for cross-context communication.
- Follow service worker patterns for `background.js`.
- Always prefix injected elements with `yt-transcript-` to avoid page conflicts.

## Anti-Patterns to Avoid

- ❌ Duplicate `DEFAULTS` objects (use shared module when implemented).
- ❌ Inline long callbacks (extract named functions).
- ❌ Use `alert()` or `confirm()` in content scripts (use custom UI).
- ❌ Create files >300 lines (split into modules).
