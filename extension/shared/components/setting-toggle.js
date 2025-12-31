/**
 * <setting-toggle> Web Component
 * A toggle switch setting with label and description
 * 
 * @example
 * <setting-toggle
 *   setting-id="includeTimestamps"
 *   label="Include Timestamps"
 *   description="Add time markers to transcript lines"
 *   checked>
 * </setting-toggle>
 * 
 * @fires change - When the toggle value changes
 */
export class SettingToggle extends HTMLElement {
  static get observedAttributes() {
    return ['checked', 'disabled', 'label', 'description'];
  }

  constructor() {
    super();
    this._internals = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    // Clean up event listeners
    const input = this.querySelector('input');
    if (input) {
      input.removeEventListener('change', this._handleChange);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'checked') {
      const input = this.querySelector('input');
      if (input) {
        input.checked = this.hasAttribute('checked');
      }
    } else if (name === 'disabled') {
      const input = this.querySelector('input');
      if (input) {
        input.disabled = this.hasAttribute('disabled');
      }
    } else {
      // Re-render for label/description changes
      this.render();
      this.setupEventListeners();
    }
  }

  get settingId() {
    return this.getAttribute('setting-id') || this.id || '';
  }

  get label() {
    return this.getAttribute('label') || '';
  }

  get description() {
    return this.getAttribute('description') || '';
  }

  get checked() {
    return this.hasAttribute('checked');
  }

  set checked(value) {
    if (value) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
    const input = this.querySelector('input');
    if (input) {
      input.checked = value;
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  render() {
    const settingId = this.settingId;
    const label = this.label;
    const description = this.description;
    const checked = this.checked;
    const disabled = this.disabled;

    this.innerHTML = `
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">${label}</span>
          ${description ? `<span class="setting-desc">${description}</span>` : ''}
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="${settingId}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  }

  setupEventListeners() {
    const input = this.querySelector('input');
    if (input) {
      this._handleChange = (e) => {
        // Stop the native event from bubbling to prevent duplicate events
        e.stopPropagation();
        
        // Update attribute to reflect state
        if (e.target.checked) {
          this.setAttribute('checked', '');
        } else {
          this.removeAttribute('checked');
        }
        
        // Dispatch custom event with setting info
        this.dispatchEvent(new CustomEvent('change', {
          bubbles: true,
          composed: true,
          detail: {
            settingId: this.settingId,
            checked: e.target.checked,
            value: e.target.checked
          }
        }));
      };
      input.addEventListener('change', this._handleChange);
    }
  }

  /**
   * Get the input element for direct access
   * @returns {HTMLInputElement|null}
   */
  getInput() {
    return this.querySelector('input');
  }
}

// Register the custom element
if (!customElements.get('setting-toggle')) {
  customElements.define('setting-toggle', SettingToggle);
}

