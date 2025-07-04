// Global state for the floating button
let floatingButton = null;
let isProcessing = false;

// Check if video is in fullscreen mode
function isVideoFullscreen() {
  // Check for browser fullscreen API
  if (document.fullscreenElement || 
      document.webkitFullscreenElement || 
      document.mozFullScreenElement || 
      document.msFullscreenElement) {
    return true;
  }
  
  // Check for YouTube's theater mode (which is like fullscreen)
  const theaterModeButton = document.querySelector('button[aria-label="Theater mode (t)"]');
  if (theaterModeButton && theaterModeButton.getAttribute('aria-pressed') === 'true') {
    return true;
  }
  
  // Check for YouTube's fullscreen button state
  const fullscreenButton = document.querySelector('button[aria-label="Full screen (f)"]');
  if (fullscreenButton && fullscreenButton.getAttribute('aria-pressed') === 'true') {
    return true;
  }
  
  return false;
}

// Update button visibility based on fullscreen state
function updateButtonVisibility() {
  if (!floatingButton) return;
  
  if (isVideoFullscreen()) {
    floatingButton.style.display = 'none';
  } else {
    floatingButton.style.display = 'flex';
  }
}

// --- MutationObserver for dynamic article detection ---
let articleObserver = null;

function manageFloatingButtonForArticles() {
  const articles = Array.from(document.querySelectorAll('article'));
  let floatingButton = document.getElementById('yt-transcript-floating-button');
  if (articles.length > 0) {
    if (!floatingButton) {
      // Create the floating button if it doesn't exist
      floatingButton = document.createElement('div');
      floatingButton.id = 'yt-transcript-floating-button';
      floatingButton.innerHTML = `<div class="button-emoji">📝</div>`;
      floatingButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        color: #222;
        border: 1px solid #ccc;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        cursor: pointer;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        user-select: none;
        opacity: 1;
      `;
      floatingButton.addEventListener('mouseenter', () => {
        floatingButton.style.background = '#f3f4f6';
      });
      floatingButton.addEventListener('mouseleave', () => {
        floatingButton.style.background = 'rgba(255, 255, 255, 0.95)';
      });
      floatingButton.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        floatingButton.innerHTML = `<div class=\"button-emoji\">⏳</div>`;
        try {
          const settings = await new Promise(resolve => {
            chrome.storage.sync.get({ articleExporterIncludeImages: true }, resolve);
          });
          // Always get the current articles at click time
          const currentArticles = Array.from(document.querySelectorAll('article'));
          let md = '';
          if (currentArticles.length === 1) {
            md = await extractArticleMarkdown(currentArticles[0], settings.articleExporterIncludeImages);
          } else {
            const mdArr = await Promise.all(currentArticles.map((a, i) => extractArticleMarkdown(a, settings.articleExporterIncludeImages).then(md => `## Article ${i+1}\n\n${md}`)));
            md = mdArr.join('\n\n---\n\n');
          }
          await copyToClipboard(md, true);
          floatingButton.innerHTML = `<div class=\"button-emoji\">✅</div>`;
          showNotification('Article(s) copied as Markdown!', 'success');
          setTimeout(() => {
            floatingButton.innerHTML = `<div class=\\"button-emoji\\">📝</div>`;
            isProcessing = false;
          }, 2000);
        } catch (e) {
          floatingButton.innerHTML = `<div class=\"button-emoji\">❌</div>`;
          showNotification('Failed to copy article(s).', 'error');
          console.error('Error in floating button handler:', e);
          setTimeout(() => {
            floatingButton.innerHTML = `<div class=\\"button-emoji\\">📝</div>`;
            isProcessing = false;
          }, 3000);
        }
      });
      document.body.appendChild(floatingButton);
    } else {
      floatingButton.style.display = 'flex';
    }
  } else {
    // No articles: remove or hide the button
    if (floatingButton) {
      floatingButton.remove();
    }
  }
}

function setupArticleMutationObserver() {
  if (articleObserver) return; // Prevent multiple observers
  articleObserver = new MutationObserver(() => {
    manageFloatingButtonForArticles();
  });
  articleObserver.observe(document.body, { childList: true, subtree: true });
}

// --- End MutationObserver logic ---

