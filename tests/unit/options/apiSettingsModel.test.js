import { describe, expect, it } from 'vitest';
import {
  createInitialProfile,
  validateProfileDraft,
} from '../../../extension/options/apiSettings/model.js';
import { createDefaultApiProfile } from '../../../extension/shared/api/constants.js';

describe('options/apiSettings model', () => {
  it('creates unique integration names for new profiles', () => {
    const profile = createInitialProfile({
      profiles: [
        createDefaultApiProfile({ id: 'integration-1', name: 'Integration 1' }),
        createDefaultApiProfile({ id: 'integration-2', name: 'Integration 2' }),
      ],
      createDefaultApiProfile,
      slugifyId: (value) => value.toLowerCase().replace(/\s+/g, '-'),
    });

    expect(profile.name).toBe('Integration 3');
    expect(profile.id).toBe('integration-3');
  });

  it('rejects duplicate generated integration ids', () => {
    const draft = createDefaultApiProfile({
      id: 'notion-posts',
      name: 'Notion Posts',
      enabled: true,
      url: 'https://example.test/webhook',
      method: 'POST',
      integrationAvailability: { x: true },
    });

    expect(() =>
      validateProfileDraft({
        draft,
        previousProfileId: '',
        profiles: [
          createDefaultApiProfile({
            id: 'notion-posts',
            name: 'Notion Posts Existing',
            enabled: true,
          }),
        ],
        supportedMethods: new Set(['POST', 'PUT', 'PATCH']),
        sourceKeys: ['x', 'youtube', 'hackernews', 'articles', 'universal'],
        parseTemplateObject: () => ({}),
      })
    ).toThrow(/id 'notion-posts' already exists/i);
  });
});
