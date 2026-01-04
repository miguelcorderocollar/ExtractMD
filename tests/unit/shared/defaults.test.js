import { describe, it, expect } from 'vitest';
import { DEFAULTS, SETTING_SCHEMA } from '../../../extension/shared/defaults.js';

describe('shared/defaults', () => {
  it('exports DEFAULTS object with all expected keys', () => {
    expect(DEFAULTS).toBeDefined();
    expect(typeof DEFAULTS).toBe('object');

    // YouTube settings
    expect(DEFAULTS.includeTimestamps).toBe(true);
    expect(DEFAULTS.addTitleToTranscript).toBe(true);
    expect(DEFAULTS.addChannelToTranscript).toBe(true);
    expect(DEFAULTS.addUrlToTranscript).toBe(true);

    // HN Comments settings
    expect(DEFAULTS.hnIncludeAuthor).toBe(true);
    expect(DEFAULTS.hnIncludeTime).toBe(true);
    expect(DEFAULTS.hnIncludeReplies).toBe(true);
    expect(DEFAULTS.hnIncludeUrl).toBe(true);
    expect(DEFAULTS.hnIncludeItemText).toBe(true);

    // HN News settings
    expect(DEFAULTS.hnNewsIncludeTitle).toBe(true);
    expect(DEFAULTS.hnNewsIncludeUrl).toBe(true);
    expect(DEFAULTS.hnNewsIncludeSite).toBe(true);
    expect(DEFAULTS.hnNewsIncludePoints).toBe(true);
    expect(DEFAULTS.hnNewsIncludeAuthor).toBe(true);
    expect(DEFAULTS.hnNewsIncludeTime).toBe(true);
    expect(DEFAULTS.hnNewsIncludeComments).toBe(true);

    // Article settings
    expect(DEFAULTS.articleExporterIncludeImages).toBe(true);
    expect(DEFAULTS.articleExporterOnlyLongest).toBe(false);
    expect(DEFAULTS.articleExporterShowInfo).toBe(true);
    expect(DEFAULTS.articleExporterIncludeUrl).toBe(true);

    // General settings
    expect(DEFAULTS.globalEnabled).toBe(true);
    expect(DEFAULTS.jumpToDomain).toBe(false);
    expect(DEFAULTS.jumpToDomainUrl).toBe('https://chat.openai.com/');
    expect(DEFAULTS.enableUsageKpi).toBe(true);
    expect(DEFAULTS.closeTabAfterExtraction).toBe(false);
    expect(DEFAULTS.downloadInsteadOfCopy).toBe(false);
    expect(DEFAULTS.downloadIfTokensExceed).toBe(0);
    expect(DEFAULTS.showTokenCountInNotification).toBe(false);
    expect(DEFAULTS.ignoredDomains).toBe('');

    // Integration toggles
    expect(DEFAULTS.enableYouTubeIntegration).toBe(true);
    expect(DEFAULTS.enableHackerNewsIntegration).toBe(true);
    expect(DEFAULTS.enableArticleIntegration).toBe(true);
  });

  it('exports SETTING_SCHEMA with matching keys', () => {
    expect(SETTING_SCHEMA).toBeDefined();
    expect(typeof SETTING_SCHEMA).toBe('object');

    // Every key in DEFAULTS should have a schema entry
    for (const key of Object.keys(DEFAULTS)) {
      expect(SETTING_SCHEMA[key]).toBeDefined();
      expect(['boolean', 'string', 'number']).toContain(SETTING_SCHEMA[key]);
    }
  });

  it('schema types match actual default value types', () => {
    for (const [key, schemaType] of Object.entries(SETTING_SCHEMA)) {
      const value = DEFAULTS[key];
      expect(typeof value).toBe(schemaType);
    }
  });
});
