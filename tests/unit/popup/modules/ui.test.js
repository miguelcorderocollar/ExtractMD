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
      expect(statusDiv.className).toBe('status success');
      expect(statusDiv.style.display).toBe('block');
    });

    it('displays error message', () => {
      showStatus('Error!', 'error');
      
      expect(statusDiv.textContent).toBe('Error!');
      expect(statusDiv.className).toBe('status error');
      expect(statusDiv.style.display).toBe('block');
    });

    it('hides after 3 seconds', () => {
      showStatus('Test', 'success');
      
      expect(statusDiv.style.display).toBe('block');
      
      vi.advanceTimersByTime(3000);
      
      expect(statusDiv.style.display).toBe('none');
    });

    it('handles missing status element gracefully', () => {
      document.body.innerHTML = '';
      
      // Should not throw
      expect(() => showStatus('Test', 'success')).not.toThrow();
    });
  });
});

