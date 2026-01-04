import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeAccordion } from '../../../../extension/popup/accordion.js';

describe('popup/accordion module', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <button class="collapsible">Section 1</button>
      <div class="container">Content 1</div>
      <button class="collapsible">Section 2</button>
      <div class="container">Content 2</div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('initializeAccordion', () => {
    it('sets up click handlers on collapsible buttons', () => {
      initializeAccordion();

      const buttons = document.querySelectorAll('.collapsible');
      const containers = document.querySelectorAll('.container');

      // Click first button
      buttons[0].click();

      expect(buttons[0].classList.contains('active')).toBe(true);
      expect(containers[0].classList.contains('open')).toBe(true);
    });

    it('toggles on second click', () => {
      initializeAccordion();

      const button = document.querySelector('.collapsible');
      const content = document.querySelector('.container');

      // First click - open
      button.click();
      expect(button.classList.contains('active')).toBe(true);
      expect(content.classList.contains('open')).toBe(true);

      // Second click - close
      button.click();
      expect(button.classList.contains('active')).toBe(false);
      expect(content.classList.contains('open')).toBe(false);
    });

    it('allows multiple sections to be open', () => {
      initializeAccordion();

      const buttons = document.querySelectorAll('.collapsible');
      const containers = document.querySelectorAll('.container');

      buttons[0].click();
      buttons[1].click();

      expect(buttons[0].classList.contains('active')).toBe(true);
      expect(buttons[1].classList.contains('active')).toBe(true);
      expect(containers[0].classList.contains('open')).toBe(true);
      expect(containers[1].classList.contains('open')).toBe(true);
    });
  });
});
