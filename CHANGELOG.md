# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Generic API Output Mode (All Integrations)**: Added configurable API integrations with templates/secrets, per-source availability and variable mapping, source-grouped variable helpers, and X floating API actions, with fly-in toast feedback and action-aware API settings UX; options **Usage Statistics** KPI cards show per-integration and API link icons for quicker scanning (shared with API source picker icons). Deleting an integration in options now asks for confirmation (same native `confirm` pattern as reset floating-button positions). **Clear Statistics** also confirms before zeroing usage counters and API call counts.

## [1.2.0] - 2026-03-15

### Added

- **X Integration (Posts + Articles)**: Added extraction for X/Twitter posts and long-form articles with metadata, quoted-post blocks, richer media handling, metrics-context output, and dedicated settings/KPI tracking.
- **Floating Button UX (Glass + Mode Hint)**: Added a default frosted-glass button style, a pre-click mode hint badge (`Article` or `Page`), and consistent translucent loading/success/error glass states; article-detected info notifications are now off by default in favor of the hint.
- **YouTube Chapters Toggle**: Added `includeChapters` (enabled by default) to include or skip chapter headers and the `## Chapters` section in transcript output.

### Fixed

- **YouTube Transcript (New UI)**: Restored transcript extraction for YouTube's updated transcript panel DOM while preserving compatibility with the legacy transcript layout.
- **YouTube Chapters Extraction**: Added chapter extraction support for YouTube's new transcript UI (`timeline-chapter-view-model`), rendering chapters both inline as section headers and as a dedicated `## Chapters` summary section with timestamps.
- **X Video Media Extraction**: Improved X video output by extracting direct video links when available and falling back to a permalink + poster-thumbnail capture for blob-backed video players.

### Removed

- **Last Extraction Status (Popup)**: Removed the popup banner and related `lastExtraction` local-storage writes/reads to reduce UI noise and simplify popup state.

## [1.1.0] - 2026-01-04

### Added

- **Global Enable/Disable Toggle**: Add extension-wide enable/disable switch in popup and settings for quick control
- **Accent Color Customization**: New setting to change accent color across the entire extension UI
- **Welcome Modal**: Welcome modal on first installation to introduce users to the extension
- **Initial Notification Settings**: Configurable options for initial notifications on articles and universal extraction
- **Visual Disabled State**: Red extension icon when the extension is disabled for better visibility

### Fixed

- **YouTube Fullscreen**: Button no longer appears on YouTube fullscreen videos
- **Icon Fixes**: Corrected icons for about and info sections in the settings
- **Settings Description Padding**: Improved visual spacing for "options" setting descriptions

## [1.0.0] - 2026-01-01

### Added

- **YouTube Integration**: Extract video transcripts as Markdown with customizable formatting (timestamps, title, channel, URL)
- **Hacker News Integration**: Copy news lists or full comment threads as Markdown
- **Article Extraction**: Convert readable articles to Markdown with optional image support
- **Universal Extractor**: Fallback HTML-to-Markdown converter for any webpage with configurable content selection
- **Floating Button Interface**: Visual button with states (idle, loading, success, error) that appears on supported pages
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac) to trigger extraction
  - `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac) to toggle button visibility for current domain
- **Smart Auto-Download**: Automatically download content as `.md` file when it exceeds configurable token threshold
- **Usage Tracking**: KPI counters for each integration type displayed in popup
- **Domain Ignore List**: Per-domain toggle to disable extraction on specific websites
- **Settings Import/Export**: Backup and restore configuration as JSON
- **Last Extraction Status**: Display recent extraction activity in popup
- **Jump to Domain**: Automatically open a custom URL (e.g., ChatGPT) after copying content
- **Close Tab After Extraction**: Optional automatic tab closure after extraction
- **Token Counting**: Optional GPT token count display in notifications
- **Universal Extraction Settings**:
  - Content mode selection (auto-detect, full page, main element, custom CSS selector)
  - Custom CSS selector support for precise content extraction
  - Strip navigation elements (nav, header, footer, sidebar)
  - Include/exclude options for images, links, and page URL
  - Preserve code blocks with syntax highlighting hints
- **Theme Support**: Light, dark, and system preference themes
- **Comprehensive Settings Page**: Full configuration management via options page
- **Popup Quick Actions**: Quick access to extraction, domain toggle, KPI summary, and last extraction status
- **Notification System**: Toast notifications with customizable themes and animations
- **Modular Architecture**: Shared components and utilities for maintainability
- **Test Coverage**: 203+ unit tests (Vitest) and E2E tests (Playwright)
- **Packaging Script**: Automated Chrome Web Store package generation with validation

### Changed

- Initial release

### Security

- All processing happens locally in the browser
- No data collection or external server communication
- No analytics or tracking
- Open source codebase for transparency
