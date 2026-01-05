// ExtractMD AI Chat Sidebar
// Main logic for the chat interface

import { getApiKey, getAiChatSettings } from '../shared/aiStorage.js';
import { DEFAULTS } from '../shared/defaults.js';

// State management
let chatHistory = [];
let extractedContent = null;
let extractedMetadata = null;
let settings = null;
let showTimestamps = false;

// DOM elements
let chatMessagesEl;
let messageInputEl;
let sendBtnEl;
let clearChatBtnEl;
let exportChatBtnEl;
let statusBarEl;
let statusMessageEl;

/**
 * Initialize the sidebar
 */
async function initialize() {
  // Get DOM elements
  chatMessagesEl = document.getElementById('chatMessages');
  messageInputEl = document.getElementById('messageInput');
  sendBtnEl = document.getElementById('sendBtn');
  clearChatBtnEl = document.getElementById('clearChatBtn');
  exportChatBtnEl = document.getElementById('exportChatBtn');
  statusBarEl = document.getElementById('statusBar');
  statusMessageEl = document.getElementById('statusMessage');

  // Load settings
  settings = await getAiChatSettings();
  const allSettings = await chrome.storage.sync.get({
    accentColor: DEFAULTS.accentColor,
    aiChatShowTimestamps: DEFAULTS.aiChatShowTimestamps,
  });

  // Apply accent color
  applyAccentColor(allSettings.accentColor);

  // Apply timestamp setting
  showTimestamps = allSettings.aiChatShowTimestamps;

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      if (changes.accentColor) {
        applyAccentColor(changes.accentColor.newValue);
      }
      if (changes.aiChatShowTimestamps) {
        showTimestamps = changes.aiChatShowTimestamps.newValue;
        // Update all existing timestamps visibility
        document.querySelectorAll('.message-time').forEach((el) => {
          el.classList.toggle('visible', showTimestamps);
        });
      }
    }
  });

  // Configure marked.js for markdown rendering
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
    });
  }

  // Set up event listeners
  setupEventListeners();

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  console.debug('[ExtractMD Sidebar] Initialized');
}

/**
 * Apply accent color to CSS variables
 */
function applyAccentColor(color) {
  if (!color) return;

  // Set the accent color CSS variable
  document.documentElement.style.setProperty('--accent', color);

  // Calculate hover color (slightly darker)
  const hoverColor = adjustBrightness(color, -15);
  document.documentElement.style.setProperty('--accent-hover', hoverColor);

  console.debug('[ExtractMD Sidebar] Accent color applied:', color);
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, percent) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  r = Math.max(0, Math.min(255, r + (r * percent) / 100));
  g = Math.max(0, Math.min(255, g + (g * percent) / 100));
  b = Math.max(0, Math.min(255, b + (b * percent) / 100));

  // Convert back to hex
  const rr = Math.round(r).toString(16).padStart(2, '0');
  const gg = Math.round(g).toString(16).padStart(2, '0');
  const bb = Math.round(b).toString(16).padStart(2, '0');

  return `#${rr}${gg}${bb}`;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Send button
  sendBtnEl.addEventListener('click', handleSendMessage);

  // Enter key to send (Shift+Enter for new line)
  messageInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Auto-resize textarea
  messageInputEl.addEventListener('input', () => {
    messageInputEl.style.height = 'auto';
    messageInputEl.style.height = messageInputEl.scrollHeight + 'px';
  });

  // Clear chat
  clearChatBtnEl.addEventListener('click', handleClearChat);

  // Export chat
  exportChatBtnEl.addEventListener('click', handleExportChat);
}

/**
 * Handle messages from background script
 */
