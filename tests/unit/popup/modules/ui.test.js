import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showStatus } from '../../../../extension/popup/ui.js';

describe('popup/ui module', () => {
  describe('showStatus', () => {
    let statusDiv;

    beforeEach(() => {
      statusDiv = document.createElement('div');
      statusDiv.id = 'status';
      document.body.appendChild(statusDiv);
      vi.useFakeTimers();
    });

    afterEach(() => {
      document.body.innerHTML = '';
      vi.useRealTimers();
    });

    it('displays success message', () => {
      showStatus('Success!', 'success');
      
      expect(statusDiv.textContent).toBe('Success!');
      expect(statusDiv.className).toBe('status-toast visible success');
    });

    it('displays error message', () => {
      showStatus('Error!', 'error');
      
      expect(statusDiv.textContent).toBe('Error!');
      expect(statusDiv.className).toBe('status-toast visible error');
    });

    it('hides after 3 seconds by removing visible class', () => {
      showStatus('Test', 'success');
      
      expect(statusDiv.classList.contains('visible')).toBe(true);
      
      vi.advanceTimersByTime(3000);
      
      expect(statusDiv.classList.contains('visible')).toBe(false);
    });

    it('handles missing status element gracefully', () => {
      document.body.innerHTML = '';
      
      // Should not throw
      expect(() => showStatus('Test', 'success')).not.toThrow();
    });
  });
});
