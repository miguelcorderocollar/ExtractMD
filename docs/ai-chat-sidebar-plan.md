# ExtractMD AI Chat Sidebar - Implementation Plan

## Overview

Add Chrome sidebar with OpenRouter API integration for AI-powered content analysis. Preserves all existing copy/download functionality with user-configurable behavior.

## Key Design Decisions

1. **API Key Storage**: `chrome.storage.local` (not synced, more secure than sync storage)
2. **Chat History**: Session-only (in-memory), with export to markdown functionality
3. **Backward Compatibility**: Default behavior remains "copy to clipboard" - sidebar is opt-in
4. **Sidebar API**: Chrome's official `sidePanel` API (available since Chrome 114)
5. **Settings**: Fully configurable via options page with custom web components

## User Flow

```
FloatingButton Click
    ↓
Check: aiChatEnabled + outputMode
    ↓
┌───────┴────────┐
│  copy (default) │ → Copy to clipboard (existing behavior)
│  sidebar        │ → Open sidebar only
│  both           │ → Copy + open sidebar
└────────────────┘
    ↓
If sidebar enabled + autoOpen:
    → Open sidebar with content
    → If sendDirectly: auto-send to API
    → Else: populate input for user to edit
```

## Technical Architecture

### Chrome APIs Used

- **sidePanel**: Official Chrome sidebar API (Manifest V3)
- **storage.local**: API key storage (not synced)
- **storage.sync**: Settings storage (existing pattern)
- **runtime.sendMessage**: Communication between components

### Message Flow

```
Content Script (extraction)
    ↓ sendMessage('openSidebarWithContent')
Background Service Worker
    ↓ chrome.sidePanel.open() + sendMessage
Sidebar (sidebar.html/js)
    ↓ fetch to OpenRouter API
    ↓ Display response in chat UI
```

## Files to Create

### 1. `/extension/sidebar.html`

- Simple chat UI with header, message area, input field
- Actions: copy markdown, export chat, clear chat
- Status bar for errors/success messages

### 2. `/extension/sidebar.css`

- Chat message styling (user vs assistant)
- Theme-aware (light/dark mode)
- Loading indicators, typing animation
- Follows existing ExtractMD design patterns

### 3. `/extension/sidebar/sidebar.js`

- Main sidebar logic
- OpenRouter API integration:
  - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
  - Bearer token authentication
  - Request format: OpenAI-compatible chat completions
- Chat history management (in-memory array)
- Message rendering and state management
- Export functionality (download as markdown)

### 4. `/extension/shared/aiStorage.js`

- `getApiKey()` - retrieve from chrome.storage.local
- `saveApiKey()` - save to chrome.storage.local
- `hasApiKey()` - check if configured
- `getAiChatSettings()` - get settings from sync storage

## Files to Modify

### 1. `/extension/manifest.json`

**Add:**

```json
{
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "sidebar.html"
  },
  "host_permissions": ["https://openrouter.ai/*"]
}
```

### 2. `/extension/shared/defaults.js`

**Add 6 new settings:**

- `aiChatEnabled: false` - Master toggle
- `aiChatModel: 'openai/gpt-5-nano'` - Default model
- `aiChatSystemPrompt: '...'` - AI instructions
- `aiChatAutoOpen: false` - Auto-open sidebar after extraction
- `aiChatSendDirectly: true` - Send immediately vs edit first
- `aiChatOutputMode: 'copy'` - 'copy' | 'sidebar' | 'both'

Note: `aiChatOpenRouterApiKey` stored separately in chrome.storage.local

### 3. `/extension/options.html`

**Add new section "AI Chat":**

- Master enable toggle
- API key input (password field with show/hide button)
- Model selection dropdown (GPT-4o Mini, Claude 3.5, Gemini, etc.)
- System prompt textarea
- Output mode select (copy/sidebar/both)
- Auto-open toggle
- Send directly toggle

### 4. `/extension/options/settings.js`

**Add:**

