// ExtractMD Popup - Main Entry Point
// This module imports and initializes all popup functionality

import { initializeSettings } from './settings.js';
import { initializeAccordion } from './accordion.js';
import { initializeKpi } from './kpi.js';
import { initializeImportExport } from './importExport.js';
import { initializeDomainIgnore } from './domainIgnore.js';

// Re-export DEFAULTS and saveSetting for backwards compatibility with tests
export { DEFAULTS, SETTING_SCHEMA } from '../shared/defaults.js';
export { saveSetting } from '../shared/storage.js';

/**
 * Initialize all popup modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initializeSettings();
    initializeAccordion();
    initializeKpi();
    initializeImportExport();
    initializeDomainIgnore();
});

