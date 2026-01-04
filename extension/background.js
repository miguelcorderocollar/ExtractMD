// Background script for YouTube Transcript Copier
chrome.action.onClicked.addListener(async (tab) => {
  // Check if we're on a YouTube video page
  if (!tab.url || !tab.url.includes('youtube.com/watch')) {
    // Show notification that we need to be on a YouTube video
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'YouTube Transcript Copier',
      message: 'Please navigate to a YouTube video page to use this extension.',
    });
    return;
  }

  try {
    // Execute the content script to copy transcript
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: copyTranscript,
    });
  } catch (error) {
    console.error('Error executing content script:', error);
  }
});

// Function that will be injected into the page
function copyTranscript() {
  // This function will be executed in the context of the YouTube page
  // The actual implementation is in content.js
  if (window.copyYouTubeTranscript) {
    window.copyYouTubeTranscript();
  }
}

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