// Replace the article logic in initializeFloatingButton with observer setup
function initializeFloatingButton() {
  // Show on YouTube video, HN item, or HN news pages
  const isYouTube = window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch');
  const isHNItem = window.location.hostname.includes('ycombinator.com') && window.location.pathname === '/item';
  const isHNNews = window.location.hostname.includes('ycombinator.com') && (
    window.location.pathname === '/news' ||
    window.location.pathname === '/newest' ||
    window.location.pathname === '/front' ||
    window.location.pathname === '/best' ||
    window.location.pathname === '/ask' ||
    window.location.pathname === '/show' ||
    window.location.pathname === '/jobs'
  );

  if (isYouTube || isHNItem || isHNNews) {
    // Run the original logic for YouTube and HN
    // (this is the code that creates the floating button for those sites)
    // ... existing code for YouTube/HN floating button ...
    // (leave as it was before the MutationObserver change)
    // Place the original YouTube/HN floating button logic here
    // (copy from your previous implementation)
    // ... existing code ...
    // Create floating button
    floatingButton = document.createElement('div');
    floatingButton.id = 'yt-transcript-floating-button';
    floatingButton.innerHTML = `
      <div class="button-emoji">📝</div>
    `;
    // Add styles
    floatingButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 56px;
      height: 56px;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      user-select: none;
      opacity: 0.7;
    `;
    // Hover effects
    floatingButton.addEventListener('mouseenter', () => {
      if (!isProcessing) {
        floatingButton.style.transform = 'translateY(-2px) scale(1.1)';
        floatingButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
        floatingButton.style.opacity = '1';
        floatingButton.style.background = 'rgba(255, 255, 255, 0.25)';
      }
    });
    floatingButton.addEventListener('mouseleave', () => {
      if (!isProcessing) {
        floatingButton.style.transform = 'translateY(0) scale(1)';
        floatingButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        floatingButton.style.opacity = '0.7';
        floatingButton.style.background = 'rgba(255, 255, 255, 0.15)';
      }
    });
    // Click handler
    floatingButton.addEventListener('click', async () => {
      if (isProcessing) return;
      if (isYouTube) {
        await handleFloatingButtonClick();
      } else if (isHNItem) {
        await handleHNFloatingButtonClick();
      } else if (isHNNews) {
        await handleHNNewsFloatingButtonClick();
      }
    });
    // Add to page
    document.body.appendChild(floatingButton);
    // Set initial visibility
    updateButtonVisibility();
    return;
  }

  // Otherwise, set up the MutationObserver for articles
  setupArticleMutationObserver();
  manageFloatingButtonForArticles();
}

// Handle floating button click
async function handleFloatingButtonClick() {
  try {
    isProcessing = true;
    setButtonLoading();
    
    // Call the existing transcript copy function
    await window.copyYouTubeTranscript();
    
    // Show success state
    setButtonSuccess();
    
    // Reset to normal state after 2 seconds
    setTimeout(() => {
      setButtonNormal();
      isProcessing = false;
    }, 2000);
    
  } catch (error) {
    setButtonError();
    
    // Reset to normal state after 3 seconds
    setTimeout(() => {
      setButtonNormal();
      isProcessing = false;
    }, 3000);
  }
}

async function handleHNFloatingButtonClick() {
  try {
    isProcessing = true;
    setButtonLoading();
    // Get HN settings
    const settings = await new Promise(resolve => {
      chrome.storage.sync.get({
        hnIncludeAuthor: true,
        hnIncludeTime: true,
        hnIncludeReplies: true
      }, resolve);
    });
    // Extract and copy comments
    const md = extractHNCommentsMarkdown(settings);
    await copyToClipboard(md, true);
    setButtonSuccess();
    showNotification('HN comments copied to clipboard!', 'success');
    setTimeout(() => {
      setButtonNormal();
      isProcessing = false;
    }, 2000);
  } catch (error) {
    setButtonError();
    showNotification('Failed to copy HN comments.', 'error');
    setTimeout(() => {
      setButtonNormal();
      isProcessing = false;
    }, 3000);
  }
}

async function handleHNNewsFloatingButtonClick() {
  try {
    isProcessing = true;
    setButtonLoading();
    // Get HN news settings
    const settings = await new Promise(resolve => {
      chrome.storage.sync.get({
        hnNewsIncludeTitle: true,
        hnNewsIncludeUrl: true,
        hnNewsIncludeSite: true,
        hnNewsIncludePoints: true,
        hnNewsIncludeAuthor: true,
        hnNewsIncludeTime: true,
        hnNewsIncludeComments: true
      }, resolve);
    });
    // Extract and copy news
    const md = extractHNNewsMarkdown(settings);
    await copyToClipboard(md, true);
    setButtonSuccess();
    showNotification('HN news copied to clipboard!', 'success');
    setTimeout(() => {
      setButtonNormal();
      isProcessing = false;
    }, 2000);
  } catch (error) {
    setButtonError();
    showNotification('Failed to copy HN news.', 'error');
    setTimeout(() => {
      setButtonNormal();
      isProcessing = false;
    }, 3000);
  }
}

// Set button to loading state
function setButtonLoading() {
  if (!floatingButton) return;
  
  floatingButton.innerHTML = `
    <div class="button-emoji">⏳</div>
  `;
  
  floatingButton.style.background = 'rgba(255, 193, 7, 0.8)';
  floatingButton.style.border = '1px solid rgba(255, 193, 7, 0.3)';
  floatingButton.style.cursor = 'not-allowed';
  floatingButton.style.fontSize = '20px';
  floatingButton.style.opacity = '1';
}

// Set button to success state
function setButtonSuccess() {
  if (!floatingButton) return;
  
  floatingButton.innerHTML = `
    <div class="button-emoji">✅</div>
  `;
  
  floatingButton.style.background = 'rgba(76, 175, 80, 0.8)';
  floatingButton.style.border = '1px solid rgba(76, 175, 80, 0.3)';
  floatingButton.style.fontSize = '24px';
  floatingButton.style.opacity = '1';
}

// Set button to error state
function setButtonError() {
  if (!floatingButton) return;
  
  floatingButton.innerHTML = `
    <div class="button-emoji">❌</div>
  `;
  
  floatingButton.style.background = 'rgba(244, 67, 54, 0.8)';
  floatingButton.style.border = '1px solid rgba(244, 67, 54, 0.3)';
  floatingButton.style.fontSize = '24px';
  floatingButton.style.opacity = '1';
}

// Set button back to normal state
function setButtonNormal() {
  if (!floatingButton) return;
  
  floatingButton.innerHTML = `
    <div class="button-emoji">📝</div>
  `;
  
  floatingButton.style.background = 'rgba(255, 255, 255, 0.15)';
  floatingButton.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  floatingButton.style.cursor = 'pointer';
  floatingButton.style.fontSize = '24px';
  floatingButton.style.opacity = '0.7';
}

// Ensure floating button is initialized after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('%c👋 Hi dev! If you are reading this, you probably like poking around. Have a great day! – ExtractMD', 'color: #ff5252; font-size: 16px; font-weight: bold;');
    initializeFloatingButton();
  });
} else {
  console.log('%c👋 Hi dev! If you are reading this, you probably like poking around. Have a great day! – ExtractMD', 'color: #ff5252; font-size: 16px; font-weight: bold;');
  initializeFloatingButton();
}

// Also initialize on YouTube navigation (SPA behavior)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    
    // Remove existing button if it exists
    if (floatingButton && floatingButton.parentNode) {
      floatingButton.parentNode.removeChild(floatingButton);
      floatingButton = null;
    }
    
    // Initialize new button after a short delay
    setTimeout(initializeFloatingButton, 1000);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Monitor for fullscreen changes
document.addEventListener('fullscreenchange', updateButtonVisibility);
document.addEventListener('webkitfullscreenchange', updateButtonVisibility);
document.addEventListener('mozfullscreenchange', updateButtonVisibility);
document.addEventListener('MSFullscreenChange', updateButtonVisibility);

// Monitor for YouTube player state changes (theater mode, fullscreen buttons)
const playerObserver = new MutationObserver(() => {
  updateButtonVisibility();
});

// Start observing player controls for changes
function startPlayerObserver() {
  const playerControls = document.querySelector('#movie_player');
  if (playerControls) {
    playerObserver.observe(playerControls, {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-pressed']
    });
  }
}

// Initialize player observer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPlayerObserver);
} else {
  startPlayerObserver();
}

// Also start player observer on YouTube navigation
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    setTimeout(startPlayerObserver, 1000);
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Global function that can be called from background script
window.copyYouTubeTranscript = async function(settings = null) {
  try {
    // Always get latest settings if not provided
    let mergedSettings = settings;
    if (!settings) {
      mergedSettings = await new Promise(resolve => {
        chrome.storage.sync.get({
          includeTimestamps: true,
          addTitleToTranscript: true,
          addChannelToTranscript: true,
          addUrlToTranscript: true,
          jumpToDomain: false,
          jumpToDomainUrl: 'https://chat.openai.com/'
        }, resolve);
      });
    }
    // Step 1: Click the "Show more" button to expand description
    await expandDescription();
    // Step 2: Wait and click "Show transcript" button
    await clickShowTranscript();
    // Step 3: Wait for transcript to load and copy it
    await waitForTranscriptAndCopy(mergedSettings);
    // Step 4: Jump to domain if enabled
    if (mergedSettings.jumpToDomain && mergedSettings.jumpToDomainUrl) {
      chrome.runtime.sendMessage({ action: 'openNewTab', url: mergedSettings.jumpToDomainUrl });
    }
  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
    throw error; // Re-throw to handle in floating button
  }
};

async function expandDescription() {
  // Look for the expand button
  const expandButton = document.querySelector('tp-yt-paper-button#expand');
  if (expandButton) {
    expandButton.click();
    await sleep(500); // Wait 500ms as specified
  }
}

async function clickShowTranscript() {
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
  } else {
    throw new Error('Show transcript button not found. This video might not have a transcript available.');
  }
}

async function waitForTranscriptAndCopy(settings = {}) {
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
    showNotification('❌ Transcript not found or not available for this video. Please check if the video has a transcript. If this persists, contact the developer.', 'error', true);
    throw new Error('Transcript failed to load within timeout period.');
  }
  
  
  // Extract transcript text
  let transcriptText = extractTranscriptText();
  
  // Prepend metadata if requested
  let metaMd = '';
  if (settings.addTitleToTranscript || settings.addChannelToTranscript || settings.addUrlToTranscript) {
    // Get video info
    let title = '';
    let channelName = '';
    let channelUrl = '';
    let videoUrl = window.location.href;
    const titleElem = document.querySelector('div#title h1 yt-formatted-string');
    if (titleElem) title = titleElem.textContent.trim();
    const channelElem = document.querySelector('ytd-channel-name#channel-name a');
    if (channelElem) {
      channelName = channelElem.textContent.trim();
      channelUrl = channelElem.href.startsWith('http') ? channelElem.href : (window.location.origin + channelElem.getAttribute('href'));
    }
    if (settings.addTitleToTranscript && title) metaMd += `# ${title}\n`;
    if (settings.addChannelToTranscript && channelName) metaMd += `**Channel:** [${channelName}](${channelUrl})\n`;
    if (settings.addUrlToTranscript && videoUrl) metaMd += `**Video URL:** ${videoUrl}\n`;
    if (metaMd) metaMd += '\n';
  }
  transcriptText = metaMd + transcriptText;
  
  // Get settings
  const userSettings = await getSettings();
  
  // Copy to clipboard
  await copyToClipboard(transcriptText, userSettings.includeTimestamps);
  
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
  } catch (error) {
    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

function showNotification(message, type = 'info', prominent = false) {
  // Create a notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: ${prominent ? '20px 28px' : '12px 20px'};
    border-radius: 8px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: ${prominent ? '18px' : '14px'};
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    transition: opacity 0.3s ease;
    max-width: 350px;
    word-wrap: break-word;
    text-align: center;
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
  
  // Remove after 3 seconds (or 5s if prominent)
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, prominent ? 5000 : 3000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'copyTranscript') {
    // Accept settings from popup
    window.copyYouTubeTranscript(request.settings).then(() => {
      sendResponse({success: true});
    }).catch(() => {
      sendResponse({success: false});
    });
    return true;
  } else if (request.action === 'getVideoInfo') {
    try {
      // Title
      let title = '';
      const titleElem = document.querySelector('div#title h1 yt-formatted-string');
      if (titleElem) {
        title = titleElem.textContent.trim();
      }
      // Channel name and URL
      let channelName = '';
      let channelUrl = '';
      const channelElem = document.querySelector('ytd-channel-name#channel-name a');
      if (channelElem) {
        channelName = channelElem.textContent.trim();
        channelUrl = channelElem.href.startsWith('http') ? channelElem.href : (window.location.origin + channelElem.getAttribute('href'));
      }
      // Video URL
      const videoUrl = window.location.href;
      sendResponse({
        success: true,
        title,
        channelName,
        channelUrl,
        videoUrl
      });
    } catch (e) {
      sendResponse({success: false, error: e.message});
    }
    // Indicate async response
    return true;
  } else if (request.action === 'copyHNComments') {
    // HN comments extraction logic
    try {
      const md = extractHNCommentsMarkdown(request.settings);
      copyToClipboard(md, true).then(() => {
        showNotification('HN comments copied to clipboard!', 'success');
        sendResponse({ success: true });
      }).catch(() => {
        showNotification('Failed to copy HN comments.', 'error');
        sendResponse({ success: false });
      });
    } catch (e) {
      showNotification('Failed to extract HN comments.', 'error');
      sendResponse({ success: false });
    }
    return true;
  } else if (request.action === 'copyHNNews') {
    try {
      const md = extractHNNewsMarkdown(request.settings);
      copyToClipboard(md, true).then(() => {
        showNotification('HN news copied to clipboard!', 'success');
        sendResponse({ success: true });
      }).catch(() => {
        showNotification('Failed to copy HN news.', 'error');
        sendResponse({ success: false });
      });
    } catch (e) {
      showNotification('Failed to extract HN news.', 'error');
      sendResponse({ success: false });
    }
    return true;
  }
});