function handleRuntimeMessage(message, sender, sendResponse) {
  if (message.action === 'setExtractedContent') {
    extractedContent = message.content;
    extractedMetadata = message.metadata;

    // Clear welcome message if it exists
    const welcomeMsg = chatMessagesEl.querySelector('.welcome-message');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    // Add system message showing content was received
    addSystemMessage('Content extracted and ready for analysis');

    // If sendDirectly is enabled, auto-send the content
    if (settings.aiChatSendDirectly) {
      setTimeout(() => {
        sendMessageToAI(extractedContent);
      }, 500);
    } else {
      // Populate input field for user to edit
      messageInputEl.value = `Analyze this content:\n\n${extractedContent.substring(0, 200)}...`;
      messageInputEl.focus();
    }

    sendResponse({ success: true });
  }
  return true;
}

/**
 * Handle send message button click
 */
async function handleSendMessage() {
  const message = messageInputEl.value.trim();
  if (!message) return;

  console.debug('[ExtractMD Sidebar] Sending message:', message);

  // Clear welcome message if still visible
  const welcomeMsg = chatMessagesEl.querySelector('.welcome-message');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }

  // Add user message to chat
  addMessage('user', message);

  // Clear input
  messageInputEl.value = '';
  messageInputEl.style.height = 'auto';

  // Send to AI (uses dummy responses if no API key)
  await sendMessageToAI(message);
}

/**
 * Send message to AI (dummy implementation for now)
 */
async function sendMessageToAI(userMessage) {
  console.debug('[ExtractMD Sidebar] Sending to AI:', userMessage);

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Generate dummy response with markdown
    const dummyResponse = generateDummyResponse(userMessage);
    console.debug('[ExtractMD Sidebar] Generated dummy response:', dummyResponse);

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Add assistant message
    addMessage('assistant', dummyResponse);

    // Clear any error status
    hideStatus();
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error sending message:', error);
    removeTypingIndicator(typingId);
    showStatus('Failed to send message. Please try again.', 'error');
  }
}

/**
 * Generate a dummy AI response with markdown examples
 */
