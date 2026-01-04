# ExtractMD - Chrome Web Store Listing

This document contains the ready-to-use content for the Chrome Web Store listing.

---

## Name

**ExtractMD**

## Short Description (132 characters max)

> Extract and copy content as Markdown from any webpage. Built-in support for YouTube, Hacker News, and articles.

_Character count: 109_

## Category

**Productivity** (recommended) or **Developer Tools**

## Language

**English**

## Support URL

https://github.com/miguelcorderocollar/yt-transcript-extension/issues

## Homepage URL

https://extractmd.miguelcorderocollar.com/

---

## Detailed Description

Copy the plain text below into the Chrome Web Store detailed description field:

```txt
ExtractMD instantly converts any webpage content into clean, formatted Markdown ready for your notes, documentation, or AI tools.

WHY INSTALL EXTRACTMD?

Stop wasting time manually copying and formatting web content. ExtractMD gives you one-click extraction that turns any webpage into perfectly formatted Markdown. Whether you're researching, taking notes, or feeding content to AI tools like ChatGPT, ExtractMD saves you hours of tedious work.

WHAT IT DOES

ExtractMD adds a floating button to web pages. Click it once, and the page content is instantly copied to your clipboard as clean Markdown. No more messy copy-paste with broken formatting.

BUILT-IN INTEGRATIONS

YouTube Videos
Extract full video transcripts as Markdown. Includes timestamps, video title, channel name, and URL. Smart formatting makes transcripts easy to read and reference.

Hacker News
Copy news lists with titles, scores, and links. Extract full comment threads with proper formatting. Perfect for archiving discussions you want to revisit.

Articles and Blog Posts
Convert any article to clean Markdown. Optionally include images with alt text. Preserves headings, lists, code blocks, and all formatting.

Universal Extractor
Works on ANY webpage. Auto-detects the main content area and strips out navigation, headers, sidebars, and other clutter. Advanced users can specify custom CSS selectors for precise extraction.

KEY FEATURES

One-Click Extraction
A floating button appears on supported pages. Click it, and the content is copied to your clipboard as Markdown. That's it.

Keyboard Shortcut
Press Ctrl+Shift+E (Cmd+Shift+E on Mac) to extract content instantly without clicking.

Smart Auto-Download
When content exceeds your configurable token limit, ExtractMD automatically downloads it as a .md file instead of copying to clipboard. Great for long articles and transcripts.

Usage Statistics
Track how many extractions you've made for each integration type. View your stats in the popup to see how much time you've saved.

Domain Ignore List
Disable ExtractMD on specific websites. The floating button won't appear on ignored domains.

Jump to Destination
Automatically open a URL like ChatGPT after copying content. Perfect for AI-assisted workflows where you want to paste content immediately.

Settings Import/Export
Backup and restore your configuration. Share settings across devices or with teammates.

CUSTOMIZATION OPTIONS

ExtractMD adapts to your workflow:

- Theme: Light, dark, or follow your system preference
- Floating button position and visibility
- Per-integration toggle for YouTube, Hacker News, Articles, and Universal
- Content selection mode: auto, full page, main element, or custom selector
- Include or exclude images, links, and code blocks
- Token threshold for auto-download
- Optional GPT token count in notifications

PRIVACY FIRST

No data collection. Everything happens locally in your browser. Your content never leaves your device.

No external servers. ExtractMD processes everything on your machine. We never see what you extract.

No analytics. We don't track your browsing or usage patterns.

Open source. Review our code on GitHub anytime.

PERFECT FOR

- Taking notes from YouTube videos for study or reference
- Archiving Hacker News discussions before they disappear
- Converting articles for Obsidian, Notion, Roam, or other Markdown apps
- Feeding content to AI tools like ChatGPT, Claude, or Gemini
- Building documentation from web sources
- Research and content curation
- Developers who need code snippets from tutorials
- Writers gathering research material
- Students creating study notes

HOW TO USE

1. Navigate to any webpage
2. Click the floating ExtractMD button in the bottom-right corner
3. Content is copied to your clipboard as Markdown
4. Paste anywhere

For more options, click the extension icon in your toolbar. For full settings, right-click the icon and select Options.

OPEN SOURCE

View the source code and contribute: github.com/miguelcorderocollar/yt-transcript-extension

Questions or feedback? Open an issue on GitHub. We actively respond to user feedback and feature requests.
```

