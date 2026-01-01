// Shared Floating Button component for ExtractMD
// Used by YouTube, Hacker News, and Article extractors

// Default position offset from bottom-right corner
const DEFAULT_OFFSET = { left: 0, up: 0 };
const DEFAULT_RIGHT = 20;
const DEFAULT_BOTTOM = 20;
const DRAG_THRESHOLD = 5; // pixels - movement less than this triggers click
const HOVER_DELAY_MS = 500; // ms before showing dismiss button

/**
 * Load saved position offset for a domain from chrome.storage.local
 * @param {string} domain - The domain to load position for
 * @returns {Promise<{left: number, up: number}>}
 */
async function loadPositionOffset(domain) {
  if (!domain) return DEFAULT_OFFSET;
  
  return new Promise(resolve => {
    chrome.storage.local.get({ floatingButtonPositions: {} }, (items) => {
      const positions = items.floatingButtonPositions || {};
      resolve(positions[domain] || DEFAULT_OFFSET);
    });
  });
}

/**
 * Save position offset for a domain to chrome.storage.local
 * @param {string} domain - The domain to save position for
 * @param {{left: number, up: number}} offset - The offset from default position
 */
function savePositionOffset(domain, offset) {
  if (!domain) return;
  
  chrome.storage.local.get({ floatingButtonPositions: {} }, (items) => {
    const positions = items.floatingButtonPositions || {};
    positions[domain] = offset;
    chrome.storage.local.set({ floatingButtonPositions: positions });
  });
}

/**
 * Add domain to ignored domains list
 * @param {string} domain - The domain to ignore
 * @returns {Promise<void>}
 */
