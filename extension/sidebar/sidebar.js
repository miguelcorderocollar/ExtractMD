// ExtractMD AI Chat Sidebar
// Main logic for the chat interface

import { getApiKey, getAiChatSettings } from '../shared/aiStorage.js';

// State management
let chatHistory = [];
let extractedContent = null;
let extractedMetadata = null;
let settings = null;

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

  // Check if API key is configured (not required for dummy mode)
  const hasKey = await getApiKey();
  if (!hasKey) {
    showStatus(
      'No API key configured. Using dummy responses. Add your OpenRouter API key in settings for real AI.',
      'info'
    );
  }

  // Set up event listeners
  setupEventListeners();

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  console.debug('[ExtractMD Sidebar] Initialized');
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

    // Generate dummy response
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
 * Generate a dummy AI response
 */
function generateDummyResponse(userMessage) {
  const responses = [
    'This is a dummy response. AI integration will be added in the next phase.',
    'I can see you sent: "' +
      userMessage.substring(0, 50) +
      '..."\n\nThis is a placeholder response.',
    'Great question! Once the OpenRouter API is integrated, I will provide real AI-powered responses.',
    'I analyzed your message. (This is a simulated response until AI is connected)',
    'Interesting! In the future, this will be an actual AI response analyzing your extracted content.',
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Add a message to the chat
 */
function addMessage(role, content) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;

  const avatarEl = document.createElement('div');
  avatarEl.className = 'message-avatar';
  avatarEl.textContent = role === 'user' ? 'U' : role === 'assistant' ? 'AI' : 'S';

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'message-bubble';
  bubbleEl.textContent = content;

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  contentEl.appendChild(bubbleEl);
  contentEl.appendChild(timeEl);
  messageEl.appendChild(avatarEl);
  messageEl.appendChild(contentEl);

  chatMessagesEl.appendChild(messageEl);
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

  const avatarEl = document.createElement('div');
  avatarEl.className = 'message-avatar';
  avatarEl.textContent = 'AI';

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
  messageEl.appendChild(avatarEl);
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
          <circle cx="9" cy="10" r="1" />
          <circle cx="15" cy="10" r="1" />
          <path d="M9 14c.5.5 1.5 1 3 1s2.5-.5 3-1" />
        </svg>
        <h2>Welcome to AI Chat</h2>
        <p>Extract content from a webpage to start chatting with AI about it.</p>
      </div>
    `;
    showStatus('Chat cleared', 'success');
  }
}

/**
 * Handle export chat as markdown
 */
function handleExportChat() {
  if (chatHistory.length === 0) {
    showStatus('No chat history to export', 'error');
    return;
  }

  let markdown = '# ExtractMD AI Chat Export\n\n';
  markdown += `Exported: ${new Date().toLocaleString()}\n\n`;
  markdown += '---\n\n';

  for (const msg of chatHistory) {
    if (msg.role === 'user') {
      markdown += `**You:** ${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      markdown += `**AI:** ${msg.content}\n\n`;
    } else if (msg.role === 'system') {
      markdown += `*${msg.content}*\n\n`;
    }
  }

  // Create download
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `extractmd-chat-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);

  showStatus('Chat exported successfully', 'success');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
