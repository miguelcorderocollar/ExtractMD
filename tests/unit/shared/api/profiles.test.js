import { describe, expect, it } from 'vitest';
import {
  getApiProfileById,
  getActiveApiProfile,
  getEnabledApiProfilesForIntegration,
  isLegacyApiProfilesConfig,
  mergeApiVariables,
  parseApiProfilesJson,
} from '../../../../extension/shared/api/profiles.js';

describe('shared/api/profiles', () => {
  it('returns empty profile list when json is empty', () => {
    const profiles = parseApiProfilesJson('');
    expect(profiles).toHaveLength(0);
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

  it('returns enabled profiles for integration', () => {
    const profiles = getEnabledApiProfilesForIntegration({
      apiProfilesJson: JSON.stringify([
        {
          id: 'x-enabled',
          name: 'X Enabled',
          enabled: true,
          version: 2,
          integrationAvailability: { x: true, youtube: false },
        },
        {
          id: 'x-disabled',
          name: 'X Disabled',
          enabled: false,
          version: 2,
          integrationAvailability: { x: true, youtube: false },
        },
        {
          id: 'yt-enabled',
          name: 'YT Enabled',
          enabled: true,
          version: 2,
          integrationAvailability: { x: false, youtube: true },
        },
      ]),
      integration: 'x',
    });

    expect(profiles).toHaveLength(1);
    expect(profiles[0].id).toBe('x-enabled');
  });

  it('finds profile by id', () => {
    const profile = getApiProfileById({
      apiProfilesJson: JSON.stringify([{ id: 'demo', name: 'Demo', enabled: true }]),
      profileId: 'demo',
    });
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe('demo');
  });

  it('flags legacy profile config shape', () => {
    const legacy = JSON.stringify([
      {
        id: 'legacy',
        name: 'Legacy',
        enabled: true,
      },
    ]);
    expect(isLegacyApiProfilesConfig(legacy)).toBe(true);
  });

  it('disables profiles with missing or unsupported version', () => {
    const [missingVersion, badVersion] = parseApiProfilesJson(
      JSON.stringify([
        { id: 'missing-version', name: 'Missing Version', enabled: true },
        { id: 'bad-version', name: 'Bad Version', enabled: true, version: 999 },
      ])
    );

    expect(missingVersion.enabled).toBe(false);
    expect(missingVersion.versionError).toMatch(/Missing profile version/i);
    expect(badVersion.enabled).toBe(false);
    expect(badVersion.versionError).toMatch(/Unsupported profile version/i);
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