## Character Count

The detailed description above is approximately **3,400 characters** (well within the 16,000 character limit).

---

## Notes for Submission

1. **Screenshots needed**: 3-5 screenshots showing the extension in action
2. **Privacy policy URL**: Host `docs/privacy-policy.md` and add the URL
3. **Promotional images**: Optional but recommended for visibility

---

## Privacy & Permissions (Chrome Web Store Form)

This section contains the exact text to paste into the Chrome Web Store privacy compliance form.

### Single Purpose Description

```txt
ExtractMD converts webpage content to Markdown format and copies it to the clipboard. Users click a floating button or use a keyboard shortcut to extract content from YouTube transcripts, Hacker News discussions, articles, or any webpage. The extracted Markdown is ready to paste into note-taking apps, documentation tools, or AI assistants.
```

_Character count: ~340_

---

### Permission Justifications

#### activeTab Justification

```txt
Required to access the content of the current tab when the user clicks the ExtractMD floating button or uses the keyboard shortcut. The extension reads the page DOM to extract text content (article body, YouTube transcript, Hacker News comments) and convert it to Markdown format. Access is only granted for the active tab and only when the user initiates an extraction action.
```

#### storage Justification

```txt
Used to persist user preferences locally on the device. This includes: theme preference (light/dark/system), floating button position and visibility settings, per-integration toggles (YouTube, Hacker News, Articles, Universal), content selection mode, token threshold for auto-download, and the domain ignore list. Also stores usage statistics (extraction counts per integration type) displayed in the popup. No data is transmitted externally.
```

#### clipboardWrite Justification

```txt
Required to copy the extracted Markdown content to the user's clipboard. This is the core functionality of the extension. When the user clicks the floating button or presses Ctrl+Shift+E, the extension converts the page content to Markdown and writes it to the clipboard so the user can paste it into their preferred application (notes, documentation, AI tools).
```

#### scripting Justification

```txt
Used to inject the content script that displays the floating extraction button on web pages. The scripting API allows the extension to dynamically inject the FloatingButton component and extraction logic into pages based on user settings (respecting the domain ignore list and integration visibility preferences). This enables the one-click extraction workflow.
```

#### Host Permission Justification

```txt
The extension requires <all_urls> host permission because it provides a universal content extraction feature that works on any webpage. Users expect to extract Markdown from any website they visit, not just specific domains. The content script injects a floating button on all pages (unless the domain is in the user's ignore list) to enable one-click extraction. Without broad host permissions, the extension could not fulfill its core purpose of converting any webpage content to Markdown.
```

---

### Remote Code

**Selection:** No, I am not using remote code

**Justification:**

```txt
ExtractMD does not use any remote code. All JavaScript is bundled locally within the extension package. There are no external script references, no dynamic imports from CDNs, and no use of eval() or similar runtime code execution. The extension is fully self-contained and operates entirely offline after installation.
```

---

### Data Usage

**Checkboxes:** Leave ALL checkboxes UNCHECKED

ExtractMD does not collect any of the listed data types:

- ❌ Personally identifiable information
- ❌ Health information
- ❌ Financial and payment information
- ❌ Authentication information
- ❌ Personal communications
- ❌ Location
- ❌ Web history
- ❌ User activity
- ❌ Website content

**Certifications:** CHECK ALL THREE:

- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

---

### Privacy Policy URL

```
https://extractmd.miguelcorderocollar.com/privacy
```

---

### Testing Instructions

```txt
No setup required. Install and navigate to any webpage. Look for the floating ExtractMD button in the bottom-right corner. Click it to extract content as Markdown (copied to clipboard). Test on YouTube videos, Hacker News discussions, or any article. Alternatively, press Ctrl+Shift+E (Cmd+Shift+E on Mac) to extract without clicking the button.
```

_Character count: ~250_

---
