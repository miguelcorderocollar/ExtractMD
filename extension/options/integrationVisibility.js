// Integration visibility toggle for ExtractMD options page

/**
 * Mapping of integration settings to their nav items and sections
 */
const INTEGRATION_SECTIONS = {
    enableYouTubeIntegration: 'youtube',
    enableHackerNewsIntegration: 'hackernews',
    enableArticleIntegration: 'articles',
    enableUniversalIntegration: 'universal'
};

/**
 * Update visibility of integration settings sections
 * based on which integrations are enabled
 */
export function updateIntegrationVisibility() {
    chrome.storage.sync.get({
        enableYouTubeIntegration: true,
        enableHackerNewsIntegration: true,
        enableArticleIntegration: true,
        enableUniversalIntegration: true
    }, function(items) {
        for (const [settingKey, sectionName] of Object.entries(INTEGRATION_SECTIONS)) {
            const navItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
            const section = document.getElementById(`section-${sectionName}`);
            const show = items[settingKey] !== false;
            
            if (navItem) {
                navItem.style.display = show ? '' : 'none';
            }
            if (section) {
                // If section is currently active and being hidden, switch to General
                if (!show && section.classList.contains('active')) {
                    const generalNav = document.querySelector('.nav-item[data-section="general"]');
                    if (generalNav) {
                        generalNav.click();
                    }
                }
            }
        }
    });
}

/**
 * Initialize integration visibility based on stored settings
 * @param {Object} items - Settings object from storage
 */
export function applyInitialIntegrationVisibility(items) {
    for (const [settingKey, sectionName] of Object.entries(INTEGRATION_SECTIONS)) {
        const navItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
        const show = items[settingKey] !== false;
        
        if (navItem) {
            navItem.style.display = show ? '' : 'none';
        }
    }
}