function generateDummyResponse(userMessage) {
  const responses = [
    `This is a **dummy response** with _markdown_ support!

Here's what I can do:
- Render **bold** and *italic* text
- Create \`code snippets\` inline
- Make lists and links

\`\`\`javascript
// Even code blocks work!
function analyze(content) {
  return "AI response here";
}
\`\`\`

Once the OpenRouter API is integrated, I'll provide real AI-powered responses.`,

    `I analyzed your message: "${userMessage.substring(0, 50)}..."

**Key features:**
1. Markdown rendering ✓
2. Code highlighting ✓
3. Smart formatting ✓

> This is a blockquote example

Visit [ExtractMD](https://github.com) for more info.

*This is a placeholder response until AI is connected.*`,

    `Great question! Here's a **formatted response** with:

- **Bold text** for emphasis
- \`inline code\` for technical terms
- [Links](https://example.com) that work

\`\`\`python
# Code blocks with syntax
def process_content(text):
    return ai_analyze(text)
\`\`\`

> **Note:** Real AI responses coming soon!`,

    `**Analysis Complete**

Your content has been received. In production, this would be analyzed by **${settings.aiChatModel || 'AI'}**.

**Features demonstrated:**
- Markdown rendering
- List formatting
- Code blocks
- Blockquotes

\`\`\`json
{
  "status": "dummy",
  "model": "${settings.aiChatModel}",
  "ready": true
}
\`\`\``,

    `**Summary**

I can see you asked about: _${userMessage.substring(0, 40)}_...

Here's what you'll get with real AI:
1. **Deep analysis** of extracted content
2. **Smart summaries** and insights
3. **Code examples** when relevant
4. **Follow-up** suggestions

\`\`\`
# This is a dummy response
# Real AI integration coming next!
\`\`\`

> **Tip:** Add your OpenRouter API key in settings for real responses.`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Add a message to the chat
 */
function addMessage(role, content) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'message-bubble';

  // Render markdown if available and role is assistant or user
  if (typeof marked !== 'undefined' && (role === 'assistant' || role === 'user')) {
    try {
      bubbleEl.innerHTML = marked.parse(content);
    } catch (e) {
      console.error('[ExtractMD] Markdown parse error:', e);
      bubbleEl.textContent = content;
    }
  } else {
    bubbleEl.textContent = content;
  }

  // Check if message is long (needs read more) - need to check after adding to DOM
  let isLong = false;

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  if (showTimestamps) {
    timeEl.classList.add('visible');
  }
  timeEl.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  contentEl.appendChild(bubbleEl);
  contentEl.appendChild(timeEl);
  messageEl.appendChild(contentEl);
  chatMessagesEl.appendChild(messageEl);

  // Check if long AFTER adding to DOM (so we can measure scrollHeight)
  // Wait a tick for the DOM to render
  setTimeout(() => {
    isLong = bubbleEl.scrollHeight > 250 || content.length > 500;

    if (isLong) {
      contentEl.classList.add('collapsed');
      const readMoreBtn = document.createElement('button');
      readMoreBtn.className = 'read-more-btn';
      readMoreBtn.textContent = 'Read more';
      readMoreBtn.addEventListener('click', () => {
        const isCollapsed = contentEl.classList.contains('collapsed');
        contentEl.classList.toggle('collapsed');
        readMoreBtn.textContent = isCollapsed ? 'Show less' : 'Read more';
      });
      // Insert before timestamp
      contentEl.insertBefore(readMoreBtn, timeEl);
    }
  }, 10);

  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

  // Add to history
  chatHistory.push({ role, content, timestamp: new Date().toISOString() });
}

/**
 * Add a system message
 */
function addSystemMessage(content) {
  addMessage('system', content);
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  const id = 'typing-' + Date.now();
  const messageEl = document.createElement('div');
  messageEl.className = 'message assistant';
  messageEl.id = id;

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'message-bubble';

  const typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator';
  typingEl.innerHTML =
    '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  bubbleEl.appendChild(typingEl);
  contentEl.appendChild(bubbleEl);
  messageEl.appendChild(contentEl);

  chatMessagesEl.appendChild(messageEl);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

  return id;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) {
    el.remove();
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  statusMessageEl.textContent = message;
  statusBarEl.className = 'status-bar ' + type;
  statusBarEl.style.display = 'block';

  // Auto-hide after 5 seconds for non-error messages
  if (type !== 'error') {
    setTimeout(hideStatus, 5000);
  }
}

/**
 * Hide status message
 */
function hideStatus() {
  statusBarEl.style.display = 'none';
  statusBarEl.className = 'status-bar';
  statusMessageEl.textContent = '';
}

/**
 * Handle clear chat
 */
function handleClearChat() {
  if (chatHistory.length === 0) return;

  if (confirm('Are you sure you want to clear the chat history?')) {
    chatHistory = [];
    chatMessagesEl.innerHTML = `
      <div class="welcome-message">
        <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <circle cx="9" cy="8" r="1" fill="currentColor" />
          <circle cx="15" cy="8" r="1" fill="currentColor" />
          <path d="M9 12c.5.5 1.5 1 3 1s2.5-.5 3-1" />
        </svg>
        <h2>Welcome to AI Chat</h2>
        <p>Extract content from a webpage to start chatting with AI about it.</p>
      </div>
    `;
    showStatus('Chat cleared', 'success');
  }
}

/**
 * Handle export chat as JSON
 */
function handleExportChat() {
  if (chatHistory.length === 0) {
    showStatus('No chat history to export', 'error');
    return;
  }

  // Create export data with metadata
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      model: settings.aiChatModel || 'dummy',
      messageCount: chatHistory.length,
    },
    extractedContent: extractedContent
      ? {
          content: extractedContent.substring(0, 500) + '...', // Truncate for file size
          metadata: extractedMetadata,
        }
      : null,
    messages: chatHistory,
  };

  // Create download
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `extractmd-chat-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showStatus('Chat exported as JSON', 'success');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
