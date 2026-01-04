# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
