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
    
    // Load saved settings
    chrome.storage.sync.get({
        includeTimestamps: true,
        addTitleToTranscript: true,
        addChannelToTranscript: true,
        addUrlToTranscript: true,
        jumpToDomain: false,
        jumpToDomainUrl: 'https://chat.openai.com/'
    }, function(items) {
        includeTimestampsCheckbox.checked = items.includeTimestamps;
        document.getElementById('addTitleToTranscript').checked = items.addTitleToTranscript;
        document.getElementById('addChannelToTranscript').checked = items.addChannelToTranscript;
        document.getElementById('addUrlToTranscript').checked = items.addUrlToTranscript;
        jumpToDomainCheckbox.checked = items.jumpToDomain;
        jumpToDomainUrlInput.value = items.jumpToDomainUrl;
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