async function addDomainToIgnoreList(domain) {
  if (!domain) return;
  
  return new Promise(resolve => {
    chrome.storage.sync.get({ ignoredDomains: '' }, (items) => {
      let domains = items.ignoredDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
      if (!domains.includes(domain)) {
        domains.push(domain);
        const newValue = domains.join('\n');
        chrome.storage.sync.set({ ignoredDomains: newValue }, resolve);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Creates a floating action button for ExtractMD
 * @param {Object} options - Configuration options
 * @param {Function} options.onClick - Click handler function
 * @param {string} [options.variant='dark'] - Visual variant: 'dark' (glassmorphism) or 'light' (solid white)
 * @param {string} [options.emoji='📝'] - Emoji to display in the button
 * @param {string} [options.id='extractmd-floating-button'] - DOM element ID
 * @param {string} [options.domain] - Current domain for position persistence and ignore functionality
 * @param {boolean} [options.enableDrag=true] - Whether dragging to reposition is enabled
 * @param {boolean} [options.enableDismiss=true] - Whether the dismiss (X) button is enabled
 * @returns {Promise<Object|null>} Button controller with element and state methods
 */
export async function createFloatingButton({
  onClick,
  variant = 'dark',
  emoji = '📝',
  id = 'extractmd-floating-button',
  domain = '',
  enableDrag = true,
  enableDismiss = true
}) {
  // Check if button already exists
  const existing = document.getElementById(id);
  if (existing) {
    return null;
  }

  // Load saved position BEFORE creating the button to avoid flash
  let currentOffset = { ...DEFAULT_OFFSET };
  if (domain) {
    currentOffset = await loadPositionOffset(domain);
  }

  const button = document.createElement('div');
  button.id = id;
  
  // Create inner content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'button-content';
  contentContainer.innerHTML = `<div class="button-emoji">${emoji}</div>`;
  button.appendChild(contentContainer);
  
  // Create dismiss button (hidden by default)
  const dismissBtn = document.createElement('div');
  dismissBtn.className = 'extractmd-dismiss-btn';
  dismissBtn.innerHTML = '×';
  dismissBtn.style.cssText = `
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ef4444;
    color: white;
    font-size: 14px;
    line-height: 18px;
    text-align: center;
    cursor: pointer;
    display: none;
    z-index: 10001;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    font-weight: bold;
  `;
  button.appendChild(dismissBtn);

  // Calculate initial position with saved offset applied
  const initialRight = DEFAULT_RIGHT + currentOffset.left;
  const initialBottom = DEFAULT_BOTTOM + currentOffset.up;

  // Variant-specific styles
  const baseStyles = `
    position: fixed;
    bottom: ${initialBottom}px;
    right: ${initialRight}px;
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
    transition: box-shadow 0.3s ease, opacity 0.3s ease, background 0.3s ease;
    user-select: none;
  `;

  const variantStyles = variant === 'light'
    ? `
      background: rgba(255, 255, 255, 0.95);
      color: #222;
      border: 1px solid #ccc;
      opacity: 1;
    `
    : `
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      opacity: 0.7;
    `;

  button.style.cssText = baseStyles + variantStyles;

  // Hover effects based on variant
  const hoverBg = variant === 'light' ? '#f3f4f6' : 'rgba(255, 255, 255, 0.25)';
  const normalBg = variant === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)';

  // Drag state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let buttonStartRight = initialRight;
  let buttonStartBottom = initialBottom;
  let hasMoved = false;
  let justFinishedDragging = false; // Flag to prevent click after drag
  
  // Hover state for dismiss button
  let hoverTimeout = null;
  let isHovering = false;

  // Mouse down - start potential drag (only if dragging is enabled)
  button.addEventListener('mousedown', (e) => {
    if (!enableDrag) return; // Dragging disabled
    if (e.target === dismissBtn) return; // Don't start drag on dismiss button
    if (button.dataset.processing) return;
    
    isDragging = true;
    hasMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    // Get current position
    const computedStyle = window.getComputedStyle(button);
    buttonStartRight = parseInt(computedStyle.right, 10) || DEFAULT_RIGHT;
    buttonStartBottom = parseInt(computedStyle.bottom, 10) || DEFAULT_BOTTOM;
    
    // Prevent text selection during drag
    e.preventDefault();
    
    // Change cursor
    button.style.cursor = 'grabbing';
    button.style.transition = 'box-shadow 0.3s ease, opacity 0.3s ease, background 0.3s ease';
  });

  // Mouse move - handle drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = dragStartX - e.clientX; // Positive = moved left (increase right)
    const deltaY = dragStartY - e.clientY; // Positive = moved up (increase bottom)
    
    // Check if we've moved enough to consider it a drag
    if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
      hasMoved = true;
    }
    
    // Update position
    const newRight = Math.max(0, Math.min(window.innerWidth - 60, buttonStartRight + deltaX));
    const newBottom = Math.max(0, Math.min(window.innerHeight - 60, buttonStartBottom + deltaY));
    
    button.style.right = `${newRight}px`;
    button.style.bottom = `${newBottom}px`;
  };

  // Mouse up - end drag or trigger click
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    isDragging = false;
    button.style.cursor = 'pointer';
    
    if (hasMoved) {
      // Set flag to prevent the click event that follows mouseup
      justFinishedDragging = true;
      
      // Reset the flag after a short delay (after click event would have fired)
      setTimeout(() => {
        justFinishedDragging = false;
      }, 10);
      
      if (domain) {
        // Calculate and save the new offset
        const computedStyle = window.getComputedStyle(button);
        const currentRight = parseInt(computedStyle.right, 10) || DEFAULT_RIGHT;
        const currentBottom = parseInt(computedStyle.bottom, 10) || DEFAULT_BOTTOM;
        
        currentOffset = {
          left: currentRight - DEFAULT_RIGHT,
          up: currentBottom - DEFAULT_BOTTOM
        };
        
        savePositionOffset(domain, currentOffset);
      }
    }
    
    hasMoved = false;
  };

  // Add document-level listeners for drag
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // Click handler - only trigger if not dragging
  button.addEventListener('click', (e) => {
    if (e.target === dismissBtn) return; // Don't trigger on dismiss button
    if (button.dataset.processing) return;
    
    // If we just finished dragging, don't trigger click
    if (isDragging || justFinishedDragging) return;
    
    onClick();
  });

  // Hover effects
  button.addEventListener('mouseenter', () => {
    if (!button.dataset.processing) {
      isHovering = true;
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      button.style.opacity = '1';
      button.style.background = hoverBg;
      
      // Start timer to show dismiss button (only if dismiss is enabled)
      if (domain && enableDismiss) {
        hoverTimeout = setTimeout(() => {
          if (isHovering && !isDragging) {
            dismissBtn.style.display = 'block';
          }
        }, HOVER_DELAY_MS);
      }
    }
  });

  button.addEventListener('mouseleave', () => {
    isHovering = false;
    
    // Clear hover timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    // Hide dismiss button
    dismissBtn.style.display = 'none';
    
    if (!button.dataset.processing) {
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      button.style.opacity = variant === 'light' ? '1' : '0.7';
      button.style.background = normalBg;
    }
  });

  // Dismiss button click handler
  dismissBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    if (domain) {
      await addDomainToIgnoreList(domain);
      
      // Set global flag to prevent mutation observers from recreating the button
      window.__extractmd_domain_ignored = true;
      
      // Clear the copy function
      window.copyExtractMD = null;
      
      // Remove the button
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
      
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  });

  // Controller object with state methods
  const controller = {
    element: button,

    /**
     * Set button to loading state
     */
    setLoading() {
      button.dataset.processing = 'true';
      contentContainer.innerHTML = `<div class="button-emoji">⏳</div>`;
      button.style.background = 'rgba(255, 193, 7, 0.8)';
      button.style.border = '1px solid rgba(255, 193, 7, 0.3)';
      button.style.cursor = 'not-allowed';
      button.style.fontSize = '20px';
      button.style.opacity = '1';
      dismissBtn.style.display = 'none';
    },

    /**
     * Set button to success state
     */
    setSuccess() {
      contentContainer.innerHTML = `<div class="button-emoji">✅</div>`;
      button.style.background = 'rgba(76, 175, 80, 0.8)';
      button.style.border = '1px solid rgba(76, 175, 80, 0.3)';
      button.style.fontSize = '24px';
      button.style.opacity = '1';
    },

    /**
     * Set button to error state
     */
    setError() {
      contentContainer.innerHTML = `<div class="button-emoji">❌</div>`;
      button.style.background = 'rgba(244, 67, 54, 0.8)';
      button.style.border = '1px solid rgba(244, 67, 54, 0.3)';
      button.style.fontSize = '24px';
      button.style.opacity = '1';
    },

    /**
     * Reset button to normal state
     */
    setNormal() {
      delete button.dataset.processing;
      contentContainer.innerHTML = `<div class="button-emoji">${emoji}</div>`;
      button.style.background = normalBg;
      button.style.border = variant === 'light' ? '1px solid #ccc' : '1px solid rgba(255, 255, 255, 0.2)';
      button.style.cursor = 'pointer';
      button.style.fontSize = '24px';
      button.style.opacity = variant === 'light' ? '1' : '0.7';
    },

    /**
     * Show the button
     */
    show() {
      button.style.display = 'flex';
    },

    /**
     * Hide the button
     */
    hide() {
      button.style.display = 'none';
    },

    /**
     * Remove button from DOM and clean up event listeners
     */
    remove() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
    },

    /**
     * Append button to DOM
     * @param {HTMLElement} [parent=document.body] - Parent element
     */
    appendTo(parent = document.body) {
      parent.appendChild(button);
    }
  };

  return controller;
}
