import { describe, expect, it } from 'vitest';
import {
  API_SOURCE_KEYS,
  API_SOURCE_VARIABLES,
  getApiVariablesForSources,
} from '../../../../extension/shared/api/variables.js';

describe('shared/api/variables', () => {
  it('defines variables for all supported sources', () => {
    expect(API_SOURCE_KEYS).toEqual([
      'x',
      'youtube',
      'hackernews',
      'articles',
      'universal',
      'linkedin_jobs',
    ]);
    API_SOURCE_KEYS.forEach((source) => {
      expect(API_SOURCE_VARIABLES[source]).toBeDefined();
      expect(API_SOURCE_VARIABLES[source].length).toBeGreaterThan(0);
    });
  });

  it('includes integration-specific variable sets for non-X sources', () => {
    expect(API_SOURCE_VARIABLES.youtube).toEqual(
      expect.arrayContaining(['channel_name', 'channel_url'])
    );
    expect(API_SOURCE_VARIABLES.hackernews).toEqual(expect.arrayContaining(['site', 'points']));
    expect(API_SOURCE_VARIABLES.articles).toEqual(
      expect.arrayContaining(['excerpt', 'article_count'])
    );
    expect(API_SOURCE_VARIABLES.universal).toEqual(
      expect.arrayContaining(['domain', 'word_count'])
    );
  });

  it('collects and de-duplicates variables from selected sources', () => {
    const variables = getApiVariablesForSources({
      x: true,
      youtube: true,
      hackernews: false,
      articles: false,
      universal: false,
    });

    expect(variables).toEqual(
      expect.arrayContaining(['author', 'channel_name', 'reposts', 'title'])
    );
    expect(new Set(variables).size).toBe(variables.length);
  });

  it('returns an empty list when no sources are enabled', () => {
    expect(getApiVariablesForSources({})).toEqual([]);
  });
});
