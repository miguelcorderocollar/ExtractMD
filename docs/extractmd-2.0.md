# ExtractMD 2.0: UI/UX Redesign Plan

## Goal
Split the extension into two distinct interfaces:
- **Popup**: Quick actions only (extract, domain toggle, status)
- **Options Page**: All settings and configuration

---

## Popup Features
- Extract Now button ✅ (implemented)
- Disable/Enable on Current Domain toggle ✅ (implemented)
- Open Target Domain button ✅ (implemented, shows when configured)
- Last Extraction Status display ✅ (implemented)
- KPI Summary ✅ (implemented)
- Settings button → opens options page ✅ (implemented)

## Options Page Features
- All settings (YouTube, HN, Articles, General) ✅ (implemented)
- Import/Export ✅ (implemented)
- KPI Details with clear button ✅ (implemented)
- Help/About section

---

## Implementation Plan

### Phase 1: Options Page (Foundation) ✅ COMPLETED
Create the options page and migrate settings from popup.

**Tasks:**
1. Create `options.html` with all settings UI ✅
2. Create `options/` module folder with settings logic ✅
3. Register options page in `manifest.json` ✅
4. Add "Open Settings" button to popup ✅
5. Update tests ✅

**Result:** Options page works with all settings.

---

### Phase 2: Popup Redesign ✅ COMPLETED
Strip settings from popup, add action buttons.

**Tasks:**
1. Remove settings accordions from popup ✅
2. Add "Extract Now" button (triggers `copyExtractMD()`) ✅
3. Add "Open Target Domain" button (if enabled) ✅
4. Keep domain ignore toggle ✅
5. Keep KPI summary ✅
6. Add last extraction status display ✅
7. Update popup CSS for new layout ✅
8. Update tests ✅

**Result:** Clean popup with quick actions, settings in options page.

---

### Phase 3: New Features (Future)
Add features that don't exist yet.

- **Download from Popup**: One-click download button in popup
- **Preview Markdown**: Preview before copy/download
- **Extract & Paste**: Auto-paste into input boxes on supported sites
- **Enhanced KPI Dashboard**: Charts and detailed stats in options page
- **Help Page**: Documentation and FAQs

---

## Feature Status

| Feature | Current Status |
|---------|----------------|
| Extract via keyboard shortcut | ✅ Works |
| Extract via floating button | ✅ Works |
| Extract via popup button | ✅ Works |
| Download as .md | ✅ Works (via settings) |
| Domain ignore toggle | ✅ Works |
| KPI counters | ✅ Works |
| Jump to target domain | ✅ Works (auto) |
| Manual target domain button | ✅ Works |
| Options page | ✅ Works |
| Last extraction status in popup | ✅ Works |
| Download button in popup | ❌ Future |
| Preview markdown | ❌ Future |
| Extract & paste | ❌ Future |
