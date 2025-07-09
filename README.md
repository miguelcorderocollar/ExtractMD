# ExtractMD Chrome Extension

A Chrome extension that extracts and copies information as Markdown from YouTube, Hacker News, and articles, with a beautiful floating button and rich settings.

## Features

| Feature | Description |
|---------|-------------|
| **Floating Button** | Appears on YouTube videos, Hacker News (news & comments), and article pages |
| **Smart States** | Button shows idle, loading, success, and error states |
| **YouTube Transcript Extraction** | Copies full transcript with chapters, customizable formatting |
| **Hacker News Support** | Copy news lists or full comment threads as Markdown |
| **Article to Markdown** | Extracts readable articles as Markdown with image support |
| **Jump to Domain** | Optionally open a custom site (e.g., ChatGPT) after copying |
| **Close Tab After Extraction** | Automatically close the current tab after successful extraction |
| **Visual Feedback** | Button and notifications for all actions |
| **Usage KPIs** | Track usage statistics for each feature |
| **Settings Import/Export** | Save and restore your configuration |
| **Download .md Option** | Instantly download extracted Markdown as a .md file instead of copying to clipboard (configurable in settings) |

## Requirements

- [Node.js](https://nodejs.org/) (which includes npm) must be installed on your system.

## Installation

1. **Download/Clone** this repository to your local machine
2. **Install dependencies** by running:
   ```sh
   npm install
   ```
3. **Build the extension** by running:
   ```sh
   npm run build
   ```
4. **Open Chrome** and navigate to `chrome://extensions/`
5. **Enable "Developer mode"** in the top-right corner
6. **Click "Load unpacked"** and select the `extension` folder
7. **The extension will appear** in your Chrome toolbar

## Usage

### On Supported Pages

- **YouTube Video**: Floating button in bottom-right. Click to copy transcript as Markdown.
- **Hacker News**: On news or item pages, floating button copies news list or comments as Markdown.
- **Articles**: On readable articles, floating button copies article as Markdown (optionally with images).
  - When articles are detected, an info notification appears (if enabled) showing the number of articles and their main headings. If "only copy longest" is enabled, the longest is marked with a star.

**If 'Download .md instead of copy to clipboard' is enabled in settings, clicking the floating button will instantly download a Markdown file with a smart filename instead of copying to clipboard.**

#### Button States
- Idle (📝) → Loading (⏳) → Success (✅) → Idle
- Error (❌) if something fails

## Usage KPIs

- The extension tracks how many times you use each integration (YouTube transcript, Article export, HN Comments, HN News) and displays these as simple counters (KPIs) in the popup.
- You can clear these counters at any time with the 'Clear' button next to the KPIs.
- This feature is enabled by default, but you can disable it in General Settings. Disabling will hide the KPI section from the popup and stop tracking usage.

## Settings

Open the extension popup to configure all settings. All settings are saved and persist across sessions.

### General Settings

| Setting | Description |
|---------|-------------|
| **Jump to Domain** | Enable/disable automatic navigation to a custom site after copying |
| **Target Domain/URL** | Set custom URL (e.g., https://chat.openai.com/) |
| **Enable Usage KPIs** | Track and display usage statistics |
| **Close Tab After Extraction** | Automatically close the current tab after successful extraction |
| **Download .md instead of copy to clipboard** | Instantly download extracted Markdown as a .md file instead of copying to clipboard |

### YouTube Transcript Settings

| Setting | Description |
|---------|-------------|
| **Include Timestamps** | Add timestamps to transcript entries |
| **Add Video Title** | Include video title at the top of transcript |
| **Add Channel Name** | Include channel name in transcript |
| **Add Video URL** | Include video URL in transcript |

### HN Comments Settings

| Setting | Description |
|---------|-------------|
| **Include Author** | Show comment author names |
| **Include Time** | Show comment timestamps |
| **Include Replies** | Include threaded replies in export |
| **Include Page URL** | Add the HN page URL to the export |

### HN News Settings

| Setting | Description |
|---------|-------------|
| **Include Title** | Show news item titles |
| **Include URL** | Include links to news articles |
| **Include Site** | Show source website names |
| **Include Points** | Show upvote counts |
| **Include Author** | Show submission authors |
| **Include Time** | Show submission timestamps |
| **Include Comments Count** | Show number of comments |

### Article Exporter Settings

| Setting | Description |
|---------|-------------|
| **Include Images** | Include images in article export |
| **Only Copy Longest Article** | When multiple articles are found, copy only the longest one |
| **Show Article Info** | Display notification with article count and headings |
| **Include Page URL** | Add the page URL to the article export |

## How It Works

1. **Detects Supported Pages**: YouTube, Hacker News, or readable articles
2. **Expands Content**: (YouTube) Expands description and opens transcript
3. **Extracts Data**: Uses network API when possible, falls back to DOM parsing
4. **Formats as Markdown**: Applies user settings
5. **Copies to Clipboard**: Shows notification and button state change
6. **(Optional) Jumps to Domain**: Opens a custom site after copy

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: 
  - `activeTab`: Access to current tab
  - `storage`: Save user settings
  - `clipboardWrite`: Copy to clipboard
  - `scripting`: Execute scripts in tabs
- **Host Permissions**: `<all_urls>` (works on YouTube, Hacker News, and articles)
- **Content Script**: Injects floating button and handles extraction
- **Background Script**: Manages extension button clicks

## Troubleshooting

- **Button not appearing**: Make sure you're on a supported page (YouTube video, HN news/item, or article)
- **No transcript/comments/article available**: Some pages may not have extractable content
- **Copy failed**: Check if the page has loaded completely and try again
- **Extension not working**: Try refreshing the page or reinstalling the extension

## Development & Bundling

This extension uses [esbuild](https://esbuild.github.io/) to bundle modular JavaScript files for Chrome extension compatibility.

### Setup

1. Install dependencies:
   ```sh
   npm install
   ```

2. Build the extension:
   ```sh
   npm run build
   ```

3. For development (auto-rebuild on changes):
   ```sh
   npm run watch
   ```

4. In your `manifest.json`, make sure the content script points to `dist/content.js`.

5. Load the `dist/` folder's files in your Chrome extension.

---

**Note:**
- All your modular code lives in `extension/`, but only the bundled output in `dist/` is loaded by Chrome.
- Do not use ES module `import`/`export` in files referenced directly by the extension, only in your source files.

## File Structure

```
.
├── extension/
│   ├── manifest.json            # Extension configuration
│   ├── background.js            # Background service worker
│   ├── content.js               # Main content script (entry point for bundling)
│   ├── popup.html               # Extension popup interface
│   ├── popup.js                 # Popup functionality and settings
│   ├── content/                 # Modular content scripts
│   │   ├── articles.js          # Article extraction logic
│   │   ├── youtube.js           # YouTube extraction logic
│   │   ├── hackernews.js        # Hacker News extraction logic
│   │   ├── utils.js             # Shared utility functions
│   │   └── kpi.js             # KPI functionality
│   ├── images/                  # Section icons for popup
│   │   ├── article.svg
│   │   ├── hackernews.svg
│   │   └── youtube.svg
│   ├── icons/                   # Extension icons
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── dist/
│       └── content.js           # Bundled content script (output by build)
│       └── content.js.map       # Source map for debugging
├── scripts/
│   └── create_icons.py          # Icon generation script
├── docs/
│   └── prompt.md                # Design and prompt documentation
└── README.md                    # This file
```

## License

This project is open source and available under the MIT License.

## About Development

This extension was developed using [Cursor](https://www.cursor.so/), an AI-powered code editor that accelerates building, refactoring, and understanding codebases. 