// Background script for YouTube Transcript Copier
// This variable is no longer needed for the primary flow,
// but can be kept for the 'REQUEST_MARKDOWN' logic if you have other ways to open the panel.
let lastMarkdown = null;

// Step 1: Disable the default browser action on install.
// This ensures chrome.action.onClicked fires EVERY time the user clicks the icon.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

// Step 2: Manually open the panel AND send data on every click.
chrome.action.onClicked.addListener(async (tab) => {
  // Step 1: Wait for the panel to be fully open and ready for this tab.
  // This resolves the race condition.
  await chrome.sidePanel.open({ tabId: tab.id });

  // Step 2: Now that the panel is ready, proceed with the logic.
  if (!tab.url || !tab.url.includes('youtube.com/watch')) {
    chrome.runtime.sendMessage({
      type: 'RENDER_MARKDOWN',
      markdown: 'This extension only works on YouTube video pages.',
    });
    return;
  }

  // Request latest markdown from the content script in the current tab.
  // Using a Promise wrapper for sendMessage is more modern and avoids callback issues.
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractmd_get_markdown_preview',
    });

    if (response && response.markdown) {
      // Send the fresh markdown to the now-ready sidebar.
      chrome.runtime.sendMessage({
        type: 'RENDER_MARKDOWN',
        markdown: response.markdown,
      });
      lastMarkdown = response.markdown; // Update the cache
    }
  } catch (error) {
    console.error('Error requesting markdown:', error.message);
    chrome.runtime.sendMessage({
      type: 'RENDER_MARKDOWN',
      markdown: `*Error: Could not get markdown from this page.* \n\n*${error.message}*`,
    });
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

// This listener remains useful for other potential triggers.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_SIDE_PANEL_AND_RENDER') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    lastMarkdown = message.markdown;
    // Also render it immediately
    chrome.runtime.sendMessage({
      type: 'RENDER_MARKDOWN',
      markdown: message.markdown,
    });
  }

  if (message.type === 'REQUEST_MARKDOWN') {
    if (lastMarkdown) {
      chrome.runtime.sendMessage({
        type: 'RENDER_MARKDOWN',
        markdown: lastMarkdown,
      });
    }
  }
  if (message.action === 'openNewTab' && message.url) {
    chrome.tabs.create({ url: message.url });
    sendResponse({ success: true });
  } else if (message.action === 'closeCurrentTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async responses if needed elsewhere.
}); 