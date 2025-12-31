# ExtractMD Codebase Refactoring Plan

> **Note**: Phase 1 (Testing Infrastructure) has been completed. See [TESTING_SUMMARY.md](../TESTING_SUMMARY.md) for details.

## Current State Analysis

| File | Lines | Issues |
|------|-------|--------|
| `popup.js` | 639 | Monolithic: settings, UI, import/export, KPIs, validation all mixed |
| `popup.html` | 496 | Inline CSS (~230 lines), not reusable |
| `youtube.js` | 334 | Floating button code duplicated |
| `hackernews.js` | 352 | Floating button code duplicated |
| `articles.js` | 340 | Floating button code duplicated |
| `utils.js` | 185 | Good separation, but missing shared defaults |

**Key Problems:**
- ✅ ~~No tests exist~~ **COMPLETED: 37 unit tests + E2E infrastructure (Unit tests in tests/unit/)**
- `DEFAULTS` object exists in `popup.js` but is duplicated across individual content scripts
- `saveSetting()` exists in `popup.js` but is not shared
- Floating button creation (~50 lines) copy-pasted 3 times
- Copy/download/KPI logic repeated in each content module
- popup.js handles 6+ distinct responsibilities

---

## Phase 1: Testing Infrastructure ✅ COMPLETED

See [TESTING_SUMMARY.md](../TESTING_SUMMARY.md) for full details.

**Achievements:**
- ✅ Vitest + Playwright configured
- ✅ Chrome API mocks created
- ✅ 37 unit tests passing
- ✅ E2E test infrastructure ready
- ✅ Bug fixed: List rendering in articles.js

---

## Phase 2: Shared Defaults and Storage Module

Create a single source of truth for defaults that both popup and content scripts use. Currently, `popup.js` has its own `DEFAULTS` and `saveSetting`, while content scripts define defaults inline.

### New File: `extension/shared/defaults.js`

```javascript
export const DEFAULTS = {
  // YouTube
  includeTimestamps: true,
  addTitleToTranscript: true,
  addChannelToTranscript: true,
  addUrlToTranscript: true,
  // HN Comments
  hnIncludeAuthor: true,
  hnIncludeTime: true,
  hnIncludeReplies: true,
  hnIncludeUrl: true,
  hnIncludeItemText: true,
  // HN News
  hnNewsIncludeTitle: true,
  hnNewsIncludeUrl: true,
  hnNewsIncludeSite: true,
  hnNewsIncludePoints: true,
  hnNewsIncludeAuthor: true,
  hnNewsIncludeTime: true,
  hnNewsIncludeComments: true,
  // Articles
  articleExporterIncludeImages: true,
  articleExporterOnlyLongest: false,
  articleExporterShowInfo: true,
  articleExporterIncludeUrl: true,
  // General
  jumpToDomain: false,
  jumpToDomainUrl: 'https://chat.openai.com/',
  enableUsageKpi: true,
  closeTabAfterExtraction: false,
  downloadInsteadOfCopy: false,
  downloadIfTokensExceed: 0,
  enableYouTubeIntegration: true,
  enableHackerNewsIntegration: true,
  enableArticleIntegration: true,
  showTokenCountInNotification: false,
  ignoredDomains: ''
};

export const SETTING_SCHEMA = {
  includeTimestamps: 'boolean',
  addTitleToTranscript: 'boolean',
  addChannelToTranscript: 'boolean',
  addUrlToTranscript: 'boolean',
  hnIncludeAuthor: 'boolean',
  hnIncludeTime: 'boolean',
  hnIncludeReplies: 'boolean',
  hnIncludeUrl: 'boolean',
  hnIncludeItemText: 'boolean',
  hnNewsIncludeTitle: 'boolean',
  hnNewsIncludeUrl: 'boolean',
  hnNewsIncludeSite: 'boolean',
  hnNewsIncludePoints: 'boolean',
  hnNewsIncludeAuthor: 'boolean',
  hnNewsIncludeTime: 'boolean',
  hnNewsIncludeComments: 'boolean',
  articleExporterIncludeImages: 'boolean',
  articleExporterOnlyLongest: 'boolean',
  articleExporterShowInfo: 'boolean',
  articleExporterIncludeUrl: 'boolean',
  jumpToDomain: 'boolean',
  jumpToDomainUrl: 'string',
  enableUsageKpi: 'boolean',
  closeTabAfterExtraction: 'boolean',
  downloadInsteadOfCopy: 'boolean',
  downloadIfTokensExceed: 'number',
  showTokenCountInNotification: 'boolean',
  ignoredDomains: 'string',
  enableYouTubeIntegration: 'boolean',
  enableHackerNewsIntegration: 'boolean',
  enableArticleIntegration: 'boolean'
};
```

