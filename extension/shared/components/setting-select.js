/**
 * <setting-select> Web Component
 * A dropdown select setting with label and description
 * 
 * Options can be provided in two ways:
 * 1. As child elements: <option value="a">A</option>
 * 2. Via setOptions() method after creation
 * 
 * @example
 * <setting-select
 *   setting-id="universalContentMode"
 *   label="Content Mode"
 *   description="How to detect the main content area"
 *   value="auto">
 *   <option value="auto">Auto (Smart Detection)</option>
 *   <option value="main">Main Element Only</option>
 *   <option value="full">Full Page</option>
 * </setting-select>
 * 
 * @fires change - When the select value changes
 */
export class SettingSelect extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled', 'label', 'description'];
  }

  constructor() {
    super();
    this._options = [];
    this._rendered = false;
  }

  connectedCallback() {
    // Capture options immediately if present
    this._captureOptions();
    
    if (this._options.length > 0) {
      this.render();
      this.setupEventListeners();
    } else {
      // Wait for children to be parsed (needed for innerHTML usage)
      requestAnimationFrame(() => {
        this._captureOptions();
        this.render();
        this.setupEventListeners();
      });
    }
  }

  disconnectedCallback() {
    const select = this.querySelector('select');
    if (select) {
      select.removeEventListener('change', this._handleChange);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (!this._rendered) return;

    if (name === 'value') {
      const select = this.querySelector('select');
      if (select) {
        select.value = newValue;
      }
    } else if (name === 'disabled') {
      const select = this.querySelector('select');
      if (select) {
        select.disabled = this.hasAttribute('disabled');
      }
    } else {
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

  get value() {
    const select = this.querySelector('select');
    return select ? select.value : this.getAttribute('value') || '';
  }

  set value(val) {
    this.setAttribute('value', val);
    const select = this.querySelector('select');
    if (select) {
      select.value = val;
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

  _captureOptions() {
    // Capture options from initial light DOM before render
    const optionElements = this.querySelectorAll(':scope > option');
    if (optionElements.length > 0) {
      const currentValue = this.getAttribute('value') || '';
      this._options = Array.from(optionElements).map(opt => ({
        value: opt.value,
        text: opt.textContent,
        selected: opt.value === currentValue
      }));
    }
  }

  render() {
    const settingId = this.settingId;
    const label = this.label;
    const description = this.description;
    const currentValue = this.getAttribute('value') || '';
    const disabled = this.disabled;

    const optionsHtml = this._options.map(opt => 
      `<option value="${opt.value}" ${opt.value === currentValue ? 'selected' : ''}>${opt.text}</option>`
    ).join('');

    this.innerHTML = `
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">${label}</span>
          ${description ? `<span class="setting-desc">${description}</span>` : ''}
        </div>
        <select id="${settingId}" class="input-select" ${disabled ? 'disabled' : ''}>
          ${optionsHtml}
        </select>
      </div>
    `;
    
    this._rendered = true;
  }

  setupEventListeners() {
    const select = this.querySelector('select');
    if (select) {
      this._handleChange = (e) => {
        // Stop the native event from bubbling to prevent duplicate events
        e.stopPropagation();
        
        this.setAttribute('value', e.target.value);
        
        this.dispatchEvent(new CustomEvent('change', {
          bubbles: true,
          composed: true,
          detail: {
            settingId: this.settingId,
            value: e.target.value
          }
        }));
      };
      select.addEventListener('change', this._handleChange);
    }
  }

  /**
   * Get the select element for direct access
   * @returns {HTMLSelectElement|null}
   */
  getSelect() {
    return this.querySelector('select');
  }

  /**
   * Update options dynamically
   * @param {Array<{value: string, text: string}>} options
   */
  setOptions(options) {
    this._options = options.map(opt => ({
      value: opt.value,
      text: opt.text,
      selected: opt.value === this.getAttribute('value')
    }));
    this.render();
    this.setupEventListeners();
  }
}

// Register the custom element
if (!customElements.get('setting-select')) {
  customElements.define('setting-select', SettingSelect);
}