- SETTING_ELEMENTS entries for 6 new settings
- `initializeApiKeyToggle()` function:
  - Show/hide password toggle
  - Load API key from chrome.storage.local
  - Debounced save on input (500ms)
- Event listeners for new settings

### 5. `/extension/background.js`

**Add message handler:**

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidebarWithContent') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    // Wait for sidebar to initialize
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'setExtractedContent',
        content: message.content,
        metadata: message.metadata,
      });
    }, 100);
    sendResponse({ success: true });
    return true;
  }
});
```

### 6. `/extension/content/handlers/copyHandler.js`

**Modify `handleCopyOrDownload()`:**

- Load AI chat settings (enabled, outputMode, autoOpen)
- Check `shouldOpenSidebar` and `shouldCopy` flags
- If sidebar enabled + autoOpen: send message to background
- If outputMode is 'sidebar' only: skip copy/download logic
- Maintain backward compatibility (default: copy only)

### 7. Build Configuration

**Check and update:**

- Look for webpack.config.js, rollup.config.js, or package.json scripts
- Add sidebar entry point: `sidebar: './extension/sidebar/sidebar.js'`
- Ensure sidebar.js is bundled to `dist/sidebar.js`

## Settings Schema

| Setting                | Type    | Default                          | Description                            |
| ---------------------- | ------- | -------------------------------- | -------------------------------------- |
| aiChatEnabled          | boolean | false                            | Master toggle for AI chat feature      |
| aiChatModel            | string  | 'openai/gpt-4o-mini'             | OpenRouter model ID                    |
| aiChatSystemPrompt     | string  | 'You are a helpful assistant...' | AI instructions                        |
| aiChatAutoOpen         | boolean | false                            | Auto-open sidebar after extraction     |
| aiChatSendDirectly     | boolean | true                             | Send content immediately vs edit first |
| aiChatOutputMode       | string  | 'copy'                           | 'copy' \| 'sidebar' \| 'both'          |
| aiChatOpenRouterApiKey | string  | ''                               | API key (stored in local, not sync)    |

## Security Considerations

1. **API Key Protection**:
   - Stored in `chrome.storage.local` (not synced across devices)
   - Never logged to console
   - Masked in UI (password field)
   - Automatically cleared on extension uninstall

2. **Content Validation**:
   - Limit content size before API submission
   - Sanitize HTML in chat messages to prevent XSS
   - Validate API responses

3. **Network Security**:
   - HTTPS only (enforced in manifest host_permissions)
   - Proper error handling for failed requests
   - No sensitive data in error messages

4. **Future Enhancement**:
   - Consider Web Crypto API encryption for API key
   - Add rate limiting for API requests

## Error Handling

1. **No API Key**: Show clear message in sidebar, disable send button, link to settings
2. **API Errors**: Display user-friendly error messages in chat
3. **Network Failures**: Show retry option, preserve user's message
4. **Invalid API Key**: Clear error with link to OpenRouter dashboard
5. **Rate Limiting**: Exponential backoff, show estimated retry time
6. **Large Content**: Warn if content exceeds model context window

## OpenRouter Integration

### API Details

- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Authentication**: `Authorization: Bearer YOUR_API_KEY`
- **Headers**:
  - `HTTP-Referer`: Extension URL (for OpenRouter analytics)
  - `X-Title`: 'ExtractMD'

### Request Format

```javascript
{
  model: 'openai/gpt-4o-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: 'Context: ' + extractedContent },
    ...chatHistory,
    { role: 'user', content: userMessage }
  ],
  stream: false
}
```

### Supported Models (Initial Set)

- `openai/gpt-4o-mini` (default - fast, affordable)
- `openai/gpt-4o` (most capable)
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-3-haiku`
- `google/gemini-pro-1.5`

## Implementation Sequence

1. **Manifest & Storage** (30-60 min)
   - Update manifest.json with sidePanel permission
   - Create shared/aiStorage.js
   - Add defaults to shared/defaults.js