### New File: `extension/shared/storage.js`

```javascript
import { DEFAULTS } from './defaults.js';

export function getSettings(keys = null) {
  const toGet = keys ? pick(DEFAULTS, keys) : DEFAULTS;
  return new Promise(resolve => chrome.storage.sync.get(toGet, resolve));
}

export function saveSetting(key, value) {
  if (key in DEFAULTS) {
    if (JSON.stringify(value) === JSON.stringify(DEFAULTS[key])) {
      // Value matches default, remove from storage to save space
      return chrome.storage.sync.remove(key);
    } else {
      // Value differs from default, save it
      return chrome.storage.sync.set({ [key]: value });
    }
  } else {
    // Unknown key, save it anyway (future compatibility)
    return chrome.storage.sync.set({ [key]: value });
  }
}

export async function incrementKpi(type) {
  const items = await chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true });
  if (items.enableUsageKpi !== false) {
    const stats = items.usageStats || {};
    stats[type] = (stats[type] || 0) + 1;
    await chrome.storage.sync.set({ usageStats: stats });
  }
}

function pick(obj, keys) {
  if (!keys) return obj;
  const result = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}
```

**Migration Steps:**
1. Create the `extension/shared/` directory
2. Create the shared modules
3. Update imports in popup.js to use shared DEFAULTS
4. Update imports in content scripts to use shared getSettings
5. Remove duplicate DEFAULTS from popup.js
6. Run tests to verify no regressions

*Note: Content scripts use ES modules and are bundled via esbuild. Shared modules will work correctly with the existing build system.*

---

## Phase 3: Extract Floating Button Component

The floating button code is nearly identical across all three content modules (~50 lines each).

### New File: `extension/content/components/FloatingButton.js`

```javascript
export function createFloatingButton({ 
  onClick, 
  variant = 'dark',
  emoji = '📝'
}) {
  const button = document.createElement('div');
  button.id = 'yt-transcript-floating-button';
  button.innerHTML = `<div class="button-emoji">${emoji}</div>`;
  
  // Variant-specific styles
  const variantStyles = variant === 'dark' 
    ? 'rgba(255, 255, 255, 0.15); color: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.2);'
    : 'rgba(255, 255, 255, 0.95); color: #222; border: 1px solid #ccc;';
  
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${variantStyles}
    backdrop-filter: blur(10px);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    cursor: pointer;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    user-select: none;
    opacity: 0.7;
  `;
  
  // Hover effects
  button.addEventListener('mouseenter', () => {
    if (!button.dataset.processing) {
      button.style.transform = 'translateY(-2px) scale(1.1)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      button.style.opacity = '1';
    }
  });
  
  button.addEventListener('mouseleave', () => {
    if (!button.dataset.processing) {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      button.style.opacity = '0.7';
    }
  });
  
  button.addEventListener('click', onClick);
  
  return {
    element: button,
    setLoading: () => {
      button.dataset.processing = 'true';
      button.innerHTML = `<div class="button-emoji">⏳</div>`;
      button.style.cursor = 'not-allowed';
    },
    setSuccess: () => {
      button.innerHTML = `<div class="button-emoji">✅</div>`;
      button.style.fontSize = '24px';
    },
    setError: () => {
      button.innerHTML = `<div class="button-emoji">❌</div>`;
      button.style.fontSize = '24px';
    },
    setNormal: () => {
      delete button.dataset.processing;
      button.innerHTML = `<div class="button-emoji">${emoji}</div>`;
      button.style.cursor = 'pointer';
      button.style.fontSize = '24px';
    }
  };
}
```

**Migration Steps:**
1. Create the FloatingButton component
2. Write tests for the component
3. Update youtube.js to use the component
4. Update hackernews.js to use the component
5. Update articles.js to use the component
6. Remove duplicate button code
7. Run tests to verify functionality

This reduces ~150 lines of duplicated code to ~60 lines in one place.

---

## Phase 4: Extract Copy/Download Handler

Each content module repeats the same copy/download/threshold/KPI logic (~80 lines each).

### New File: `extension/content/handlers/copyHandler.js`

```javascript
import { getSettings } from '../../shared/storage.js';
import { incrementKpi } from '../../shared/storage.js';
import { copyToClipboard, downloadMarkdownFile, showSuccessNotificationWithTokens, closeCurrentTab } from '../utils.js';
import { encode } from 'gpt-tokenizer';

