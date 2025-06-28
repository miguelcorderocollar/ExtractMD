# YouTube Transcript Copier Chrome Extension

A Chrome extension that automatically opens and copies YouTube video transcripts to your clipboard with a beautiful floating button interface.

## Features

- **Floating Button**: A permanent floating button appears on YouTube video pages (bottom-right corner)
- **Smart States**: The button shows different states:
  - **Idle**: Default document icon (ready to copy)
  - **Loading**: Animated spinning icon (processing)
  - **Success**: Green checkmark (copied successfully, shows for 5 seconds)
- **Multiple Activation Methods**:
  - Click the floating button
  - Extension popup button
  - Keyboard shortcut: `Ctrl+Shift+Y` (or `Cmd+Shift+Y` on Mac)
- **Settings**: Toggle to include/exclude timestamps
- **Network + DOM Fallback**: Uses network API data when possible, falls back to DOM parsing
- **Chapter Support**: Handles both regular transcripts and transcripts with chapters

## Installation

1. **Download/Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable "Developer mode"** in the top-right corner
4. **Click "Load unpacked"** and select the extension folder
5. **The extension will appear** in your Chrome toolbar

## Usage

### On YouTube Video Pages

1. **Navigate** to any YouTube video page
2. **Look for the floating button** in the bottom-right corner (purple gradient with document icon)
3. **Click the floating button** to start the transcript copy process
4. **Watch the button states**:
   - Purple → Orange (loading with spinning animation)
   - Orange → Green (success with checkmark for 5 seconds)
   - Green → Purple (back to idle state)
5. **Check your clipboard** - the transcript is now copied!

### Alternative Methods

- **Extension Popup**: Click the extension icon in the toolbar for settings and manual copy
- **Keyboard Shortcut**: Press `Ctrl+Shift+Y` (or `Cmd+Shift+Y` on Mac)

## Settings

Open the extension popup to configure:

- **Include Timestamps**: Toggle this to include or exclude timestamps in the copied text
- Settings are automatically saved and persist across sessions

## How It Works

1. **Expands Description**: Clicks the "Show more" button to expand the video description
2. **Opens Transcript**: Clicks the "Show transcript" button
3. **Extracts Data**: Uses network API interception first, falls back to DOM parsing
4. **Copies to Clipboard**: Formats the transcript and copies it to your clipboard
5. **Visual Feedback**: Shows success notification and button state changes

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: 
  - `activeTab`: Access to current tab
  - `storage`: Save user settings
  - `clipboardWrite`: Copy to clipboard
  - `scripting`: Execute scripts in tabs
- **Host Permissions**: `https://www.youtube.com/*`
- **Content Script**: Injects floating button and handles transcript extraction
- **Background Script**: Manages extension button clicks and keyboard shortcuts

## Troubleshooting

- **Button not appearing**: Make sure you're on a YouTube video page (`youtube.com/watch`)
- **No transcript available**: Some videos don't have transcripts available
- **Copy failed**: Check if the page has loaded completely and try again
- **Extension not working**: Try refreshing the page or reinstalling the extension

## Development

To modify the extension:

1. Edit the files in the extension folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Files Structure

```
yt-transcript-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script with floating button
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── create_icons.py       # Icon generation script
└── README.md            # This file
```

## License

This project is open source and available under the MIT License. 