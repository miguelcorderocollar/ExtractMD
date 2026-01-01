# Chrome Web Store Publishing Checklist
**Last Updated: December 2025**

This checklist covers all requirements for publishing ExtractMD to the Chrome Web Store as of December 2025.

## ✅ Pre-Submission Requirements

### 1. Developer Account Setup
- [x] Create a Google account (if not already have one)
- [x] Register as a Chrome Web Store developer
- [x] Pay the one-time registration fee ($5 USD as of 2025)
- [x] Verify developer account email address
- [x] Complete developer profile with accurate contact information

### 2. Extension Technical Requirements

#### Manifest V3 Compliance ✅
- [x] Using Manifest V3 (`manifest_version: 3`)
- [x] Service worker instead of background page (`background.service_worker`)
- [x] Content Security Policy compliant
- [x] No inline scripts or eval()

#### Code Quality
- [x] Extension tested thoroughly on latest Chrome version
- [x] No crashes or broken features
- [x] All permissions properly justified (see Permissions section below)
- [x] Code is minified/bundled for production (`npm run build:prod`)
- [x] Source maps removed from production build (or kept for debugging)

#### Permissions Justification
The extension currently requests:
- `activeTab` ✅ - Needed to access current tab content for extraction
- `storage` ✅ - Needed to save user settings and preferences
- `clipboardWrite` ✅ - Needed to copy extracted Markdown to clipboard
- `scripting` ✅ - Needed to inject content scripts dynamically
- `host_permissions: <all_urls>` ✅ - **JUSTIFIED** (see below)

**`<all_urls>` Justification:**
ExtractMD includes a Universal Article Extractor that allows users to extract Markdown from **any webpage**, not just YouTube and Hacker News. This enables users to copy content from blogs, documentation sites, news articles, and any other web content. The extension only processes content when the user explicitly requests extraction—it does not run automatically or collect any browsing data.

> **Store Listing Text (copy this to Privacy tab):**
> "The `<all_urls>` permission is required because ExtractMD includes a Universal Article Extractor feature that enables Markdown extraction from any website. This allows users to extract content from blogs, documentation, news sites, and other web pages beyond the built-in YouTube and Hacker News integrations. The extension only activates when users explicitly request extraction and does not automatically access or collect any browsing data."

### 3. Privacy Policy & Data Disclosure ⚠️ **CRITICAL**

#### Privacy Policy Required
- [x] **Create a privacy policy document** ✅ See `docs/privacy-policy.md`
- [x] Host privacy policy at a publicly accessible URL ✅ `https://extractmd.miguelcorderocollar.com/privacy`
- [ ] Link privacy policy in Chrome Web Store listing

#### Data Collection Disclosure
Based on codebase analysis, the extension:
- ✅ Stores user settings locally (`chrome.storage.sync`)
- ✅ Tracks usage statistics locally (`usageStats` KPI data)
- ✅ Does NOT send data to external servers
- ✅ Does NOT collect personal information
- ✅ Does NOT use analytics or tracking services

**Privacy Policy Must Include:** ✅ All covered in `docs/privacy-policy.md`
- [x] Statement that no user data is sent to external servers
- [x] Explanation of local storage usage (settings, KPIs)
- [x] Description of what data is stored locally
- [x] User's right to clear data (via settings export/import)
- [x] Statement that extension only processes content user explicitly extracts
- [x] No third-party data sharing
- [x] Contact information for privacy inquiries

**Suggested Privacy Policy Content:**
```
ExtractMD Privacy Policy

Data Collection:
- ExtractMD stores your preferences and settings locally in your browser
- Usage statistics (KPIs) are tracked locally and never transmitted
- No personal information is collected
- No data is sent to external servers
- Content extraction happens entirely in your browser

Data Storage:
- Settings are stored using Chrome's sync storage API
- All data remains on your device or synced to your Chrome account
- You can export/import settings at any time
- You can clear usage statistics via the extension popup

Permissions:
- activeTab: Access current page content for extraction
- storage: Save your preferences
- clipboardWrite: Copy extracted Markdown
- scripting: Inject extraction functionality
- all_urls: Enable article extraction from any website

Contact: [Your email or support URL]
```

### 4. Store Listing Assets

#### Required Assets
- [x] Extension icons (16x16, 48x48, 128x128) ✅
- [ ] **Screenshots** (at least 1, recommended 3-5)
  - [ ] Screenshot 1: Popup interface showing settings
  - [ ] Screenshot 2: Floating button on YouTube page
  - [ ] Screenshot 3: Floating button on Hacker News
  - [ ] Screenshot 4: Options page
  - [ ] Screenshot 5: Example extracted Markdown output
- [ ] **Promotional images** (optional but recommended)
  - [ ] Small promotional tile (440x280)
  - [ ] Large promotional tile (920x680)
  - [ ] Marquee promotional tile (1400x560)

#### Screenshot Requirements
- Minimum 1 screenshot required
- Recommended: 3-5 screenshots
- Format: PNG or JPEG
- Size: 1280x800 or 640x400 pixels
- Must accurately represent extension functionality
- Should show key features and UI

### 5. Store Listing Content

