# Chrome Web Store Publishing Checklist
**Last Updated: December 2025**

This checklist covers all requirements for publishing ExtractMD to the Chrome Web Store as of December 2025.

## ✅ Pre-Submission Requirements

### 1. Developer Account Setup
- [ ] Create a Google account (if not already have one)
- [ ] Register as a Chrome Web Store developer
- [ ] Pay the one-time registration fee ($5 USD as of 2025)
- [ ] Verify developer account email address
- [ ] Complete developer profile with accurate contact information

### 2. Extension Technical Requirements

#### Manifest V3 Compliance ✅
- [x] Using Manifest V3 (`manifest_version: 3`)
- [x] Service worker instead of background page (`background.service_worker`)
- [x] Content Security Policy compliant
- [x] No inline scripts or eval()

#### Code Quality
- [ ] Extension tested thoroughly on latest Chrome version
- [ ] No crashes or broken features
- [ ] All permissions properly justified (see Permissions section below)
- [ ] Code is minified/bundled for production (`npm run build:prod`)
- [ ] Source maps removed from production build (or kept for debugging)

#### Permissions Justification
The extension currently requests:
- `activeTab` ✅ - Needed to access current tab content for extraction
- `storage` ✅ - Needed to save user settings and preferences
- `clipboardWrite` ✅ - Needed to copy extracted Markdown to clipboard
- `scripting` ✅ - Needed to inject content scripts dynamically
- `host_permissions: <all_urls>` ⚠️ - **NEEDS JUSTIFICATION**

**Action Required for `<all_urls>`:**
- [ ] Add detailed justification in store listing explaining why universal access is needed
- [ ] Consider if we can use more specific host permissions instead
- [ ] Document that extension only activates on supported sites (YouTube, Hacker News, articles)
- [ ] Explain that universal access allows article extraction from any website

### 3. Privacy Policy & Data Disclosure ⚠️ **CRITICAL**

#### Privacy Policy Required
- [ ] **Create a privacy policy document** (HTML or hosted webpage)
- [ ] Host privacy policy at a publicly accessible URL
- [ ] Link privacy policy in Chrome Web Store listing

#### Data Collection Disclosure
Based on codebase analysis, the extension:
- ✅ Stores user settings locally (`chrome.storage.sync`)
- ✅ Tracks usage statistics locally (`usageStats` KPI data)
- ✅ Does NOT send data to external servers
- ✅ Does NOT collect personal information
- ✅ Does NOT use analytics or tracking services

**Privacy Policy Must Include:**
- [ ] Statement that no user data is sent to external servers
- [ ] Explanation of local storage usage (settings, KPIs)
- [ ] Description of what data is stored locally
- [ ] User's right to clear data (via settings export/import)
- [ ] Statement that extension only processes content user explicitly extracts
- [ ] No third-party data sharing
- [ ] Contact information for privacy inquiries

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

#### Required Fields
- [ ] **Name**: "ExtractMD" (max 45 characters) ✅
- [ ] **Short description**: 132 characters max
  - Current: "Extract and copy information as Markdown from YouTube, Hacker News, and more."
  - ✅ Within limit
- [ ] **Detailed description**: Up to 16,000 characters
  - [ ] Expand current README description
  - [ ] Include feature highlights
  - [ ] Add usage instructions
  - [ ] Include troubleshooting tips
  - [ ] Avoid keyword stuffing
- [ ] **Category**: Select appropriate category
  - Suggested: "Productivity" or "Developer Tools"
- [ ] **Language**: Select primary language (English)
- [ ] **Support URL**: GitHub issues page or support email
  - Current: `https://github.com/miguelcorderocollar/yt-transcript-extension/issues`
- [ ] **Homepage URL**: GitHub repository
  - Current: `https://github.com/miguelcorderocollar/yt-transcript-extension`

#### Listing Best Practices
- [ ] Description is clear and accurate
- [ ] No misleading claims about functionality
- [ ] Keywords are relevant and not spammy
- [ ] Description matches actual extension behavior
- [ ] All URLs are functional and accessible

### 6. Policy Compliance

#### Chrome Web Store Program Policies
- [ ] **Single Purpose**: Extension has a single, clear purpose ✅
  - Purpose: Extract content as Markdown from web pages
- [ ] **User Data Privacy**: Privacy policy provided and accurate ⚠️ (see Privacy Policy section)
- [ ] **Functionality**: Extension works as described ✅
- [ ] **No Prohibited Content**: 
  - [ ] No real money gambling ✅
  - [ ] No malicious code ✅
  - [ ] No deceptive practices ✅
- [ ] **Affiliate Links**: N/A (extension doesn't use affiliate links) ✅
- [ ] **Spam and Placement**: 
  - [ ] No keyword stuffing ✅
  - [ ] Accurate metadata ✅

#### Specific Policy Requirements (2025 Updates)
- [ ] **Affiliate Ads Policy**: N/A (not applicable)
- [ ] **Appeals Process**: Understand that only one appeal per violation is allowed
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
1. **Privacy Policy** - Create and host a privacy policy document
2. **Screenshots** - Create at least 1-3 screenshots showing extension in action
3. **Permissions Justification** - Add detailed explanation for `<all_urls>` permission
4. **Production Build** - Ensure production build is optimized and tested

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

- [ ] Privacy policy is created and hosted
- [ ] Privacy policy URL is added to store listing
- [ ] At least 1 screenshot is uploaded
- [ ] All required fields in store listing are completed
- [ ] Extension ZIP is tested and working
- [ ] Production build is used (not development build)
- [ ] Permissions are justified in description
- [ ] No test data or debug code in production build
- [ ] Version number matches manifest.json
- [ ] All URLs in listing are accessible

## 📚 Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Chrome Web Store Listing Requirements](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/devguide/)

## 🎯 Estimated Timeline

- **Privacy Policy Creation**: 1-2 hours
- **Screenshot Creation**: 1-2 hours
- **Store Listing Completion**: 1-2 hours
- **Final Testing**: 1 hour
- **Submission**: 30 minutes
- **Review Process**: 1-3 business days (Google's timeline)

**Total Estimated Time**: 4-7 hours of work + 1-3 days for review

---

**Note**: This checklist is based on Chrome Web Store requirements as of December 2025. Policies may change, so always refer to the official Chrome Web Store documentation before submission.

