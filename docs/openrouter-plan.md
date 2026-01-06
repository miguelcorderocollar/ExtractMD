# OpenRouter API Integration for Chat Sidebar

## Overview

Replace the dummy chat system with real OpenRouter API integration, supporting 4 free models with non-streaming responses.

## User Requirements

- **Free Models**: nvidia/nemotron-3-nano-30b-a3b:free, openai/gpt-oss-120b:free, z-ai/glm-4.5-air:free, moonshotai/kimi-k2:free
- **Model Selection**: Dropdown in settings page
- **Response Type**: Non-streaming (show complete response when ready)
- **No API Key**: Show friendly in-chat message with link to OpenRouter

## Implementation Steps

### 1. Update Default Settings

**File**: `extension/shared/defaults.js`

- Change default model from `'openai/gpt-4o-mini'` to `'nvidia/nemotron-3-nano-30b-a3b:free'` (line 68)
- Add new export after line 79:

```javascript
export const FREE_AI_MODELS = [
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'NVIDIA Nemotron 3 Nano',
    description: 'Fast, lightweight model',
  },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B', description: 'Balanced performance' },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air', description: 'Bilingual model' },
  { id: 'moonshotai/kimi-k2:free', name: 'Kimi K2', description: 'Advanced reasoning' },
];
```

### 2. Update Settings UI

**File**: `extension/options.html`

- Replace model dropdown options (lines 527-537) with the 4 free models
- Add info box about free tier limits (50 requests/day) with link to OpenRouter docs
- Format: `<option value="model-id">Model Name (Description)</option>`

### 3. Create OpenRouter API Module

**File**: `extension/shared/openrouter.js` (NEW)

Create API client module with:

**Key Functions**:

- `sendChatCompletion({ apiKey, model, messages, temperature, max_tokens })` - Main API call
  - Returns: Promise<string> with assistant's response
  - Throws: OpenRouterError on failures

- `formatMessagesForAPI(chatHistory, systemPrompt, maxMessages)` - Format chat history
  - Prepends system prompt
  - Filters out system messages from chatHistory (they're UI-only)
  - Returns: Array of { role, content } for API

**Error Handling Class**:

- `OpenRouterError` with types: 'no_api_key', 'rate_limit', 'network', 'api_error', 'invalid_response'
- Include statusCode and details for debugging

**API Request Structure**:

```javascript
POST https://openrouter.ai/api/v1/chat/completions
Headers:
  Authorization: Bearer <apiKey>
  HTTP-Referer: https://extractmd.miguelcorderocollar.com
  X-Title: ExtractMD
  Content-Type: application/json
Body:
  { model, messages, temperature }
```

**Error Handling**:

- HTTP 429 → Rate limit error (50 req/day)
- HTTP 401/403 → Invalid API key
- HTTP 400 → Invalid request/model
- HTTP 500+ → Server error
- Network errors → Connection issues
- Validate response structure (check for choices[0].message.content)

### 4. Modify Chat Logic

**File**: `extension/sidebar/sidebar.js`

**Import** (after line 6):

```javascript
import { sendChatCompletion, formatMessagesForAPI, OpenRouterError } from '../shared/openrouter.js';
```

**Replace `sendMessageToAI()` function** (lines 228-255):

Flow:

1. Show typing indicator
2. Get API key via `getApiKey()`
3. **If no API key**:
   - Remove typing indicator
   - Add in-chat message with:
     - Explanation of what's needed
     - Link to OpenRouter signup
     - Link to ExtractMD settings
     - Free tier benefits (50 req/day, no credit card)
   - Return early
4. **If API key exists**:
   - Load settings (model, system prompt)
   - Format messages: `formatMessagesForAPI(chatHistory, systemPrompt)`
   - Call `sendChatCompletion({ apiKey, model, messages, temperature: 1.0 })`
   - Remove typing indicator
   - Add assistant message to chat
   - Clear status bar
5. **On error** (catch OpenRouterError):
   - Remove typing indicator
   - Show user-friendly error in status bar based on error.type:
     - `rate_limit`: "Rate limit exceeded..." + add in-chat message
     - `network`: "Network error. Check connection."
     - `api_error` (401/403): "Invalid API key. Check settings."
     - `api_error` (400): "Invalid request. Try different model."
     - Other: Generic error message

**Delete `generateDummyResponse()` function** (lines 257-342)

### 5. Error Messages

| Error Type  | User Message                                 | Location          |
| ----------- | -------------------------------------------- | ----------------- |
| No API Key  | Friendly in-chat message with setup links    | Chat area         |
| Rate Limit  | "Rate limit exceeded (50/day)" + explanation | Status bar + chat |
| Invalid Key | "Invalid API key. Check settings."           | Status bar        |
| Network     | "Network error. Check connection."           | Status bar        |
| API 400     | "Invalid request. Try different model."      | Status bar        |
| Server 500+ | "Server error. Try again later."             | Status bar        |

## Testing Checklist

- [ ] No API key: Shows friendly in-chat message with links
- [ ] Valid API key: Sends request and displays response
- [ ] Test all 4 free models (select each, send message)
- [ ] Markdown rendering works in responses
- [ ] Chat history maintains context across messages
- [ ] Rate limit error (after 50 requests)
- [ ] Invalid API key error (fake key)
- [ ] Network error (disconnect internet)
- [ ] System prompt is applied correctly
- [ ] Typing indicator shows/hides properly
- [ ] Settings persist and reload correctly
- [ ] Clear chat and export still work

## Critical Files

1. **`extension/sidebar/sidebar.js`** - Replace dummy API calls (lines 228-342)
2. **`extension/shared/openrouter.js`** - NEW: API client module
3. **`extension/shared/defaults.js`** - Add free models list
4. **`extension/options.html`** - Update model dropdown
5. **`extension/shared/aiStorage.js`** - Reference for `getApiKey()` (no changes)

## API Best Practices (from research)

✓ Store API keys in local storage (already doing this)
✓ Use Authorization header with Bearer token
✓ Include HTTP-Referer and X-Title headers
✓ Handle rate limits gracefully (50 req/day free tier)
✓ Validate response structure before using
✓ Show user-friendly error messages
✓ Never log API keys in console

## Edge Cases Handled

- Empty chat history (first message) → System prompt only
- Very long messages → API returns 400, show helpful error
- Rapid consecutive messages → Each gets own request/response
- Chat cleared mid-request → Response added to fresh chat
- Settings changed mid-request → Next request uses new settings
- Special characters/code → JSON.stringify handles escaping

## Security

- API keys stored in `chrome.storage.local` (not synced)
- API keys never logged (except truncated for debugging)
- HTTPS API endpoint
- No user content logged outside chat history

## Sources

Research findings from:

- [OpenRouter API Authentication](https://openrouter.ai/docs/api/reference/authentication)
- [OpenRouter API Streaming](https://openrouter.ai/docs/api/reference/streaming)
- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)
- [OpenRouter FAQ](https://openrouter.ai/docs/faq)
