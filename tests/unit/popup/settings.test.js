import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULTS } from '../../../extension/popup.js';

describe('popup.js - DEFAULTS', () => {
  it('has all required settings', () => {
    expect(DEFAULTS).toHaveProperty('includeTimestamps');
    expect(DEFAULTS).toHaveProperty('jumpToDomain');
    expect(DEFAULTS).toHaveProperty('enableYouTubeIntegration');
    expect(DEFAULTS).toHaveProperty('enableHackerNewsIntegration');
    expect(DEFAULTS).toHaveProperty('enableArticleIntegration');
  });

  it('has proper default values', () => {
    expect(DEFAULTS.includeTimestamps).toBe(true);
    expect(DEFAULTS.jumpToDomain).toBe(false);
    expect(DEFAULTS.downloadInsteadOfCopy).toBe(false);
    expect(DEFAULTS.enableUsageKpi).toBe(true);
  });
});

