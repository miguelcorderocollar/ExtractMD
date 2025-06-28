// Content script for YouTube Transcript Copier
console.log('YouTube Transcript Copier content script loaded');

// Global function that can be called from background script
window.copyYouTubeTranscript = async function() {
  try {
    console.log('Starting transcript copy process...');
    
    // Step 1: Click the "Show more" button to expand description
    await expandDescription();
    
    // Step 2: Wait and click "Show transcript" button
    await clickShowTranscript();
    
    // Step 3: Wait for transcript to load and copy it
    await waitForTranscriptAndCopy();
    
  } catch (error) {
    console.error('Error copying transcript:', error);
    showNotification('Error: ' + error.message, 'error');
  }
};

async function expandDescription() {
  console.log('Expanding description...');
  
  // Look for the expand button
  const expandButton = document.querySelector('tp-yt-paper-button#expand');
  if (expandButton) {
    expandButton.click();
    console.log('Clicked expand button');
    await sleep(500); // Wait 500ms as specified
  } else {
    console.log('Expand button not found, description might already be expanded');
  }
}

async function clickShowTranscript() {
  console.log('Looking for Show transcript button...');
  
  // Wait for the button to appear
  let showTranscriptButton = null;
  let attempts = 0;
  const maxAttempts = 20; // 10 seconds max wait
  
  while (!showTranscriptButton && attempts < maxAttempts) {
    showTranscriptButton = document.querySelector('button[aria-label="Show transcript"]');
    if (!showTranscriptButton) {
      await sleep(500);
      attempts++;
    }
  }
  
  if (showTranscriptButton) {
    showTranscriptButton.click();
    console.log('Clicked Show transcript button');
  } else {
    throw new Error('Show transcript button not found. This video might not have a transcript available.');
  }
}

async function waitForTranscriptAndCopy() {
  console.log('Waiting for transcript to load...');
  
  // Wait for transcript segments to appear
  let transcriptContainer = null;
  let attempts = 0;
  const maxAttempts = 40; // 20 seconds max wait
  
  while (!transcriptContainer && attempts < maxAttempts) {
    transcriptContainer = document.querySelector('ytd-transcript-segment-list-renderer #segments-container');
    if (!transcriptContainer) {
      await sleep(500);
      attempts++;
    }
  }
  
  if (!transcriptContainer) {
    throw new Error('Transcript failed to load within timeout period.');
  }
  
  console.log('Transcript loaded, extracting content...');
  
  // Extract transcript text
  const transcriptText = extractTranscriptText();
  
  // Get settings
  const settings = await getSettings();
  
  // Copy to clipboard
  await copyToClipboard(transcriptText, settings.includeTimestamps);
  
  showNotification('Transcript copied to clipboard!', 'success');
}

function extractTranscriptText() {
  const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
  const sections = document.querySelectorAll('ytd-transcript-section-header-renderer');
  
  let transcript = '';
  
  // Process all elements in order (segments and section headers)
  const allElements = Array.from(document.querySelectorAll('ytd-transcript-segment-renderer, ytd-transcript-section-header-renderer'));
  
  allElements.forEach(element => {
    if (element.tagName === 'YTD-TRANSCRIPT-SECTION-HEADER-RENDERER') {
      // This is a section header (chapter)
      const headerText = element.querySelector('.shelf-header-layout-wiz__title')?.textContent?.trim();
      if (headerText) {
        transcript += `\n\n## ${headerText}\n`;
      }
    } else if (element.tagName === 'YTD-TRANSCRIPT-SEGMENT-RENDERER') {
      // This is a transcript segment
      const timestamp = element.querySelector('.segment-timestamp')?.textContent?.trim();
      const text = element.querySelector('.segment-text')?.textContent?.trim();
      
      if (text) {
        if (timestamp) {
          transcript += `[${timestamp}] ${text}\n`;
        } else {
          transcript += `${text}\n`;
        }
      }
    }
  });
  
  return transcript.trim();
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      includeTimestamps: true
    }, (settings) => {
      resolve(settings);
    });
  });
}

async function copyToClipboard(text, includeTimestamps) {
  let textToCopy = text;
  
  if (!includeTimestamps) {
    // Remove timestamps from the text
    textToCopy = text.replace(/\[\d+:\d+\]/g, '').replace(/\n\s*\n/g, '\n').trim();
  }
  
  try {
    await navigator.clipboard.writeText(textToCopy);
    console.log('Text copied to clipboard');
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

function showNotification(message, type = 'info') {
  // Create a notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: opacity 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  // Set background color based on type
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#4CAF50';
      break;
    case 'error':
      notification.style.backgroundColor = '#f44336';
      break;
    default:
      notification.style.backgroundColor = '#2196F3';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'copyTranscript') {
    window.copyYouTubeTranscript();
    sendResponse({success: true});
  }
}); 