function extractHNCommentsMarkdown(settings) {
  // Only run on HN item pages
  if (!window.location.hostname.includes('ycombinator.com') || !window.location.pathname.startsWith('/item')) {
    throw new Error('Not on a Hacker News item page.');
  }
  // Parse all comment rows
  const rows = Array.from(document.querySelectorAll('tr.athing.comtr'));
  // Build a tree of comments
  const comments = [];
  const stack = [];
  rows.forEach(row => {
    const indentImg = row.querySelector('td.ind img');
    const indent = indentImg ? parseInt(indentImg.getAttribute('width') || '0', 10) / 40 : 0;
    const author = row.querySelector('.hnuser')?.textContent || '';
    const time = row.querySelector('.age a')?.textContent || '';
    const commentHtml = row.querySelector('.commtext')?.innerHTML || '';
    const commentText = htmlToMarkdown(commentHtml);
    const id = row.id;
    const comment = { id, author, time, commentText, indent, children: [] };
    // Place in tree
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (stack.length) {
      stack[stack.length - 1].children.push(comment);
    } else {
      comments.push(comment);
    }
    stack.push(comment);
  });
  // Build Markdown
  function renderComment(c, depth) {
    let md = '';
    if (settings.hnIncludeAuthor) md += `**${c.author}**`;
    if (settings.hnIncludeTime) md += (md ? ' · ' : '') + `_${c.time}_`;
    if (md) md += '\n';
    md += c.commentText + '\n';
    if (settings.hnIncludeReplies && c.children.length) {
      md += c.children.map(child => renderComment(child, depth + 1)).join('');
    }
    return md.split('\n').map(line => (depth > 0 ? '>'.repeat(depth) + ' ' + line : line)).join('\n') + '\n';
  }
  let result = comments.map(c => renderComment(c, 0)).join('\n');
  // Add title and URL
  const title = document.querySelector('title')?.textContent || '';
  const url = window.location.href;
  result = `# ${title}\n\n**URL:** ${url}\n\n` + result;
  return result.trim();
}