#### Required Fields ✅ See `docs/store-listing.md` for ready-to-use content
- [x] **Name**: "ExtractMD" (max 45 characters)
- [x] **Short description**: 132 characters max
  - Current: "Extract and copy content as Markdown from any webpage. Built-in support for YouTube, Hacker News, and articles."
  - ✅ Within limit (109 characters)
- [x] **Detailed description**: Up to 16,000 characters (~2,800 chars written)
  - [x] Expand current README description
  - [x] Include feature highlights
  - [x] Add usage instructions
  - [x] Include troubleshooting tips
  - [x] Avoid keyword stuffing
- [x] **Category**: Productivity (or Developer Tools)
- [x] **Language**: English
- [x] **Support URL**: `https://github.com/miguelcorderocollar/yt-transcript-extension/issues`
- [x] **Homepage URL**: `https://extractmd.miguelcorderocollar.com/`

#### Listing Best Practices
- [x] Description is clear and accurate
- [x] No misleading claims about functionality
- [x] Keywords are relevant and not spammy
- [x] Description matches actual extension behavior
- [x] All URLs are functional and accessible

### 6. Policy Compliance

#### Chrome Web Store Program Policies
- [x] **Single Purpose**: Extension has a single, clear purpose ✅
  - Purpose: Extract content as Markdown from web pages
- [x] **User Data Privacy**: Privacy policy provided and accurate - [x] **Functionality**: Extension works as described ✅
- [x] **No Prohibited Content**: 
  - [x] No real money gambling ✅
  - [x] No malicious code ✅
  - [x] No deceptive practices ✅
- [x] **Affiliate Links**: N/A (extension doesn't use affiliate links) ✅
- [x] **Spam and Placement**: 
  - [x] No keyword stuffing ✅
  - [x] Accurate metadata ✅

#### Specific Policy Requirements (2025 Updates)
- [x] **Affiliate Ads Policy**: N/A (not applicable)
- [x] **Appeals Process**: Understand that only one appeal per violation is allowed
- [ ] **Functional Elements**: All screenshots, videos, and images must be functional

### 7. Packaging & Submission

#### Package Preparation
- [ ] Run production build: `npm run build:prod`
- [ ] Verify all files are included:
  - [ ] manifest.json
  - [ ] background.js
  - [ ] dist/content.js (bundled)
  - [ ] popup.html, popup.js, popup.css
  - [ ] options.html, options.js, options.css
  - [ ] All icon files (16, 48, 128)
  - [ ] All image assets
- [ ] Create ZIP file of extension folder
- [ ] Test ZIP by loading as unpacked extension
- [ ] Verify no unnecessary files included (node_modules, tests, etc.)
- [ ] Check ZIP file size (should be reasonable, < 10MB typically)

#### Submission Process
- [ ] Upload ZIP file via Chrome Developer Dashboard
- [ ] Complete "Listing" tab:
  - [ ] Name, description, category
  - [ ] Screenshots
  - [ ] Promotional images (optional)
- [ ] Complete "Privacy" tab:
  - [ ] Privacy policy URL
  - [ ] Data usage disclosure
  - [ ] Single purpose description
- [ ] Complete "Payment and Distribution" tab:
  - [ ] Distribution regions (worldwide or specific)
  - [ ] Pricing (free)
- [ ] Review all information for accuracy
- [ ] Submit for review

### 8. Post-Submission

#### Review Process
- [ ] Monitor email for review status updates
- [ ] Check Chrome Developer Dashboard regularly
- [ ] Be prepared to respond to reviewer questions
- [ ] Address any requested changes promptly
- [ ] Understand review can take 1-3 business days (sometimes longer)

#### After Approval
- [ ] Monitor user reviews and ratings
- [ ] Respond to user feedback
- [ ] Address bug reports quickly
- [ ] Plan for regular updates
- [ ] Keep extension compatible with Chrome updates

## 🔴 Critical Missing Items

### High Priority (Must Have Before Submission)
1. **Privacy Policy** - ✅ Created and hosted at `https://extractmd.miguelcorderocollar.com/privacy`
2. **Screenshots** - Create at least 1-3 screenshots showing extension in action
3. **Permissions Justification** - ✅ Added explanation for `<all_urls>` permission
4. **Production Build** - ✅ Configured (`npm run build:prod`)

### Medium Priority (Recommended)
1. **Promotional Images** - Create promotional tiles for better store visibility
2. **Enhanced Description** - Expand store listing description with more details
3. **Support Channel** - Ensure GitHub issues page is accessible and monitored

### Low Priority (Nice to Have)
1. **Video Demo** - Create a short video showing extension features
2. **Localization** - Consider translating to other languages
3. **Store Badges** - Add any relevant badges or certifications

## 📋 Quick Pre-Submission Checklist

Before clicking "Submit for Review", ensure:

- [x] Privacy policy is created and hosted
- [ ] Privacy policy URL is added to store listing
- [ ] At least 1 screenshot is uploaded
- [ ] All required fields in store listing are completed
- [ ] Extension ZIP is tested and working
- [ ] Production build is used (not development build)
- [ ] Permissions are justified in description
- [ ] No test data or debug code in production build
- [ ] Version number matches manifest.json
- [x] All URLs in listing are accessible

## 📚 Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Chrome Web Store Listing Requirements](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/devguide/)

