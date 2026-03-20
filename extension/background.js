// Background script for ExtractMD

// =============================================================================
// Icon Management - Update icon based on globalEnabled state
// =============================================================================
const DEFAULT_ICON_PATHS = {
  16: 'icons/icon16.png',
  48: 'icons/icon48.png',
  128: 'icons/icon128.png',
};

function getEnabledIconPathsFromManifest() {
  const manifest = chrome.runtime.getManifest();
  const defaultIcon = manifest.action?.default_icon || manifest.icons || {};

  return {
    16: defaultIcon['16'] || defaultIcon[16] || DEFAULT_ICON_PATHS[16],
    48: defaultIcon['48'] || defaultIcon[48] || DEFAULT_ICON_PATHS[48],
    128: defaultIcon['128'] || defaultIcon[128] || DEFAULT_ICON_PATHS[128],
  };
}

function toDisabledIconPath(iconPath) {
  return iconPath.replace(/\.png$/i, '-disabled.png');
}

async function updateIcon(enabled) {
  const enabledIconPaths = getEnabledIconPathsFromManifest();
  const disabledIconPaths = {
    16: toDisabledIconPath(enabledIconPaths[16]),
    48: toDisabledIconPath(enabledIconPaths[48]),
    128: toDisabledIconPath(enabledIconPaths[128]),
  };
  const iconPath = enabled ? enabledIconPaths : disabledIconPaths;

  await chrome.action.setIcon({ path: iconPath });

  // Update tooltip to reflect state
  const title = enabled
    ? 'ExtractMD: Copy Info as Markdown'
    : 'ExtractMD: Copy Info as Markdown (Disabled)';
  await chrome.action.setTitle({ title });

  console.debug(`[ExtractMD] Icon updated: ${enabled ? 'enabled' : 'disabled'}`);
}

async function cleanupLegacyLastExtraction() {
  try {
    await chrome.storage.local.remove('lastExtraction');
  } catch (error) {
    console.debug('[ExtractMD] Could not remove legacy lastExtraction key:', error);
  }
}

async function dispatchApiRequest(request) {
  if (!request || typeof request !== 'object') {
    throw new Error('Invalid API request payload.');
  }

  const method = String(request.method || '').toUpperCase();
  const url = String(request.url || '').trim();
  const headers = request.headers && typeof request.headers === 'object' ? request.headers : {};
  const body = request.body;

  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    throw new Error(`Unsupported request method: ${method}`);
  }

  if (!url) {
    throw new Error('Request URL is empty.');
  }

  let response;
  try {
    response = await fetch(url, { method, headers, body });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Network error';
    throw new Error(`Network request failed: ${reason}`);
  }

  const responseText = await response.text();
  let responseBody = responseText;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    // Keep plain text when response is not JSON.
  }

  if (!response.ok) {
    throw new Error(
      `API responded with ${response.status} ${response.statusText}: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`
    );
  }

  return {
    status: response.status,
    statusText: response.statusText,
    body: responseBody,
  };
}

// Listen for storage changes to update icon when globalEnabled changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.globalEnabled) {
    // If the key was removed from storage, it means it's back to the default (true)
    // If the key was set, use the new value
    const enabled =
      changes.globalEnabled.newValue !== undefined ? changes.globalEnabled.newValue : true;
    updateIcon(enabled);
  }
});

// Set correct icon on startup
chrome.runtime.onStartup.addListener(async () => {
  await cleanupLegacyLastExtraction();
  const { globalEnabled = true } = await chrome.storage.sync.get({ globalEnabled: true });
  updateIcon(globalEnabled);
});

// Handle extension installation - auto-open options page and set initial icon
chrome.runtime.onInstalled.addListener(async (details) => {
  await cleanupLegacyLastExtraction();

  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // Mark welcome as not completed so modal shows
    chrome.storage.sync.set({ welcomeCompleted: false });
    // Open options page for onboarding
    chrome.runtime.openOptionsPage();
  }

  // Set correct icon based on current state (for both install and update)
  const { globalEnabled = true } = await chrome.storage.sync.get({ globalEnabled: true });
  updateIcon(globalEnabled);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openNewTab' && message.url) {
    chrome.tabs.create({ url: message.url });
    sendResponse({ success: true });
    return false;
  } else if (message.action === 'closeCurrentTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
    sendResponse({ success: true });
    return false;
  } else if (message.action === 'dispatchApiRequest') {
    dispatchApiRequest(message.request)
      .then((result) => {
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unknown API dispatch error';
        sendResponse({ success: false, error: message });
      });
    return true;
  }
  return false;
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
