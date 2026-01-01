# ExtractMD Privacy Policy

**Effective Date:** January 2026  
**Last Updated:** January 2026

## Overview

ExtractMD is a Chrome browser extension that extracts and copies content as Markdown from web pages including YouTube, Hacker News, and general articles. This privacy policy explains how ExtractMD handles user data.

## Data Collection

**ExtractMD does NOT collect, transmit, or share any personal data.**

### What We Don't Do
- ❌ We do NOT send any data to external servers
- ❌ We do NOT collect personal information
- ❌ We do NOT use analytics or tracking services
- ❌ We do NOT share data with third parties
- ❌ We do NOT monitor your browsing activity

### What We Do Store Locally
ExtractMD stores the following data **locally in your browser only**:

1. **User Preferences & Settings**
   - Theme preferences (light/dark mode)
   - Integration visibility settings (YouTube, Hacker News, Articles, Universal)
   - Output format preferences
   - Floating button position and behavior
   - Ignored domains list

2. **Usage Statistics (KPIs)**
   - Number of extractions performed (by type)
   - Token counts for extracted content
   - Last extraction timestamp
   - These statistics are stored locally and are never transmitted

All data is stored using Chrome's built-in `chrome.storage.sync` API, which means:
- Data stays on your device or syncs to your personal Chrome account
- Data is encrypted in transit when syncing between your devices
- Only you have access to your data

## How Content Extraction Works

When you use ExtractMD to extract content:
1. The extension reads the visible content of the current web page
2. Content is processed entirely within your browser
3. Extracted Markdown is copied to your clipboard
4. **No content is ever sent to external servers**

## Permissions Explained

ExtractMD requests the following permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab's content when you request extraction |
| `storage` | Save your preferences and settings locally |
| `clipboardWrite` | Copy extracted Markdown to your clipboard |
| `scripting` | Inject the extraction functionality into web pages |
| `<all_urls>` | Enable the Universal Article Extractor to work on any website |

### Why `<all_urls>` Permission?

ExtractMD includes a Universal Article Extractor that allows you to extract Markdown from **any webpage**, not just YouTube and Hacker News. This enables extraction from:
- Blog posts
- Documentation sites
- News articles
- Any other web content

The extension only processes content when you explicitly request extraction. It does not automatically access, monitor, or collect any browsing data.

## Data Retention

- **Settings**: Stored until you uninstall the extension or clear browser data
- **Usage Statistics**: Stored locally until you reset them via the extension popup
- **Extracted Content**: Only exists in your clipboard; not stored by the extension

## Your Rights

You have full control over your data:
- **Export Settings**: Use the Import/Export feature in the extension options
- **Clear Statistics**: Reset usage statistics from the extension popup
- **Delete All Data**: Uninstall the extension to remove all stored data
- **View Data**: All settings are visible in the extension options page

## Data Security

- All data processing happens locally in your browser
- No data is transmitted over the internet (except Chrome's built-in sync)
- No external servers or databases are used
- The extension source code is open for review

## Children's Privacy

ExtractMD does not knowingly collect any personal information from children under 13 years of age. The extension does not collect personal information from any users.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last Updated" date at the top of this document. Continued use of ExtractMD after changes constitutes acceptance of the updated policy.

## Open Source

ExtractMD is open source. You can review the complete source code to verify our privacy practices:
- **Repository**: [GitHub - ExtractMD](https://github.com/miguelcorderocollar/yt-transcript-extension)

## Contact

If you have questions about this privacy policy or ExtractMD's data practices, please contact us:
- **GitHub Issues**: [https://github.com/miguelcorderocollar/yt-transcript-extension/issues](https://github.com/miguelcorderocollar/yt-transcript-extension/issues)

---

**Summary**: ExtractMD processes content entirely in your browser. No personal data is collected, transmitted, or shared. Your settings and usage statistics are stored locally and are fully under your control.