2. **Settings UI** (1-2 hours)
   - Add AI Chat section to options.html
   - Add setting elements to options/settings.js
   - Implement API key toggle functionality

3. **Sidebar UI** (2-3 hours)
   - Create sidebar.html with chat interface
   - Create sidebar.css with theme-aware styling
   - Implement basic layout and components

4. **Sidebar Logic** (2-3 hours)
   - Implement sidebar/sidebar.js
   - OpenRouter API integration
   - Message rendering and state management
   - Export and copy functionality

5. **Integration** (1-2 hours)
   - Update background.js message handler
   - Modify copyHandler.js to trigger sidebar
   - Test message passing flow

6. **Build Configuration** (30 min)
   - Update build config to include sidebar.js
   - Test build process
   - Verify dist/ output

7. **Error Handling & Polish** (1-2 hours)
   - Implement all error scenarios
   - Add loading states and indicators
   - Improve UX feedback

8. **Testing** (2-3 hours)
   - Test all output modes (copy, sidebar, both)
   - Test auto-open enabled/disabled
   - Test send directly enabled/disabled
   - Verify backward compatibility
   - Test error scenarios

**Total Estimated Time**: 10-16 hours

## Testing Checklist

### Functional Tests

- [ ] API key can be saved and loaded from options page
- [ ] Show/hide toggle works for API key field
- [ ] All 6 settings save/load correctly
- [ ] Sidebar opens when triggered
- [ ] Extracted content appears in sidebar
- [ ] Send directly mode: auto-sends to API
- [ ] Edit mode: populates input for user to edit
- [ ] Chat messages render correctly (user, assistant, system)
- [ ] Chat history maintained within session
- [ ] Export chat downloads markdown file
- [ ] Copy markdown button copies to clipboard
- [ ] Clear chat clears messages

### Integration Tests

- [ ] Output mode "copy": existing behavior (copy to clipboard)
- [ ] Output mode "sidebar": only opens sidebar
- [ ] Output mode "both": copies AND opens sidebar
- [ ] Auto-open enabled: sidebar opens after extraction
- [ ] Auto-open disabled: sidebar must be opened manually
- [ ] Works with YouTube extraction
- [ ] Works with Hacker News extraction
- [ ] Works with Article extraction
- [ ] Works with Universal extraction

### Error Scenarios

- [ ] No API key: shows error, disables send button
- [ ] Invalid API key: shows clear error message
- [ ] Network failure: shows retry option
- [ ] API rate limit: shows appropriate message
- [ ] Large content: warns if too large

### Backward Compatibility

- [ ] Default settings: aiChatEnabled=false, outputMode='copy'
- [ ] Users without API key: existing copy behavior unchanged
- [ ] No breaking changes to existing features
- [ ] All existing keyboard shortcuts work

## Critical Files Reference

**New Files:**

- `/extension/sidebar.html` - Sidebar UI template
- `/extension/sidebar.css` - Sidebar styling
- `/extension/sidebar/sidebar.js` - Sidebar logic & OpenRouter integration
- `/extension/shared/aiStorage.js` - AI settings storage utilities

**Modified Files:**

- `/extension/manifest.json` - Add sidePanel permission & config
- `/extension/shared/defaults.js` - Add 6 new AI chat settings
- `/extension/options.html` - Add AI Chat settings section
- `/extension/options/settings.js` - Add AI settings handlers
- `/extension/background.js` - Add sidebar message handler
- `/extension/content/handlers/copyHandler.js` - Integrate sidebar trigger
- [Build config file] - Add sidebar.js to build

## Notes

- Keep existing copy/download functionality fully intact
- Default behavior: copy to clipboard (no breaking changes)
- Sidebar is opt-in feature requiring API key configuration
- Chat history is session-only to save storage space
- Simple, lightweight UI - avoid over-engineering
- Follow existing ExtractMD patterns (web components, theme, storage)
- Must work with Manifest V3 permissions model
