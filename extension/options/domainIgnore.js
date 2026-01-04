// Domain ignore functionality for ExtractMD options page

import { saveSetting } from '../shared/storage.js';
import { showStatus } from './ui.js';

// Domain validation regex: allows domains, localhost, and IP addresses
const DOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^localhost$|^(?:\d{1,3}\.){3}\d{1,3}$/i;

/**
 * Validate a list of domains (one per line)
 * @param {string} text - Newline-separated list of domains
 * @returns {boolean} True if all domains are valid
 */
export function validateDomains(text) {
  const domains = text
    .split('\n')
    .map((d) => d.trim())
    .filter((d) => d.length > 0);
  for (const domain of domains) {
    if (!DOMAIN_REGEX.test(domain)) return false;
  }
  return true;
}

/**
 * Update the "Ignore Current Domain" button state
 */
export function updateIgnoreButtonState() {
  const ignoreCurrentDomainBtn = document.getElementById('ignoreCurrentDomainBtn');
  if (!ignoreCurrentDomainBtn) return;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        if (!domain) return;

        chrome.storage.sync.get({ ignoredDomains: '' }, function (items) {
          const currentDomains = items.ignoredDomains
            .split('\n')
            .map((d) => d.trim())
            .filter((d) => d.length > 0);
          const isIgnored = currentDomains.includes(domain);

          if (isIgnored) {
            ignoreCurrentDomainBtn.innerHTML = '✅ Stop Ignoring';
            ignoreCurrentDomainBtn.style.background = '#f0fdf4';
            ignoreCurrentDomainBtn.style.color = '#166534';
            ignoreCurrentDomainBtn.style.borderColor = '#bbf7d0';
          } else {
            ignoreCurrentDomainBtn.innerHTML = '🚫 Ignore Current';
            ignoreCurrentDomainBtn.style.background = '#f3f4f6';
            ignoreCurrentDomainBtn.style.color = '#374151';
            ignoreCurrentDomainBtn.style.borderColor = '#bfc6e0';
          }
        });
      } catch {
        // Invalid URL, ignore
      }
    }
  });
}

/**
 * Toggle ignore status for current domain
 */
function toggleCurrentDomain() {
  const ignoredDomainsTextarea = document.getElementById('ignoredDomains');

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;

        if (!domain) {
          showStatus('Could not determine domain', 'error');
          return;
        }

        chrome.storage.sync.get({ ignoredDomains: '' }, function (items) {
          let currentDomains = items.ignoredDomains
            .split('\n')
            .map((d) => d.trim())
            .filter((d) => d.length > 0);

          if (currentDomains.includes(domain)) {
            // Un-ignore (remove)
            currentDomains = currentDomains.filter((d) => d !== domain);
            const newValue = currentDomains.join('\n');
            saveSetting('ignoredDomains', newValue);
            if (ignoredDomainsTextarea) {
              ignoredDomainsTextarea.value = newValue;
            }
            showStatus(`Removed ${domain} from ignored domains`, 'success');
            updateIgnoreButtonState();
          } else {
            // Ignore (add)
            currentDomains.push(domain);
            const newValue = currentDomains.join('\n');
            saveSetting('ignoredDomains', newValue);
            if (ignoredDomainsTextarea) {
              ignoredDomainsTextarea.value = newValue;
            }
            showStatus(`Added ${domain} to ignored domains`, 'success');
            updateIgnoreButtonState();
          }
        });
      } catch {
        showStatus('Invalid URL', 'error');
      }
    }
  });
}

/**
 * Initialize domain ignore functionality
 */
export function initializeDomainIgnore() {
  const ignoredDomainsTextarea = document.getElementById('ignoredDomains');
  const ignoreCurrentDomainBtn = document.getElementById('ignoreCurrentDomainBtn');
  const domainValidationError = document.getElementById('domainValidationError');

  // Update button state on load
  updateIgnoreButtonState();

  // Validate domains on input
  if (ignoredDomainsTextarea && domainValidationError) {
    ignoredDomainsTextarea.addEventListener('input', function () {
      const value = ignoredDomainsTextarea.value;
      const isValid = validateDomains(value);

      if (isValid || value.trim() === '') {
        domainValidationError.style.display = 'none';
        ignoredDomainsTextarea.style.borderColor = '#e0e3ef';
        saveSetting('ignoredDomains', value);
        updateIgnoreButtonState();
      } else {
        domainValidationError.style.display = 'block';
        ignoredDomainsTextarea.style.borderColor = '#dc2626';
      }
    });
  }

  // Toggle current domain button
  if (ignoreCurrentDomainBtn) {
    ignoreCurrentDomainBtn.addEventListener('click', toggleCurrentDomain);
  }
}
