// Popup script for ExtractMD settings, import/export

document.addEventListener('DOMContentLoaded', function() {
    // Settings elements
    const includeTimestampsCheckbox = document.getElementById('includeTimestamps');
    const addTitleToTranscriptCheckbox = document.getElementById('addTitleToTranscript');
    const addChannelToTranscriptCheckbox = document.getElementById('addChannelToTranscript');
    const addUrlToTranscriptCheckbox = document.getElementById('addUrlToTranscript');
    const jumpToDomainCheckbox = document.getElementById('jumpToDomain');
    const jumpToDomainUrlInput = document.getElementById('jumpToDomainUrl');
    const hnIncludeAuthorCheckbox = document.getElementById('hnIncludeAuthor');
    const hnIncludeTimeCheckbox = document.getElementById('hnIncludeTime');
    const hnIncludeRepliesCheckbox = document.getElementById('hnIncludeReplies');
    const hnNewsIncludeTitleCheckbox = document.getElementById('hnNewsIncludeTitle');
    const hnNewsIncludeUrlCheckbox = document.getElementById('hnNewsIncludeUrl');
    const hnNewsIncludeSiteCheckbox = document.getElementById('hnNewsIncludeSite');
    const hnNewsIncludePointsCheckbox = document.getElementById('hnNewsIncludePoints');
    const hnNewsIncludeAuthorCheckbox = document.getElementById('hnNewsIncludeAuthor');
    const hnNewsIncludeTimeCheckbox = document.getElementById('hnNewsIncludeTime');
    const hnNewsIncludeCommentsCheckbox = document.getElementById('hnNewsIncludeComments');
    const articleExporterIncludeImagesCheckbox = document.getElementById('articleExporterIncludeImages');
    const statusDiv = document.getElementById('status');

    // Import/Export elements
    const exportBtn = document.getElementById('exportSettingsBtn');
    const importBtn = document.getElementById('importSettingsBtn');
    const importFileInput = document.getElementById('importSettingsFile');

    // Load saved settings
    chrome.storage.sync.get({
        includeTimestamps: true,
        addTitleToTranscript: true,
        addChannelToTranscript: true,
        addUrlToTranscript: true,
        jumpToDomain: false,
        jumpToDomainUrl: 'https://chat.openai.com/',
        hnIncludeAuthor: true,
        hnIncludeTime: true,
        hnIncludeReplies: true,
        hnNewsIncludeTitle: true,
        hnNewsIncludeUrl: true,
        hnNewsIncludeSite: true,
        hnNewsIncludePoints: true,
        hnNewsIncludeAuthor: true,
        hnNewsIncludeTime: true,
        hnNewsIncludeComments: true,
        articleExporterIncludeImages: true
    }, function(items) {
        includeTimestampsCheckbox.checked = items.includeTimestamps;
        addTitleToTranscriptCheckbox.checked = items.addTitleToTranscript;
        addChannelToTranscriptCheckbox.checked = items.addChannelToTranscript;
        addUrlToTranscriptCheckbox.checked = items.addUrlToTranscript;
        jumpToDomainCheckbox.checked = items.jumpToDomain;
        jumpToDomainUrlInput.value = items.jumpToDomainUrl;
        hnIncludeAuthorCheckbox.checked = items.hnIncludeAuthor;
        hnIncludeTimeCheckbox.checked = items.hnIncludeTime;
        hnIncludeRepliesCheckbox.checked = items.hnIncludeReplies;
        hnNewsIncludeTitleCheckbox.checked = items.hnNewsIncludeTitle;
        hnNewsIncludeUrlCheckbox.checked = items.hnNewsIncludeUrl;
        hnNewsIncludeSiteCheckbox.checked = items.hnNewsIncludeSite;
        hnNewsIncludePointsCheckbox.checked = items.hnNewsIncludePoints;
        hnNewsIncludeAuthorCheckbox.checked = items.hnNewsIncludeAuthor;
        hnNewsIncludeTimeCheckbox.checked = items.hnNewsIncludeTime;
        hnNewsIncludeCommentsCheckbox.checked = items.hnNewsIncludeComments;
        articleExporterIncludeImagesCheckbox.checked = items.articleExporterIncludeImages;
    });

    // Save settings when changed
    includeTimestampsCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ includeTimestamps: includeTimestampsCheckbox.checked });
    });
    addTitleToTranscriptCheckbox.addEventListener('change', function(e) {
        chrome.storage.sync.set({ addTitleToTranscript: e.target.checked });
    });
    addChannelToTranscriptCheckbox.addEventListener('change', function(e) {
        chrome.storage.sync.set({ addChannelToTranscript: e.target.checked });
    });
    addUrlToTranscriptCheckbox.addEventListener('change', function(e) {
        chrome.storage.sync.set({ addUrlToTranscript: e.target.checked });
    });
    jumpToDomainCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ jumpToDomain: jumpToDomainCheckbox.checked });
    });
    jumpToDomainUrlInput.addEventListener('input', function() {
        chrome.storage.sync.set({ jumpToDomainUrl: jumpToDomainUrlInput.value });
    });
    hnIncludeAuthorCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnIncludeAuthor: hnIncludeAuthorCheckbox.checked });
    });
    hnIncludeTimeCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnIncludeTime: hnIncludeTimeCheckbox.checked });
    });
    hnIncludeRepliesCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnIncludeReplies: hnIncludeRepliesCheckbox.checked });
    });
    hnNewsIncludeTitleCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeTitle: hnNewsIncludeTitleCheckbox.checked });
    });
    hnNewsIncludeUrlCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeUrl: hnNewsIncludeUrlCheckbox.checked });
    });
    hnNewsIncludeSiteCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeSite: hnNewsIncludeSiteCheckbox.checked });
    });
    hnNewsIncludePointsCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludePoints: hnNewsIncludePointsCheckbox.checked });
    });
    hnNewsIncludeAuthorCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeAuthor: hnNewsIncludeAuthorCheckbox.checked });
    });
    hnNewsIncludeTimeCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeTime: hnNewsIncludeTimeCheckbox.checked });
    });
    hnNewsIncludeCommentsCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeComments: hnNewsIncludeCommentsCheckbox.checked });
    });
    articleExporterIncludeImagesCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ articleExporterIncludeImages: articleExporterIncludeImagesCheckbox.checked });
    });

    // Status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Get extension name/version from manifest
    function getManifest(cb) {
        fetch(chrome.runtime.getURL('manifest.json'))
            .then(r => r.json())
            .then(cb)
            .catch(() => cb({ name: 'ExtractMD', version: 'unknown' }));
    }

    // Export settings
    exportBtn.addEventListener('click', function() {
        chrome.storage.sync.get(null, function(settings) {
            getManifest(function(manifest) {
                const exportData = {
                    extension: manifest.name || 'ExtractMD',
                    version: manifest.version || 'unknown',
                    timestamp: new Date().toISOString(),
                    settings
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ExtractMD-settings-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                showStatus('Settings exported!', 'success');
            });
        });
    });

    // Import settings
    importBtn.addEventListener('click', function() {
        importFileInput.value = '';
        importFileInput.click();
    });

    importFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data || typeof data !== 'object' || !data.settings) throw new Error('Invalid file');
                chrome.storage.sync.set(data.settings, function() {
                    // Reload UI with new settings
                    location.reload();
                });
            } catch (err) {
                showStatus('Import failed: Invalid file', 'error');
                return;
            }
        };
        reader.readAsText(file);
    });

    // Accordion logic
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const container = this.nextElementSibling;
            if (container) {
                container.classList.toggle('open');
            }
        });
    });
}); 