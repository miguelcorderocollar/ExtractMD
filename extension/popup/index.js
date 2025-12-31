// ExtractMD Popup - Main Entry Point (Quick Actions Mode)
// This module imports and initializes all popup functionality

import { initializeQuickActions } from './quickActions.js';
import { initializeDomainToggle } from './domainToggle.js';
import { initializeLastExtraction } from './lastExtraction.js';
import { initializeKpiSummary } from './kpiSummary.js';

// Re-export DEFAULTS and saveSetting for backwards compatibility with tests
export { DEFAULTS, SETTING_SCHEMA } from '../shared/defaults.js';
export { saveSetting } from '../shared/storage.js';

/**
 * Initialize all popup modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initializeQuickActions();
    initializeDomainToggle();
    initializeLastExtraction();
    initializeKpiSummary();
});
