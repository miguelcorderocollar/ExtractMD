// Shared Floating Button component for ExtractMD
// Used by YouTube, Hacker News, and Article extractors

/**
 * Creates a floating action button for ExtractMD
 * @param {Object} options - Configuration options
 * @param {Function} options.onClick - Click handler function
 * @param {string} [options.variant='dark'] - Visual variant: 'dark' (glassmorphism) or 'light' (solid white)
 * @param {string} [options.emoji='📝'] - Emoji to display in the button
 * @param {string} [options.id='yt-transcript-floating-button'] - DOM element ID
 * @returns {Object} Button controller with element and state methods
 */
export function createFloatingButton({
  onClick,
  variant = 'dark',
  emoji = '📝',
  id = 'yt-transcript-floating-button'
}) {
  // Check if button already exists
  const existing = document.getElementById(id);
  if (existing) {
    return null;
  }

  const button = document.createElement('div');
  button.id = id;
  button.innerHTML = `<div class="button-emoji">${emoji}</div>`;

  // Variant-specific styles
  const baseStyles = `
    position: fixed;
    bottom: 20px;
    right: 20px;
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

  button.addEventListener('mouseenter', () => {
    if (!button.dataset.processing) {
      button.style.transform = 'translateY(-2px) scale(1.1)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      button.style.opacity = '1';
      button.style.background = hoverBg;
    }
  });

  button.addEventListener('mouseleave', () => {
    if (!button.dataset.processing) {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      button.style.opacity = variant === 'light' ? '1' : '0.7';
      button.style.background = normalBg;
    }
  });

  button.addEventListener('click', onClick);

  // Controller object with state methods
  const controller = {
    element: button,

    /**
     * Set button to loading state
     */
    setLoading() {
      button.dataset.processing = 'true';
      button.innerHTML = `<div class="button-emoji">⏳</div>`;
      button.style.background = 'rgba(255, 193, 7, 0.8)';
      button.style.border = '1px solid rgba(255, 193, 7, 0.3)';
      button.style.cursor = 'not-allowed';
      button.style.fontSize = '20px';
      button.style.opacity = '1';
    },

    /**
     * Set button to success state
     */
    setSuccess() {
      button.innerHTML = `<div class="button-emoji">✅</div>`;
      button.style.background = 'rgba(76, 175, 80, 0.8)';
      button.style.border = '1px solid rgba(76, 175, 80, 0.3)';
      button.style.fontSize = '24px';
      button.style.opacity = '1';
    },

    /**
     * Set button to error state
     */
    setError() {
      button.innerHTML = `<div class="button-emoji">❌</div>`;
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
      button.innerHTML = `<div class="button-emoji">${emoji}</div>`;
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
     * Remove button from DOM
     */
    remove() {
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

