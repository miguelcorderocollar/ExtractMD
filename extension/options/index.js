// ExtractMD Options Page - Main Entry Point
// This module imports and initializes all options page functionality

// Import Web Components (self-registering)
import '../shared/components/index.js';

import { initializeSettings } from './settings.js';
import { initializeNavigation } from './navigation.js';
import { initializeKpi } from './kpi.js';
import { initializeImportExport } from './importExport.js';
import { initializeDomainIgnore } from './domainIgnore.js';
import { initializeSaveToast } from './ui.js';
import { initializeStorageUsage } from './storageUsage.js';
import { initializeTheme } from '../shared/theme-manager.js';

/**
 * Initialize replay welcome button functionality
 */
function initializeReplayWelcome() {
  const replayBtn = document.getElementById('replayWelcomeBtn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      const welcomeModal = document.getElementById('welcomeModal');
      if (welcomeModal) {
        welcomeModal.show();
      }
    });
  }
}

/**
 * Initialize all options page modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async function () {
  // Initialize theme manager first
  await initializeTheme();

  // Initialize all modules
  initializeSettings();
  initializeNavigation();
  initializeKpi();
  initializeImportExport();
  initializeDomainIgnore();
  initializeStorageUsage();
  initializeSaveToast();
  initializeReplayWelcome();
});
