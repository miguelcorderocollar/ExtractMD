// Sidebar Enabled Mode Container
// Manages AI chat interface and interactions

/* global marked */

import { getApiKey, getAiChatSettings } from '../shared/aiStorage.js';
import { sendChatCompletion, formatMessagesForAPI, OpenRouterError } from '../shared/openrouter.js';

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
let statusBarEl;
let statusMessageEl;

/**
 * Initialize enabled mode (AI chat)
 * @param {Object} _stateManager - State manager instance (unused but kept for API consistency)
 */
export async function initializeEnabledMode(_stateManager) {
  console.debug('[ExtractMD Sidebar] Initializing enabled mode...');

  // Get DOM elements
  chatMessagesEl = document.getElementById('chatMessages');
  messageInputEl = document.getElementById('messageInput');
  sendBtnEl = document.getElementById('sendBtn');
  statusBarEl = document.getElementById('statusBar');
  statusMessageEl = document.getElementById('statusMessage');

  if (!chatMessagesEl || !messageInputEl || !sendBtnEl) {
    console.error('[ExtractMD Sidebar] Could not find chat elements');
    return;
  }

  // Load settings
  settings = await getAiChatSettings();
  const allSettings = await chrome.storage.sync.get({
    aiChatShowTimestamps: false,
  });

  // Apply timestamp setting
  showTimestamps = allSettings.aiChatShowTimestamps;

  // Listen for timestamp setting changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.aiChatShowTimestamps) {
      showTimestamps = changes.aiChatShowTimestamps.newValue;
      // Update all existing timestamps visibility
      document.querySelectorAll('.message-time').forEach((el) => {
        el.classList.toggle('visible', showTimestamps);
      });
    }
  });

  // Set up event listeners
  setupEventListeners();

  // Listen for messages from background script (extracted content)
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  // Initialize timestamps toggle button
  const timestampsBtn = document.getElementById('timestampsToggleBtn');
  if (timestampsBtn) {
    timestampsBtn.addEventListener('click', () => {
      const newValue = !showTimestamps;
      chrome.storage.sync.set({ aiChatShowTimestamps: newValue });
      // Visual feedback
      showStatus(newValue ? 'Timestamps enabled' : 'Timestamps disabled', 'success');
    });
  }

  console.debug('[ExtractMD Sidebar] Enabled mode initialized');
}

/**
 * Set up event listeners for chat
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

  // Clear chat button
  const clearChatBtn = document.getElementById('clearChatBtn');
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', handleClearChat);
  }

  // Export chat button
  const exportChatBtn = document.getElementById('exportChatBtn');
  if (exportChatBtn) {
    exportChatBtn.addEventListener('click', handleExportChat);
  }
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

  // Send to AI
  await sendMessageToAI(message);
}

/**
 * Send message to AI using OpenRouter API
 */
async function sendMessageToAI(userMessage) {
  console.debug('[ExtractMD Sidebar] Sending to AI:', userMessage);

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    // Get API key
    const apiKey = await getApiKey();

    // If no API key, show friendly message
    if (!apiKey || apiKey.trim() === '') {
      removeTypingIndicator(typingId);
      addSystemMessage(
        `**No API Key Configured** 🔑\n\nTo start chatting with AI, you need an OpenRouter API key:\n\n1. [Sign up at OpenRouter](https://openrouter.ai/keys) (free, no credit card required)\n2. Copy your API key\n3. Go to the Settings page and paste it in the "OpenRouter API Key" field\n\n**Free Tier Benefits:**\n- 50 requests per day\n- Access to 4 free AI models\n- No payment required`
      );
      return;
    }

    // Load settings
    const currentSettings = await getAiChatSettings();
    const allSettings = await chrome.storage.sync.get({
      aiChatTemperature: 1.0,
    });

    const model = currentSettings.aiChatModel;
    const systemPrompt = currentSettings.aiChatSystemPrompt;
    const temperature = allSettings.aiChatTemperature;

    console.debug('[ExtractMD Sidebar] API settings:', { model, temperature });

    // Format messages for API
    const messages = formatMessagesForAPI(chatHistory, systemPrompt);

    // Send to OpenRouter API
    const response = await sendChatCompletion({
      apiKey,
      model,
      messages,
      temperature,
    });

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Add assistant message
    addMessage('assistant', response);

    // Clear any error status
    hideStatus();
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error sending message:', error);
    removeTypingIndicator(typingId);

    // Handle OpenRouter-specific errors
    if (error instanceof OpenRouterError) {
      switch (error.type) {
        case 'rate_limit':
          showStatus('Rate limit exceeded (50/day)', 'error');
          addSystemMessage(
            `**Rate Limit Exceeded** ⏱️\n\nYou've reached the free tier limit of 50 requests per day.\n\n- Try again tomorrow\n- Or [upgrade your OpenRouter account](https://openrouter.ai/credits) for higher limits`
          );
          break;

        case 'network':
          showStatus('Network error. Check your connection.', 'error');
          break;

        case 'api_error':
          if (error.statusCode === 401 || error.statusCode === 403) {
            showStatus('Invalid API key. Check settings.', 'error');
          } else if (error.statusCode === 400) {
            showStatus('Invalid request. Try different model.', 'error');
          } else if (error.statusCode >= 500) {
            showStatus('Server error. Try again later.', 'error');
          } else {
            showStatus(`API error: ${error.message}`, 'error');
          }
          break;

        case 'invalid_response':
          showStatus('Invalid API response. Try again.', 'error');
          break;

        default:
          showStatus('Failed to send message. Please try again.', 'error');
      }
    } else {
      showStatus('Failed to send message. Please try again.', 'error');
    }
  }
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

  // Render markdown if available
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

  // Check if long message needs read more button
  setTimeout(() => {
    const isLong = bubbleEl.scrollHeight > 250 || content.length > 500;
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
  if (!statusBarEl || !statusMessageEl) return;

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
  if (!statusBarEl) return;
  statusBarEl.style.display = 'none';
  statusBarEl.className = 'status-bar';
  if (statusMessageEl) statusMessageEl.textContent = '';
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
