// Popup script for YouTube Transcript Copier
document.addEventListener('DOMContentLoaded', function() {
    const includeTimestampsCheckbox = document.getElementById('includeTimestamps');
    const copyButton = document.getElementById('copyButton');
    const statusDiv = document.getElementById('status');
    const videoTitleDiv = document.getElementById('videoTitle');
    const channelNameLink = document.getElementById('channelName');
    const videoUrlLink = document.getElementById('videoUrl');
    const jumpToDomainCheckbox = document.getElementById('jumpToDomain');
    const jumpToDomainUrlInput = document.getElementById('jumpToDomainUrl');
    
    // HN Comments settings
    const hnIncludeAuthorCheckbox = document.getElementById('hnIncludeAuthor');
    const hnIncludeTimeCheckbox = document.getElementById('hnIncludeTime');
    const hnIncludeRepliesCheckbox = document.getElementById('hnIncludeReplies');
    const copyHNCommentsButton = document.getElementById('copyHNCommentsButton');
    
    // HN News settings
    const hnNewsIncludeTitleCheckbox = document.getElementById('hnNewsIncludeTitle');
    const hnNewsIncludeUrlCheckbox = document.getElementById('hnNewsIncludeUrl');
    const hnNewsIncludeSiteCheckbox = document.getElementById('hnNewsIncludeSite');
    const hnNewsIncludePointsCheckbox = document.getElementById('hnNewsIncludePoints');
    const hnNewsIncludeAuthorCheckbox = document.getElementById('hnNewsIncludeAuthor');
    const hnNewsIncludeTimeCheckbox = document.getElementById('hnNewsIncludeTime');
    const hnNewsIncludeCommentsCheckbox = document.getElementById('hnNewsIncludeComments');
    const copyHNNewsButton = document.getElementById('copyHNNewsButton');
    
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
        hnNewsIncludeComments: true
    }, function(items) {
        includeTimestampsCheckbox.checked = items.includeTimestamps;
        document.getElementById('addTitleToTranscript').checked = items.addTitleToTranscript;
        document.getElementById('addChannelToTranscript').checked = items.addChannelToTranscript;
        document.getElementById('addUrlToTranscript').checked = items.addUrlToTranscript;
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
    });
    
    // Save settings when changed
    includeTimestampsCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ includeTimestamps: includeTimestampsCheckbox.checked });
    });
    document.getElementById('addTitleToTranscript').addEventListener('change', function(e) {
        chrome.storage.sync.set({ addTitleToTranscript: e.target.checked });
    });
    document.getElementById('addChannelToTranscript').addEventListener('change', function(e) {
        chrome.storage.sync.set({ addChannelToTranscript: e.target.checked });
    });
    document.getElementById('addUrlToTranscript').addEventListener('change', function(e) {
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

    const videoInfoWarning = document.createElement('div');
    videoInfoWarning.id = 'videoInfoWarning';
    videoInfoWarning.style.cssText = 'background:rgba(244,67,54,0.15);color:#fff3cd;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:12px;display:none;';
    videoInfoWarning.textContent = 'Some video info could not be loaded. If this persists, please contact the developer.';
    document.querySelector('.video-info').insertAdjacentElement('beforebegin', videoInfoWarning);

    // Fetch and display video info
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        if (!tab.url || !tab.url.includes('youtube.com/watch')) {
            copyButton.disabled = true;
            copyButton.textContent = 'Not on YouTube video';
            showStatus('Navigate to a YouTube video to use this extension', 'error');
            return;
        }
        // Request video info from content script
        chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, function(response) {
            let missing = false;
            if (response && response.success) {
                videoTitleDiv.textContent = response.title || '(not found)';
                channelNameLink.textContent = response.channelName || '(not found)';
                channelNameLink.href = response.channelUrl || '#';
                videoUrlLink.textContent = response.videoUrl || '(not found)';
                videoUrlLink.href = response.videoUrl || '#';
                if (!response.title || !response.channelName || !response.channelUrl || !response.videoUrl) {
                    missing = true;
                }
            } else {
                videoTitleDiv.textContent = '(not found)';
                channelNameLink.textContent = '(not found)';
                channelNameLink.href = '#';
                videoUrlLink.textContent = '(not found)';
                videoUrlLink.href = '#';
                missing = true;
            }
            videoInfoWarning.style.display = missing ? 'block' : 'none';
        });
    });
    
    // Enable HN button only on HN item pages
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        if (tab.url && tab.url.match(/^https:\/\/news\.ycombinator\.com\/item\?id=\d+/)) {
            copyHNCommentsButton.disabled = false;
        } else {
            copyHNCommentsButton.disabled = true;
        }
    });

    copyHNCommentsButton.addEventListener('click', function() {
        // Get current HN settings
        chrome.storage.sync.get({
            hnIncludeAuthor: true,
            hnIncludeTime: true,
            hnIncludeReplies: true
        }, function(items) {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const tab = tabs[0];
                chrome.tabs.sendMessage(tab.id, {
                    action: 'copyHNComments',
                    settings: {
                        hnIncludeAuthor: items.hnIncludeAuthor,
                        hnIncludeTime: items.hnIncludeTime,
                        hnIncludeReplies: items.hnIncludeReplies
                    }
                }, function(response) {
                    if (response && response.success) {
                        showStatus('HN comments copied as Markdown!', 'success');
                    } else {
                        showStatus('Failed to copy HN comments.', 'error');
                    }
                });
            });
        });
    });
    
    // Enable HN News button only on HN main/news page
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        if (tab.url && tab.url.match(/^https:\/\/news\.ycombinator\.com\/(news|newest|front|best|ask|show|jobs)/)) {
            copyHNNewsButton.disabled = false;
        } else {
            copyHNNewsButton.disabled = true;
        }
    });

    copyHNNewsButton.addEventListener('click', function() {
        // Get current HN news settings
        chrome.storage.sync.get({
            hnNewsIncludeTitle: true,
            hnNewsIncludeUrl: true,
            hnNewsIncludeSite: true,
            hnNewsIncludePoints: true,
            hnNewsIncludeAuthor: true,
            hnNewsIncludeTime: true,
            hnNewsIncludeComments: true
        }, function(items) {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const tab = tabs[0];
                chrome.tabs.sendMessage(tab.id, {
                    action: 'copyHNNews',
                    settings: {
                        hnNewsIncludeTitle: items.hnNewsIncludeTitle,
                        hnNewsIncludeUrl: items.hnNewsIncludeUrl,
                        hnNewsIncludeSite: items.hnNewsIncludeSite,
                        hnNewsIncludePoints: items.hnNewsIncludePoints,
                        hnNewsIncludeAuthor: items.hnNewsIncludeAuthor,
                        hnNewsIncludeTime: items.hnNewsIncludeTime,
                        hnNewsIncludeComments: items.hnNewsIncludeComments
                    }
                }, function(response) {
                    if (response && response.success) {
                        showStatus('HN news copied as Markdown!', 'success');
                    } else {
                        showStatus('Failed to copy HN news.', 'error');
                    }
                });
            });
        });
    });
    
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        // Hide status after 3 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}); 