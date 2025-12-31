import { describe, it, expect } from 'vitest';
// Note: these need to be exported from popup.js for testing
// Since popup.js uses inline functions inside DOMContentLoaded, 
// we'll create a simplified test that tests the logic directly

describe('domain validation', () => {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^localhost$|^(?:\d{1,3}\.){3}\d{1,3}$/i;

  function validateDomains(text) {
    const domains = text.split('\n').map(d => d.trim()).filter(d => d.length > 0);
    for (const domain of domains) {
      if (!domainRegex.test(domain)) return false;
    }
    return true;
  }

  it('validates correct domain names', () => {
    expect(validateDomains('example.com')).toBe(true);
    expect(validateDomains('subdomain.example.com')).toBe(true);
    expect(validateDomains('my-site.co.uk')).toBe(true);
  });

  it('validates localhost', () => {
    expect(validateDomains('localhost')).toBe(true);
  });

  it('validates IP addresses', () => {
    expect(validateDomains('127.0.0.1')).toBe(true);
    expect(validateDomains('192.168.1.1')).toBe(true);
  });

  it('rejects invalid domains', () => {
    expect(validateDomains('not a domain')).toBe(false);
    expect(validateDomains('http://example.com')).toBe(false);
    expect(validateDomains('example_site.com')).toBe(false);
  });

  it('validates multiple domains', () => {
    expect(validateDomains('example.com\nlocalhost\n192.168.1.1')).toBe(true);
    expect(validateDomains('example.com\ninvalid domain\nlocalhost')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(validateDomains('')).toBe(true);
    expect(validateDomains('\n\n')).toBe(true);
  });
});

