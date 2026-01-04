---
description: 'Rules specific to extension content scripts'
globs: 'extension/content/**'
---

# Content Script Standards

## Scope

These rules apply only to files in `extension/content/`.

## Guidelines

- **Isolation:** Remember content scripts run in an isolated scope. Avoid DOM conflicts.
- **SPA Navigation:** Handle YouTube/HN navigation using `MutationObserver`.
- **Initialization:** Always check the `ignoredDomains` list first.
- **Cleanup:** On navigation, clean up existing floating buttons and observers.
- **Z-Index:** Ensure floating elements have a high `z-index` (e.g., 10000).

## Example Pattern

```javascript
const settings = await getSettings();
const ignoredDomains = (settings.ignoredDomains || '').split('\n');
if (ignoredDomains.includes(window.location.hostname)) {
  return; // Stop initialization
}
```

@extension/content/utils.js
