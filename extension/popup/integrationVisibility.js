// Integration visibility toggle for ExtractMD popup

/**
 * Update visibility of integration settings sections
 * based on which integrations are enabled
 */
export function updateIntegrationVisibility() {
    const collapsibles = document.querySelectorAll('.collapsible');
    const containers = document.querySelectorAll('.container');
    
    // Preserve General Settings open state
    const generalOpen = containers[0] ? containers[0].classList.contains('open') : false;
    
    chrome.storage.sync.get({
        enableYouTubeIntegration: true,
        enableHackerNewsIntegration: true,
        enableArticleIntegration: true,
    }, function(items) {
        // collapsibles/containers: 0=General, 1=YT, 2=HN Comments, 3=HN News, 4=Article
        if (collapsibles[1] && containers[1]) {
            const show = items.enableYouTubeIntegration !== false;
            collapsibles[1].style.display = show ? '' : 'none';
            containers[1].style.display = show ? '' : 'none';
        }
        if (collapsibles[2] && containers[2]) {
            const show = items.enableHackerNewsIntegration !== false;
            collapsibles[2].style.display = show ? '' : 'none';
            containers[2].style.display = show ? '' : 'none';
        }
        if (collapsibles[3] && containers[3]) {
            const show = items.enableHackerNewsIntegration !== false;
            collapsibles[3].style.display = show ? '' : 'none';
            containers[3].style.display = show ? '' : 'none';
        }
        if (collapsibles[4] && containers[4]) {
            const show = items.enableArticleIntegration !== false;
            collapsibles[4].style.display = show ? '' : 'none';
            containers[4].style.display = show ? '' : 'none';
        }
        
        // Restore General Settings open state
        if (containers[0]) {
            if (generalOpen) {
                containers[0].classList.add('open');
            } else {
                containers[0].classList.remove('open');
            }
        }
    });
}

/**
 * Initialize integration visibility based on stored settings
 * @param {Object} items - Settings object from storage
 */
export function applyInitialIntegrationVisibility(items) {
    const collapsibles = document.querySelectorAll('.collapsible');
    const containers = document.querySelectorAll('.container');
    
    // collapsibles/containers: 0=General, 1=YT, 2=HN Comments, 3=HN News, 4=Article
    if (collapsibles[1] && containers[1]) {
        const show = items.enableYouTubeIntegration !== false;
        collapsibles[1].style.display = show ? '' : 'none';
        containers[1].style.display = show ? '' : 'none';
    }
    if (collapsibles[2] && containers[2]) {
        const show = items.enableHackerNewsIntegration !== false;
        collapsibles[2].style.display = show ? '' : 'none';
        containers[2].style.display = show ? '' : 'none';
    }
    if (collapsibles[3] && containers[3]) {
        const show = items.enableHackerNewsIntegration !== false;
        collapsibles[3].style.display = show ? '' : 'none';
        containers[3].style.display = show ? '' : 'none';
    }
    if (collapsibles[4] && containers[4]) {
        const show = items.enableArticleIntegration !== false;
        collapsibles[4].style.display = show ? '' : 'none';
        containers[4].style.display = show ? '' : 'none';
    }
}

