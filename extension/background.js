// Background script for YouTube Transcript Copier

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openNewTab' && message.url) {
    chrome.tabs.create({ url: message.url });
    sendResponse({ success: true });
  } else if (message.action === 'closeCurrentTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
    sendResponse({ success: true });
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