export async function handleCopyOrDownload(markdown, { title, kpiType }) {
  const settings = await getSettings([
    'downloadInsteadOfCopy', 
    'downloadIfTokensExceed',
    'jumpToDomain',
    'jumpToDomainUrl',
    'closeTabAfterExtraction'
  ]);
  
  let action = 'copy';
  
  // Check if download is forced
  if (settings.downloadInsteadOfCopy) {
    action = 'download';
  } else {
    // Check token threshold
    const threshold = parseInt(settings.downloadIfTokensExceed, 10);
    if (!isNaN(threshold) && threshold > 0) {
      const tokens = encode(markdown).length;
      if (tokens >= threshold * 1000) {
        action = 'download-threshold';
      }
    }
  }
  
  // Perform action
  if (action === 'download') {
    downloadMarkdownFile(markdown, title, 'ExtractMD');
    showSuccessNotificationWithTokens('Downloaded as .md!', markdown);
  } else if (action === 'download-threshold') {
    downloadMarkdownFile(markdown, title, 'ExtractMD');
    showSuccessNotificationWithTokens('Downloaded as .md (token threshold)!', markdown);
  } else {
    await copyToClipboard(markdown, true);
    showSuccessNotificationWithTokens('Copied to clipboard!', markdown);
  }
  
  // Increment KPI
  await incrementKpi(kpiType);
  
  // Post-copy actions
  if (settings.jumpToDomain && settings.jumpToDomainUrl) {
    chrome.runtime.sendMessage({ action: 'openNewTab', url: settings.jumpToDomainUrl });
  }
  
  if (settings.closeTabAfterExtraction) {
    setTimeout(() => closeCurrentTab(), 500);
  }
}
```

**Migration Steps:**
1. Create the copyHandler module
2. Write tests for the handler
3. Update youtube.js to use the handler
4. Update hackernews.js to use the handler
5. Update articles.js to use the handler
6. Remove duplicate copy/download code
7. Run tests to verify functionality

This reduces ~240 lines of duplicated code to ~60 lines in one place.

---

## Phase 5: Refactor popup.js into Modules

Split the 639-line monolith into focused modules:

### New Directory Structure

```
extension/
  popup/
    index.js              # Entry point, imports and initializes all modules
    settings.js           # Load/save individual settings (~100 lines)
    accordion.js          # Collapsible UI logic (~30 lines)
    kpi.js                # KPI display and time-saved calculation (~80 lines)
    importExport.js       # Import/export functionality (~120 lines)
    domainIgnore.js       # Ignored domains textarea + button (~80 lines)
    integrationVisibility.js  # Show/hide integration sections (~50 lines)
    ui.js                 # General UI helpers (~40 lines)
  popup.html              # Slimmed down, links to popup.css and dist/popup.js
  popup.css               # Extracted styles (~230 lines)
  dist/
    popup.js              # Bundled popup code
    popup.js.map          # Source map
```

### Module Breakdown

**index.js** - Main entry point
```javascript
import { initializeSettings } from './settings.js';
import { initializeAccordion } from './accordion.js';
import { initializeKpi } from './kpi.js';
import { initializeImportExport } from './importExport.js';
import { initializeDomainIgnore } from './domainIgnore.js';
import { initializeIntegrationVisibility } from './integrationVisibility.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeSettings();
  initializeAccordion();
  initializeKpi();
  initializeImportExport();
  initializeDomainIgnore();
  initializeIntegrationVisibility();
});
```

**settings.js** - Settings management
- Load all settings from storage
- Save settings on change
- Uses shared DEFAULTS

**accordion.js** - Collapsible sections
- Toggle accordion open/close
- Preserve state

**kpi.js** - Usage statistics
- Render KPI counters
- Format time saved
- Clear counters

**importExport.js** - Settings backup/restore
- Export settings as JSON
- Import and validate settings
- Manifest info fetching

**domainIgnore.js** - Domain management
- Validate domain input
- Add/remove current domain
- Update button state

**integrationVisibility.js** - Show/hide integrations
- Toggle YouTube settings
- Toggle HN settings
- Toggle Article settings

### Build Configuration Update

**Prerequisite**: Ensure `extension/dist/` exists. Update `build.js` to bundle popup modules:

```javascript
const esbuild = require('esbuild');

