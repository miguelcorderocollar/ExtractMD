// Sidebar State Manager
// Manages dual-mode switching between AI chat enabled/disabled states

/**
 * Central state manager for sidebar dual-mode functionality
 */
export class SidebarState {
  constructor() {
    this.mode = 'disabled'; // 'disabled' | 'enabled'
    this.listeners = [];
  }

  /**
   * Initialize state from storage
   */
  async initialize() {
    const { aiChatEnabled = false } = await chrome.storage.sync.get({ aiChatEnabled: false });
    this.setMode(aiChatEnabled ? 'enabled' : 'disabled');

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.aiChatEnabled) {
        const newMode = changes.aiChatEnabled.newValue ? 'enabled' : 'disabled';
        this.setMode(newMode);
      }
    });
  }

  /**
   * Set current mode
   */
  setMode(mode) {
    if (this.mode === mode) return;

    const oldMode = this.mode;
    this.mode = mode;

    // Update container class
    const container = document.querySelector('.sidebar-container');
    if (container) {
      container.classList.remove(`mode-${oldMode}`);
      container.classList.add(`mode-${mode}`);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(mode, oldMode));

    console.debug(`[ExtractMD Sidebar] Mode switched: ${oldMode} -> ${mode}`);
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Check if in disabled mode
   */
  isDisabled() {
    return this.mode === 'disabled';
  }

  /**
   * Check if in enabled mode
   */
  isEnabled() {
    return this.mode === 'enabled';
  }

  /**
   * Register mode change listener
   */
  onModeChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Show appropriate content based on mode
   */
  updateContentVisibility() {
    const disabledContent = document.getElementById('disabledModeContent');
    const enabledContent = document.getElementById('enabledModeContent');
    const inputArea = document.getElementById('chatInputArea');
    const chatActions = document.getElementById('chatActions');

    if (this.isDisabled()) {
      if (disabledContent) disabledContent.style.display = 'flex';
      if (enabledContent) enabledContent.style.display = 'none';
      if (inputArea) inputArea.style.display = 'none';
      if (chatActions) chatActions.style.display = 'none';
    } else {
      if (disabledContent) disabledContent.style.display = 'none';
      if (enabledContent) enabledContent.style.display = 'flex';
      if (inputArea) inputArea.style.display = 'block';
      if (chatActions) chatActions.style.display = 'flex';
    }
  }
}
