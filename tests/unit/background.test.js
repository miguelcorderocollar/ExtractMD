import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
  },
};

// Mock chrome global
vi.stubGlobal('chrome', mockChrome);

// Test the logic directly rather than importing the background script
// since it's not a module and executes immediately

// Only test the command handling logic since action click is no longer used

async function handleCommand(command) {
  // Check if extension is globally enabled
  const { globalEnabled = true } = await chrome.storage.sync.get({ globalEnabled: true });
  if (globalEnabled === false) {
    console.debug('[ExtractMD] Extension globally disabled, ignoring shortcut');
    return;
  }

  if (command === 'copy-content' || command === 'hide-content') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {}, // Mock function
    });
  }
}

describe('background.js - Global Enable/Disable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleCommand', () => {
    it('ignores commands when globalEnabled is false', async () => {
      // Mock globalEnabled = false
      mockChrome.storage.sync.get.mockResolvedValue({ globalEnabled: false });

      await handleCommand('copy-content');

      // Verify no processing occurred
      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
      expect(mockChrome.tabs.query).not.toHaveBeenCalled();
    });

    it('proceeds with copy-content command when globalEnabled is true', async () => {
      // Mock globalEnabled = true
      mockChrome.storage.sync.get.mockResolvedValue({ globalEnabled: true });

      const mockTab = { id: 123 };
      mockChrome.tabs.query.mockResolvedValue([mockTab]);

      await handleCommand('copy-content');

      // Verify processing occurred
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
    });

    it('proceeds with hide-content command when globalEnabled is true', async () => {
      // Mock globalEnabled = true
      mockChrome.storage.sync.get.mockResolvedValue({ globalEnabled: true });

      const mockTab = { id: 123 };
      mockChrome.tabs.query.mockResolvedValue([mockTab]);

      await handleCommand('hide-content');

      // Verify processing occurred
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
    });
  });
});
