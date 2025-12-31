// Simplified domain toggle for ExtractMD popup

import { saveSetting } from '../shared/storage.js';
import { showStatus } from './ui.js';

/**
 * Get current domain from active tab
 * @returns {Promise<string|null>} Domain or null
 */
async function getCurrentDomain() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            const url = new URL(tab.url);
            return url.hostname;
        }
    } catch (e) {
        console.error('[ExtractMD] Error getting current domain:', e);
    }
    return null;
}

/**
 * Check if domain is currently ignored
 * @param {string} domain - Domain to check
 * @returns {Promise<boolean>} True if ignored
 */
async function isDomainIgnored(domain) {
    return new Promise((resolve) => {
        chrome.storage.sync.get({ ignoredDomains: '' }, (items) => {
            const domains = items.ignoredDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
            resolve(domains.includes(domain));
        });
    });
}

/**
 * Toggle domain ignore status
 * @param {string} domain - Domain to toggle
 * @returns {Promise<boolean>} New ignored status
 */
async function toggleDomainIgnore(domain) {
    return new Promise((resolve) => {
        chrome.storage.sync.get({ ignoredDomains: '' }, (items) => {
            let domains = items.ignoredDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
            
            if (domains.includes(domain)) {
                // Remove from ignored
                domains = domains.filter(d => d !== domain);
                const newValue = domains.join('\n');
                saveSetting('ignoredDomains', newValue);
                resolve(false);
            } else {
                // Add to ignored
                domains.push(domain);
                const newValue = domains.join('\n');
                saveSetting('ignoredDomains', newValue);
                resolve(true);
            }
        });
    });
}

/**
 * Update the toggle button appearance
 * @param {boolean} isIgnored - Whether domain is ignored
 */
function updateToggleButton(isIgnored) {
    const toggleBtn = document.getElementById('toggleDomainBtn');
    if (!toggleBtn) return;
    
    if (isIgnored) {
        toggleBtn.textContent = '✅ Enable';
        toggleBtn.classList.add('ignored');
    } else {
        toggleBtn.textContent = '🚫 Ignore';
        toggleBtn.classList.remove('ignored');
    }
}

/**
 * Initialize domain toggle module
 */
export async function initializeDomainToggle() {
    const domainEl = document.getElementById('currentDomain');
    const toggleBtn = document.getElementById('toggleDomainBtn');
    
    // Get and display current domain
    const domain = await getCurrentDomain();
    
    if (domainEl) {
        domainEl.textContent = domain || '---';
    }
    
    if (!domain) {
        if (toggleBtn) toggleBtn.style.display = 'none';
        return;
    }
    
    // Check and update ignore status
    const isIgnored = await isDomainIgnored(domain);
    updateToggleButton(isIgnored);
    
    // Handle toggle click
    if (toggleBtn) {
        toggleBtn.addEventListener('click', async () => {
            const currentDomain = await getCurrentDomain();
            if (!currentDomain) return;
            
            const nowIgnored = await toggleDomainIgnore(currentDomain);
            updateToggleButton(nowIgnored);
            
            if (nowIgnored) {
                showStatus(`${currentDomain} will be ignored`, 'success');
            } else {
                showStatus(`${currentDomain} is now enabled`, 'success');
            }
        });
    }
}

