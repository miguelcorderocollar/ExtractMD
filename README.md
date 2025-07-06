# ExtractMD Chrome Extension

A Chrome extension that extracts and copies information as Markdown from YouTube, Hacker News, and articles, with a beautiful floating button and rich settings.

## Features

- **Floating Button**: Appears on YouTube videos, Hacker News (news & comments), and article pages
- **Smart States**: Button shows idle, loading, success, and error states
- **Multiple Activation Methods**:
  - Click the floating button
  - Extension popup button
  - Keyboard shortcut: `Ctrl+Shift+Y` (or `Cmd+Shift+Y` on Mac)
- **YouTube Transcript Extraction**:
  - Copies full transcript, supports chapters
  - Settings: include/exclude timestamps, add video title, channel, and URL
- **Hacker News Support**:
  - Copy news lists or full comment threads as Markdown
  - Settings: include author, time, replies, points, etc.
- **Article to Markdown**:
  - Extracts readable articles as Markdown
  - Option to include images
  - Option to only copy the longest article (if multiple are found)
  - Info notification shows number of articles and their main headings (optionally, with the longest highlighted)
- **Jump to Domain**: Optionally open a custom site (e.g., ChatGPT) after copying
- **Network + DOM Fallback**: Uses network API data when possible, falls back to DOM parsing
- **Visual Feedback**: Button and notifications for all actions

## Installation

1. **Download/Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable "Developer mode"** in the top-right corner
4. **Click "Load unpacked"** and select the `extension` folder
5. **The extension will appear** in your Chrome toolbar

## Usage

### On Supported Pages

- **YouTube Video**: Floating button in bottom-right. Click to copy transcript as Markdown.
- **Hacker News**: On news or item pages, floating button copies news list or comments as Markdown.
- **Articles**: On readable articles, floating button copies article as Markdown (optionally with images).
  - When articles are detected, an info notification appears (if enabled) showing the number of articles and their main headings. If "only copy longest" is enabled, the longest is marked with a star.

#### Button States
- Idle (📝) → Loading (⏳) → Success (✅) → Idle
- Error (❌) if something fails

#### Other Methods
- **Extension Popup**: Manual copy and settings
- **Keyboard Shortcut**: `Ctrl+Shift+Y` (or `Cmd+Shift+Y` on Mac)

## Settings

Open the extension popup to configure:

- **YouTube Transcript**:
  - Include timestamps
  - Add video title
  - Add channel name
  - Add video URL
- **Hacker News Comments**:
  - Include author
  - Include time
  - Include replies
- **Hacker News News**:
  - Include title, URL, site, points, author, time, comments
- **Article Exporter**:
  - Include images
  - Only copy longest article (if multiple are found)
  - Show info notification with article count and headings (optionally highlight the longest)
- **Jump to Domain**:
  - Enable/disable
  - Set custom URL (e.g., ChatGPT)
- All settings are saved and persist across sessions

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
- **Background Script**: Manages extension button clicks and keyboard shortcuts

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