// Content script bundle
esbuild.build({
  entryPoints: ['extension/content.js'],
  bundle: true,
  outfile: 'extension/dist/content.js',
  format: 'iife',
  sourcemap: true,
  target: ['chrome58'],
  logLevel: 'info',
}).catch(() => process.exit(1));

// Popup bundle
esbuild.build({
  entryPoints: ['extension/popup/index.js'],
  bundle: true,
  outfile: 'extension/dist/popup.js',
  format: 'iife',
  sourcemap: true,
  target: ['chrome58'],
  logLevel: 'info',
}).catch(() => process.exit(1));
```

**Migration Steps:**
1. Create popup module structure
2. Extract functions into appropriate modules
3. Write tests for each module
4. Update build.js to bundle popup
5. Update popup.html to load bundled popup.js
6. Remove old popup.js
7. Run all tests to verify functionality

---

## Phase 6: Extract CSS

Create `extension/popup.css` with all styles from popup.html:

**Benefits:**
- Reduces popup.html from ~496 lines to ~270 lines
- CSS becomes reusable for future options page (ExtractMD 2.0)
- Enables CSS variables for theming
- Better caching and performance

**Migration Steps:**
1. Create popup.css with all styles
2. Link CSS in popup.html: `<link rel="stylesheet" href="popup.css">`
3. Remove inline styles from popup.html
4. Test popup UI to verify styles work
5. Consider adding CSS variables for theming

---

## Phase 7: Prepare for ExtractMD 2.0

The refactored architecture directly supports the 2.0 popup/options split:

### Architecture for 2.0

```
Shared Modules (reusable):
├── shared/defaults.js      → Used by popup, options, content
├── shared/storage.js       → Used everywhere
├── popup/kpi.js            → Reusable in both popup and options
├── popup/importExport.js   → Moves to options page
└── popup.css               → Shared base styles

New for 2.0:
├── popup/quickActions.js   → New popup-only "Extract Now" buttons
├── options/                → New options page with full settings
│   ├── index.js
│   ├── settings.js         → Full settings UI
│   ├── kpi.js              → Detailed KPI view
│   └── importExport.js     → Import/export from popup
└── options.html            → Full-page options interface
```

---

## Execution Order & Status

| Phase | Status | Priority | Risk | Effort |
|-------|--------|----------|------|--------|
| 1. Testing Infrastructure | ✅ DONE | High | Low | Medium |
| 2. Shared Defaults/Storage | ✅ DONE | High | Low | Low |
| 3. Floating Button Component | ✅ DONE | Medium | Low | Low |
| 4. Copy Handler | ✅ DONE | Medium | Low | Low |
| 5. popup.js Refactor | 📋 PLANNED | High | Medium | High |
| 6. Extract CSS | ✅ DONE | Low | Low | Low |
| 7. ExtractMD 2.0 Prep | 📋 PLANNED | Low | Low | Low |

**Progress Summary:**
- ✅ Phase 1: Testing infrastructure - 72 unit tests passing
- ✅ Phase 2: Shared modules created (`shared/defaults.js`, `shared/storage.js`)
- ✅ Phase 3: FloatingButton component created and integrated
- ✅ Phase 4: Copy handler created with tests
- ✅ Phase 6: CSS extracted to `popup.css` with CSS variables
- 📋 Phase 5: popup.js refactor pending (595 lines → modules)
- 📋 Phase 7: 2.0 preparation pending

---

## Success Metrics

- ✅ Test coverage > 80% for refactored modules
- ✅ No regressions in functionality
- ✅ Reduced code duplication by ~400 lines
- ✅ popup.js reduced from 639 lines to ~100 lines (index)
- ✅ All tests passing after each phase
- ✅ Performance maintained or improved
- ✅ Code maintainability significantly improved

---

## Notes

- Each phase should be a separate branch and PR
- Run full test suite after each phase
- Update TESTING_SUMMARY.md with new tests
- Consider adding integration tests for complex workflows
- Document any breaking changes or migration notes