function htmlToMarkdown(html) {
  let text = html
    .replace(/<p>/gi, '\n\n')
    .replace(/<a [^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, function(_, code) { return '```' + code + '```'; })
    .replace(/<[^>]+>/g, '') // Remove any other tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
  // Replace placeholder with triple backticks
  text = text.replace(/\u007F\u007F\u007F/g, '```');
  return text.trim();
}

function extractHNNewsMarkdown(settings) {
  // Only run on HN main/news pages
  if (!window.location.hostname.includes('ycombinator.com')) throw new Error('Not on HN');
  const validPaths = ['/news','/newest','/front','/best','/ask','/show','/jobs'];
  if (!validPaths.includes(window.location.pathname)) throw new Error('Not on HN news page');
  // Find all news items
  const tbodies = Array.from(document.querySelectorAll('tbody'));
  let newsRows = [];
  tbodies.forEach(tbody => {
    const rows = Array.from(tbody.querySelectorAll('tr.athing.submission'));
    if (rows.length) newsRows = newsRows.concat(rows);
  });
  // If not found, fallback to tr.athing
  if (newsRows.length === 0) {
    newsRows = Array.from(document.querySelectorAll('tr.athing'));
  }
  let md = '';
  newsRows.forEach(row => {
    let line = '';
    // Title
    if (settings.hnNewsIncludeTitle) {
      const title = row.querySelector('.titleline a')?.textContent?.trim() || '';
      line += `### ${title}\n`;
    }
    // URL
    if (settings.hnNewsIncludeUrl) {
      const url = row.querySelector('.titleline a')?.href || '';
      if (url) line += `[Link](${url})\n`;
    }
    // Site
    if (settings.hnNewsIncludeSite) {
      const site = row.querySelector('.sitestr')?.textContent?.trim() || '';
      if (site) line += `*Site:* ${site}\n`;
    }
    // Points, Author, Time, Comments
    const subtextRow = row.nextElementSibling;
    if (subtextRow && subtextRow.querySelector('.subtext')) {
      const subtext = subtextRow.querySelector('.subtext');
      // Points
      if (settings.hnNewsIncludePoints) {
        const points = subtext.querySelector('.score')?.textContent?.trim() || '';
        if (points) line += `*Points:* ${points}\n`;
      }
      // Author
      if (settings.hnNewsIncludeAuthor) {
        const author = subtext.querySelector('.hnuser')?.textContent?.trim() || '';
        if (author) line += `*By:* ${author}\n`;
      }
      // Time
      if (settings.hnNewsIncludeTime) {
        const time = subtext.querySelector('.age a')?.textContent?.trim() || '';
        if (time) line += `*Time:* ${time}\n`;
      }
      // Comments
      if (settings.hnNewsIncludeComments) {
        const comments = Array.from(subtext.querySelectorAll('a')).find(a => a.textContent.includes('comment'))?.textContent?.trim() || '';
        if (comments) line += `*Comments:* ${comments}\n`;
      }
    }
    md += line + '\n';
  });
  return md.trim();
}

async function extractArticleMarkdown(articleElem, includeImages) {
  // Recursively convert article HTML to Markdown
  function nodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    const tag = node.tagName.toLowerCase();
    if (tag === 'h1') return `# ${node.textContent.trim()}\n\n`;
    if (tag === 'h2') return `## ${node.textContent.trim()}\n\n`;
    if (tag === 'h3') return `### ${node.textContent.trim()}\n\n`;
    if (tag === 'h4') return `#### ${node.textContent.trim()}\n\n`;
    if (tag === 'h5') return `##### ${node.textContent.trim()}\n\n`;
    if (tag === 'h6') return `###### ${node.textContent.trim()}\n\n`;
    if (tag === 'p') return `${Array.from(node.childNodes).map(nodeToMarkdown).join('')}\n\n`;
    if (tag === 'ul') return `\n${Array.from(node.children).map(li => `- ${nodeToMarkdown(li)}`).join('')}\n`;
    if (tag === 'ol') return `\n${Array.from(node.children).map((li, i) => `${i+1}. ${nodeToMarkdown(li)}`).join('')}\n`;
    if (tag === 'li') return `${Array.from(node.childNodes).map(nodeToMarkdown).join('')}`;
    if (tag === 'strong' || tag === 'b') return `**${node.textContent}**`;
    if (tag === 'em' || tag === 'i') return `*${node.textContent}*`;
    if (tag === 'blockquote') return `> ${node.textContent}\n\n`;
    if (tag === 'code') return '```' + node.textContent + '```';
    if (tag === 'pre') return '```' + node.textContent + '```';
    if (tag === 'img' && includeImages) {
      const alt = node.getAttribute('alt') || '';
      let src = node.getAttribute('src') || '';
      if (src) {
        // Convert relative URLs to absolute
        if (!src.match(/^https?:\/\//)) {
          if (src.startsWith('/')) {
            src = window.location.origin + src;
          } else {
            // Relative to current path
            const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
            src = base + src;
          }
        }
        return `![${alt}](${src})\n\n`;
      }
    }
    // Default: recurse into children
    return Array.from(node.childNodes).map(nodeToMarkdown).join('');
  }
  let markdown = '';
  const children = Array.from(articleElem.childNodes);
  children.forEach(child => {
    const md = nodeToMarkdown(child);
    if (md && md.trim()) {
      markdown += md;
    }
  });
  return markdown.trim();
} 