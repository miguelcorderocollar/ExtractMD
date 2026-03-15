---
description: 'Rules specific to extension content scripts'
globs:
  - 'extension/content/**'
  - 'extension/content.js'
---

# Content Script Standards

## Scope

These rules apply to `extension/content/**` modules and the content entrypoint `extension/content.js`.

## Guidelines

- **Isolation:** Remember content scripts run in an isolated scope. Avoid DOM conflicts.
- **Settings gates first:** In page initialization, check `globalEnabled`, `ignoredDomains`, and integration toggles before creating UI.
- **Current integration model:** Handle YouTube, Hacker News, X/Twitter, article extraction, and universal fallback without overlapping behaviors.
- **SPA navigation:** Reinitialize on URL changes using `MutationObserver` patterns already used by content scripts.
- **Cleanup:** On navigation or disable paths, clear `window.copyExtractMD` and remove existing floating button instances.
- **DOM safety:** Keep injected IDs/classes prefixed with `extractmd-`.
- **Z-Index:** Keep floating UI layers high enough for page overlays (`10000+`).

## Example Pattern

```javascript
const settings = await getSettings();
if (settings.globalEnabled === false) {
  return;
}

const ignoredDomains = (settings.ignoredDomains || '')
  .split('\n')
  .map((d) => d.trim())
  .filter(Boolean);
if (ignoredDomains.includes(window.location.hostname)) {
  window.copyExtractMD = null;
  document.getElementById('extractmd-floating-button')?.remove();
  return;
}
```
