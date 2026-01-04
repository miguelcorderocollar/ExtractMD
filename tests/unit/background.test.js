import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
  },
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
    },
    openOptionsPage: vi.fn(),
    OnInstalledReason: {
      INSTALL: 'install',
      UPDATE: 'update',
    },
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

  describe('Extension Installation Handler', () => {
    it('opens options page and sets welcomeCompleted to false on fresh install (non-e2e)', async () => {
      // Mock e2e test flag as false (normal user install)
      mockChrome.storage.sync.get.mockResolvedValue({ __e2e_test__: false });

      const installListener = vi.fn();
      mockChrome.runtime.onInstalled.addListener = installListener;

      // Simulate the installation handler from background.js
      const handleInstall = async (details) => {
        if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
          const { __e2e_test__ } = await chrome.storage.sync.get('__e2e_test__');
          if (__e2e_test__) {
            return;
          }
          chrome.storage.sync.set({ welcomeCompleted: false });
          chrome.runtime.openOptionsPage();
        }
      };

      chrome.runtime.onInstalled.addListener(handleInstall);

      // Simulate fresh install
      const installDetails = { reason: chrome.runtime.OnInstalledReason.INSTALL };
      await Promise.all(installListener.mock.calls.map(([listener]) => listener(installDetails)));

      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith('__e2e_test__');
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ welcomeCompleted: false });
      expect(mockChrome.runtime.openOptionsPage).toHaveBeenCalled();
    });

    it('does not open options page when __e2e_test__ flag is set', async () => {
      // Mock e2e test flag as true
      mockChrome.storage.sync.get.mockResolvedValue({ __e2e_test__: true });

      const installListener = vi.fn();
      mockChrome.runtime.onInstalled.addListener = installListener;

      const handleInstall = async (details) => {
        if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
          const { __e2e_test__ } = await chrome.storage.sync.get('__e2e_test__');
          if (__e2e_test__) {
            return;
          }
          chrome.storage.sync.set({ welcomeCompleted: false });
          chrome.runtime.openOptionsPage();
        }
      };

      chrome.runtime.onInstalled.addListener(handleInstall);

      const installDetails = { reason: chrome.runtime.OnInstalledReason.INSTALL };
      await Promise.all(installListener.mock.calls.map(([listener]) => listener(installDetails)));

      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith('__e2e_test__');
      expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
      expect(mockChrome.runtime.openOptionsPage).not.toHaveBeenCalled();
    });

    it('does not trigger installation logic on update', async () => {
      const installListener = vi.fn();
      mockChrome.runtime.onInstalled.addListener = installListener;

      const handleInstall = async (details) => {
        if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
          const { __e2e_test__ } = await chrome.storage.sync.get('__e2e_test__');
          if (__e2e_test__) {
            return;
          }
          chrome.storage.sync.set({ welcomeCompleted: false });
          chrome.runtime.openOptionsPage();
        }
      };

      chrome.runtime.onInstalled.addListener(handleInstall);

      // Simulate update
      const updateDetails = { reason: chrome.runtime.OnInstalledReason.UPDATE };
      await Promise.all(installListener.mock.calls.map(([listener]) => listener(updateDetails)));

      // Should not check flag or set welcome or open options page
      expect(mockChrome.storage.sync.get).not.toHaveBeenCalled();
      expect(mockChrome.storage.sync.set).not.toHaveBeenCalled();
      expect(mockChrome.runtime.openOptionsPage).not.toHaveBeenCalled();
    });
  });
});
