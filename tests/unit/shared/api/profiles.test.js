import { describe, expect, it } from 'vitest';
import {
  getActiveApiProfile,
  mergeApiVariables,
  parseApiProfilesJson,
} from '../../../../extension/shared/api/profiles.js';

describe('shared/api/profiles', () => {
  it('returns default profile when json is empty', () => {
    const profiles = parseApiProfilesJson('');
    expect(profiles).toHaveLength(1);
    expect(profiles[0].id).toBe('default');
  });

  it('selects active profile by id', () => {
    const profile = getActiveApiProfile({
      apiProfilesJson: JSON.stringify([
        { id: 'default', name: 'Default', enabled: false },
        { id: 'custom', name: 'Custom', enabled: true, method: 'PUT', url: 'https://example.test' },
      ]),
      apiActiveProfileId: 'custom',
    });

    expect(profile.id).toBe('custom');
    expect(profile.method).toBe('PUT');
    expect(profile.url).toBe('https://example.test');
  });

  it('merges base and secret variables', () => {
    const merged = mergeApiVariables({ author: 'Dev', likes: '9' }, { secret_api_token: 'abc' });

    expect(merged).toEqual({
      author: 'Dev',
      likes: '9',
      secret_api_token: 'abc',
    });
  });
});
