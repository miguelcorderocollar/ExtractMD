import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateDomains } from '../../../../extension/popup/domainIgnore.js';

describe('popup/domainIgnore module', () => {
  describe('validateDomains', () => {
    it('validates valid domain names', () => {
      expect(validateDomains('example.com')).toBe(true);
      expect(validateDomains('sub.example.com')).toBe(true);
      expect(validateDomains('my-site.co.uk')).toBe(true);
    });

    it('validates localhost', () => {
      expect(validateDomains('localhost')).toBe(true);
    });

    it('validates IP addresses', () => {
      expect(validateDomains('192.168.1.1')).toBe(true);
      expect(validateDomains('127.0.0.1')).toBe(true);
    });

    it('validates multiple domains (one per line)', () => {
      expect(validateDomains('example.com\ngoogle.com\nlocalhost')).toBe(true);
    });

    it('rejects invalid domains', () => {
      expect(validateDomains('not a domain')).toBe(false);
      expect(validateDomains('http://example.com')).toBe(false);
      expect(validateDomains('-invalid.com')).toBe(false);
    });

    it('accepts empty string', () => {
      expect(validateDomains('')).toBe(true);
    });

    it('handles whitespace correctly', () => {
      expect(validateDomains('  example.com  ')).toBe(true);
      expect(validateDomains('example.com\n\ngoogle.com')).toBe(true);
    });

    it('rejects if any domain is invalid', () => {
      expect(validateDomains('example.com\ninvalid domain\ngoogle.com')).toBe(false);
    });
  });
});
