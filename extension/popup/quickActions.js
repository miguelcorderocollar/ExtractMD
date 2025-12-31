// Quick action buttons for ExtractMD popup

import { showStatus } from './ui.js';

/**
 * Handle Extract Now button click
 * Triggers extraction on the current page (respects user settings)
 */
async function handleExtractNow() {
    const extractBtn = document.getElementById('extractNowBtn');
    if (extractBtn) {
        extractBtn.disabled = true;
        extractBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Extracting...</span>';
    }
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
            showStatus('No active tab found', 'error');
            return;
        }
        
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                if (window.copyExtractMD) {
                    window.copyExtractMD();
                } else {
                    console.warn('[ExtractMD] No extraction function available on this page');
                }
            }
        });
        
        showStatus('Extraction triggered!', 'success');
        
    } catch (error) {
        console.error('[ExtractMD] Error triggering extraction:', error);
        showStatus('Failed to extract', 'error');
    } finally {
        if (extractBtn) {
            extractBtn.disabled = false;
            extractBtn.innerHTML = '<span class="btn-icon">📋</span><span>Extract Now</span>';
        }
    }
}

/**
 * Handle Open Target Domain button click
 */
async function handleOpenTarget() {
    try {
        const { jumpToDomainUrl } = await chrome.storage.sync.get(['jumpToDomainUrl']);
        if (jumpToDomainUrl) {
            await chrome.tabs.create({ url: jumpToDomainUrl });
        }
    } catch (error) {
        console.error('[ExtractMD] Error opening target domain:', error);
        showStatus('Failed to open target', 'error');
    }
}

/**
 * Handle Open Settings button click
 */
function handleOpenSettings() {
    chrome.runtime.openOptionsPage();
}

/**
 * Initialize target domain section visibility
 */
async function initializeTargetDomain() {
    const targetSection = document.getElementById('targetDomainSection');
    const targetLabel = document.getElementById('targetDomainLabel');
    
    if (!targetSection) return;
    
    const { jumpToDomainUrl } = await chrome.storage.sync.get(['jumpToDomainUrl']);
    
    if (jumpToDomainUrl && jumpToDomainUrl.trim()) {
        try {
            const url = new URL(jumpToDomainUrl);
            targetLabel.textContent = `Open ${url.hostname}`;
            targetSection.style.display = 'block';
        } catch {
            targetSection.style.display = 'none';
        }
    } else {
        targetSection.style.display = 'none';
    }
}

/**
 * Initialize quick actions module
 */
export function initializeQuickActions() {
    const extractBtn = document.getElementById('extractNowBtn');
    const openTargetBtn = document.getElementById('openTargetBtn');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    
    if (extractBtn) {
        extractBtn.addEventListener('click', handleExtractNow);
    }
    
    if (openTargetBtn) {
        openTargetBtn.addEventListener('click', handleOpenTarget);
    }
    
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', handleOpenSettings);
    }
    
    // Initialize target domain section
    initializeTargetDomain();
}
