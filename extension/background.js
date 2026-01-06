// Background script for ExtractMD

// =============================================================================
// Icon Management - Update icon based on globalEnabled state
// =============================================================================
async function updateIcon(enabled) {
  const iconPath = enabled
    ? {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      }
    : {
        16: 'icons/icon16-disabled.png',
        48: 'icons/icon48-disabled.png',
        128: 'icons/icon128-disabled.png',
      };

  await chrome.action.setIcon({ path: iconPath });

  // Update tooltip to reflect state
  const title = enabled
    ? 'ExtractMD: Copy Info as Markdown'
    : 'ExtractMD: Copy Info as Markdown (Disabled)';
  await chrome.action.setTitle({ title });

  console.debug(`[ExtractMD] Icon updated: ${enabled ? 'enabled' : 'disabled'}`);
}

// =============================================================================
// Action Behavior Management - Configure popup vs sidebar based on aiChatEnabled
// =============================================================================
/**
 * Configure extension action behavior based on aiChatEnabled setting
 * @param {boolean} aiChatEnabled - Whether AI chat is enabled
 */
async function configureActionBehavior(aiChatEnabled) {
  if (aiChatEnabled) {
    // AI Chat enabled: Clear popup to enable onClicked listener
    await chrome.action.setPopup({ popup: '' });
    console.debug('[ExtractMD] Action configured to open sidebar');
  } else {
    // AI Chat disabled: Set popup to show popup.html
    await chrome.action.setPopup({ popup: 'popup.html' });
    console.debug('[ExtractMD] Action configured to open popup');
  }
}

// Listen for storage changes to update icon and action behavior
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    // Handle globalEnabled changes
    if (changes.globalEnabled) {
      // If the key was removed from storage, it means it's back to the default (true)
      // If the key was set, use the new value
      const enabled =
        changes.globalEnabled.newValue !== undefined ? changes.globalEnabled.newValue : true;
      updateIcon(enabled);
    }

    // Handle aiChatEnabled changes
    if (changes.aiChatEnabled) {
      const aiEnabled =
        changes.aiChatEnabled.newValue !== undefined ? changes.aiChatEnabled.newValue : false;
      configureActionBehavior(aiEnabled);
    }
  }
});

// Set correct icon and action behavior on startup
chrome.runtime.onStartup.addListener(async () => {
  const { globalEnabled = true, aiChatEnabled = false } = await chrome.storage.sync.get({
    globalEnabled: true,
    aiChatEnabled: false,
  });
  updateIcon(globalEnabled);
  configureActionBehavior(aiChatEnabled);
});

// Handle extension installation - auto-open options page and set initial state
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // Mark welcome as not completed so modal shows
    chrome.storage.sync.set({ welcomeCompleted: false });
    // Open options page for onboarding
    chrome.runtime.openOptionsPage();
  }

  // Set correct icon and action behavior based on current state (for both install and update)
  const { globalEnabled = true, aiChatEnabled = false } = await chrome.storage.sync.get({
    globalEnabled: true,
    aiChatEnabled: false,
  });
  updateIcon(globalEnabled);
  configureActionBehavior(aiChatEnabled);
});

// Handle extension icon click when AI chat is enabled (popup is cleared)
chrome.action.onClicked.addListener(async (tab) => {
  // This listener only fires when popup is not set (i.e., when AI chat is enabled)
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    console.debug('[ExtractMD] Sidebar opened via action click');
  } catch (error) {
    console.error('[ExtractMD] Error opening sidebar:', error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openNewTab' && message.url) {
    chrome.tabs.create({ url: message.url });
    sendResponse({ success: true });
  } else if (message.action === 'closeCurrentTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
    sendResponse({ success: true });
  } else if (message.action === 'openSidebarWithContent') {
    console.debug('[ExtractMD Background] Received openSidebarWithContent request', {
      tabId: sender.tab?.id,
      contentLength: message.content?.length,
    });

    // Open the sidebar for the current tab
    chrome.sidePanel
      .open({ tabId: sender.tab.id })
      .then(() => {
        console.debug('[ExtractMD Background] ✅ Sidebar opened, sending content...');
        // Wait a bit for sidebar to initialize, then send the content
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'setExtractedContent',
            content: message.content,
            metadata: message.metadata,
          });
          console.debug('[ExtractMD Background] Content sent to sidebar');
        }, 100);
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[ExtractMD Background] ❌ Error opening sidebar:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  // Check if extension is globally enabled
  const { globalEnabled = true } = await chrome.storage.sync.get({ globalEnabled: true });
  if (globalEnabled === false) {
    console.debug('[ExtractMD] Extension globally disabled, ignoring shortcut');
    return;
  }

  if (command === 'copy-content') {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      // Execute script to trigger copy
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: triggerCopy,
      });
    } catch (error) {
      console.error('Error executing copy command:', error);
    }
  } else if (command === 'hide-content') {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      // Execute script to trigger hide/ignore
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: triggerHide,
      });
    } catch (error) {
      console.error('Error executing hide command:', error);
    }
  }
});

// Function that will be injected into the page to trigger copy
function triggerCopy() {
  // Try to call the unified copy function
  if (window.copyExtractMD) {
    window.copyExtractMD();
  } else if (window.copyYouTubeTranscript) {
    // Fallback to YouTube function for backward compatibility
    window.copyYouTubeTranscript();
  }
}

// Function that will be injected into the page to trigger hide/ignore
function triggerHide() {
  // Call the hide function if available
  if (window.hideExtractMDForDomain) {
    window.hideExtractMDForDomain();
  }
}
