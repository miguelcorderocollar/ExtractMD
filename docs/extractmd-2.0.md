# ExtractMD 2.0: UI/UX Redesign Documentation

## Overview
ExtractMD 2.0 introduces a modern, streamlined user experience by splitting configuration and quick actions into two distinct areas:

- **Popup**: For fast, in-context actions and status.
- **Options Page**: For all settings, customization, and advanced features.

---

## Popup (Quick Actions & Status)
The popup is now a focused command center for the most common, immediate actions. It is designed for speed and clarity, with minimal clutter.

### Features in the Popup
- **Extract/Copy Now**: One-click extraction and copying of content (transcript, article, comments) from the current tab, using saved settings.
- **Download as Markdown**: Option to download the extracted content as a `.md` file.
- **Open in Target Domain**: If enabled, a button to open the extracted content in a configured site (e.g., ChatGPT, Notion, etc.).
- **Last Extraction Status**: Displays a brief message about the last extraction (success, error, what was copied, etc.).
- **KPI Counters**: Shows a summary of usage statistics (e.g., number of extractions, articles exported, etc.), with a button to view details or reset counters.
- **Settings Button**: Opens the full options page in a new tab.
- **About/Help**: Link to documentation or a help page.
- **Preview Markdown**: Show a preview of the content to be copied/downloaded.
- **Extract & Paste**: If on a supported site, a button to extract and auto-paste into the current input box.

### Side panel Features
- **Side Panel Markdown Preview**: When enabled, clicking the floating button for any integration opens the Chrome side panel and renders the copied markdown (with proper styling and a readable font). This provides a live, nicely formatted preview of what was copied to the clipboard. (Requires manifest entry: `"side_panel": { "default_path": "sidebar.html" }`)

#### Not Included
- No detailed settings or configuration toggles.
- No import/export (moved to options page).
- No "Switch Mode/Quick Switch" or "Pin Last Extraction" features.

---

## Options Page (Full Settings)
The options page is a full-page interface, opened in a new tab, with ample space for all configuration and advanced features.

### Features in the Options Page
- **All Settings**: All checkboxes, toggles, and configuration options for extraction behavior, integrations, and appearance.
- **Side Panel Preview Setting**: Enable or disable the side panel markdown preview feature. When enabled, the extension will open the side panel and render the copied markdown for review.
- **Import/Export Settings**: Backup and restore your settings via JSON files.
- **KPI Details**: View and reset detailed usage statistics.
- **Advanced Features**: Any future advanced or rarely-used features.
- **Help/Documentation**: Links to guides, FAQs, and support.

---

## Rationale
- **Popup**: Fast, actionable, and minimal—ideal for in-the-moment use.
- **Options Page**: Spacious, organized, and comprehensive—ideal for setup and customization.

This separation ensures a clean, user-friendly experience for both new and advanced users. 