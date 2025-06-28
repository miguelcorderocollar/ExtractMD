// Popup script for YouTube Transcript Copier
document.addEventListener('DOMContentLoaded', function() {
    const includeTimestampsCheckbox = document.getElementById('includeTimestamps');
    const copyButton = document.getElementById('copyButton');
    const statusDiv = document.getElementById('status');
    
    // Load saved settings
    chrome.storage.sync.get({
        includeTimestamps: true
    }, function(items) {
        includeTimestampsCheckbox.checked = items.includeTimestamps;
    });
    
    // Save settings when changed
    includeTimestampsCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({
            includeTimestamps: includeTimestampsCheckbox.checked
        });
    });
    
    // Handle copy button click
    copyButton.addEventListener('click', async function() {
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a YouTube video page
            if (!tab.url || !tab.url.includes('youtube.com/watch')) {
                showStatus('Please navigate to a YouTube video page', 'error');
                return;
            }
            
            // Disable button and show loading state
            copyButton.disabled = true;
            copyButton.textContent = 'Copying...';
            
            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'copyTranscript' });
            
            if (response && response.success) {
                showStatus('Transcript copied successfully!', 'success');
            } else {
                showStatus('Failed to copy transcript', 'error');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showStatus('Error: ' + error.message, 'error');
        } finally {
            // Re-enable button
            copyButton.disabled = false;
            copyButton.textContent = 'Copy Transcript';
        }
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
    
    // Check if we're on a YouTube video page and update button state
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        if (!tab.url || !tab.url.includes('youtube.com/watch')) {
            copyButton.disabled = true;
            copyButton.textContent = 'Not on YouTube video';
            showStatus('Navigate to a YouTube video to use this extension', 'error');
        }
    });
}); 