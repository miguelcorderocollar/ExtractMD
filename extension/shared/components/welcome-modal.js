/**
 * Welcome Modal Component for ExtractMD
 *
 * Displays a 3-step onboarding flow for new users:
 * 1. Welcome - Introduction to ExtractMD
 * 2. Integrations - Choose which platforms to enable
 * 3. Complete - Success and next steps
 */

import { getSettings, saveSetting } from '../storage.js';

export class WelcomeModal extends HTMLElement {
  constructor() {
    super();
    this.currentStep = 0;
    this.steps = ['welcome', 'integrations', 'complete'];
    this.integrations = {
      enableYouTubeIntegration: true,
      enableHackerNewsIntegration: true,
      enableArticleIntegration: true,
      enableUniversalIntegration: true,
    };
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.checkAndShow();
  }

  async checkAndShow() {
    const { welcomeCompleted } = await getSettings(['welcomeCompleted']);
    if (!welcomeCompleted) {
      this.show();
    }
  }

  show() {
    this.style.display = 'flex';
    // Reset to first step when shown
    this.currentStep = 0;
    this.render();
  }

  hide() {
    this.style.display = 'none';
  }

  render() {
    this.innerHTML = `
      <div class="welcome-overlay">
        <div class="welcome-modal">
          <div class="welcome-header">
            <div class="progress-dots">
              ${this.steps
                .map(
                  (_, index) =>
                    `<div class="progress-dot ${index === this.currentStep ? 'active' : ''}"></div>`
                )
                .join('')}
            </div>
          </div>

          <div class="welcome-content">
            ${this.renderStep()}
          </div>

          <div class="welcome-footer">
            ${this.renderFooter()}
          </div>
        </div>
      </div>
    `;
  }

  renderStep() {
    switch (this.currentStep) {
      case 0:
        return this.renderWelcomeStep();
      case 1:
        return this.renderIntegrationsStep();
      case 2:
        return this.renderCompleteStep();
      default:
        return '';
    }
  }

  renderWelcomeStep() {
    return `
      <div class="welcome-step">
        <div class="welcome-logo">
          <img src="images/logo.svg" alt="ExtractMD" class="logo-image">
          <h1 class="logo-text">ExtractMD</h1>
        </div>

        <div class="welcome-intro">
          <h2>Welcome to ExtractMD!</h2>
          <p>Extract content from web pages as clean Markdown. Perfect for feeding content to LLMs, note-taking, or archiving.</p>

          <div class="features-list">
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
              <span>YouTube transcripts and videos</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="3"/>
                <path d="M7 6l5 7v5M17 6l-5 7"/>
              </svg>
              <span>Hacker News discussions</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>Articles and blog posts</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderIntegrationsStep() {
    return `
      <div class="welcome-step">
        <h2>Choose Your Integrations</h2>
        <p>Select which platforms you'd like ExtractMD to work with:</p>

        <div class="integrations-grid">
          <div class="integration-card" data-integration="enableYouTubeIntegration">
            <div class="integration-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </div>
            <div class="integration-info">
              <h3>YouTube</h3>
              <p>Extract transcripts from videos</p>
            </div>
            <label class="integration-toggle">
              <input type="checkbox" checked data-integration="enableYouTubeIntegration">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="integration-card" data-integration="enableHackerNewsIntegration">
            <div class="integration-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="3"/>
                <path d="M7 6l5 7v5M17 6l-5 7"/>
              </svg>
            </div>
            <div class="integration-info">
              <h3>Hacker News</h3>
              <p>Extract comments and discussions</p>
            </div>
            <label class="integration-toggle">
              <input type="checkbox" checked data-integration="enableHackerNewsIntegration">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="integration-card" data-integration="enableArticleIntegration">
            <div class="integration-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="integration-info">
              <h3>Articles</h3>
              <p>Extract content from blog posts</p>
            </div>
            <label class="integration-toggle">
              <input type="checkbox" checked data-integration="enableArticleIntegration">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="integration-card" data-integration="enableUniversalIntegration">
            <div class="integration-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div class="integration-info">
              <h3>Universal</h3>
              <p>Fallback extraction for any site</p>
            </div>
            <label class="integration-toggle">
              <input type="checkbox" checked data-integration="enableUniversalIntegration">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  renderCompleteStep() {
    return `
      <div class="welcome-step">
        <div class="complete-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>

        <h2>All Set!</h2>
        <p>ExtractMD is now ready to use. Your floating button will appear on supported websites.</p>

        <div class="keyboard-shortcuts">
          <h3>Quick Start</h3>
          <div class="shortcut-item">
            <kbd>Ctrl+Shift+E</kbd>
            <span>Copy content as Markdown</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl+Shift+H</kbd>
            <span>Hide button on this domain</span>
          </div>
        </div>
      </div>
    `;
  }

  renderFooter() {
    const isLastStep = this.currentStep === this.steps.length - 1;
    const isFirstStep = this.currentStep === 0;

    return `
      <div class="welcome-actions">
        ${
          isFirstStep
            ? `
          <button class="btn btn-secondary btn-sm" data-action="skip">Skip</button>
          <button class="btn btn-primary" data-action="next">Let's Get Started</button>
        `
            : isLastStep
              ? `
          <button class="btn btn-secondary" data-action="customize">Customize More Settings</button>
          <button class="btn btn-primary" data-action="start">Start Using ExtractMD</button>
        `
              : `
          <button class="btn btn-secondary" data-action="back">Back</button>
          <button class="btn btn-primary" data-action="next">Continue</button>
        `
        }
      </div>
    `;
  }

  attachEventListeners() {
    this.addEventListener('click', this.handleClick.bind(this));
    this.addEventListener('change', this.handleToggleChange.bind(this));
  }

  handleClick(e) {
    const action = e.target.dataset.action;

    switch (action) {
      case 'skip':
        this.skip();
        break;
      case 'next':
        this.nextStep();
        break;
      case 'back':
        this.prevStep();
        break;
      case 'customize':
        this.complete();
        break;
      case 'start':
        this.startUsing();
        break;
    }

    // Close modal when clicking overlay
    if (e.target.classList.contains('welcome-overlay')) {
      this.skip();
    }
  }

  handleToggleChange(e) {
    const integration = e.target.dataset.integration;
    if (integration && Object.prototype.hasOwnProperty.call(this.integrations, integration)) {
      this.integrations[integration] = e.target.checked;
    }
  }

  async nextStep() {
    if (this.currentStep === 1) {
      // Save integration settings before moving to complete step
      await this.saveIntegrationSettings();
    }

    this.currentStep = Math.min(this.currentStep + 1, this.steps.length - 1);
    this.render();
  }

  prevStep() {
    this.currentStep = Math.max(this.currentStep - 1, 0);
    this.render();
  }

  async skip() {
    await saveSetting('welcomeCompleted', true);
    this.hide();
  }

  async complete() {
    await saveSetting('welcomeCompleted', true);
    this.hide();
  }

  async startUsing() {
    await saveSetting('welcomeCompleted', true);
    this.hide();
    // Just close the modal and leave user in settings page
  }

  async saveIntegrationSettings() {
    for (const [key, value] of Object.entries(this.integrations)) {
      await saveSetting(key, value);
    }
  }
}

customElements.define('welcome-modal', WelcomeModal);
