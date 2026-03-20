import { describe, expect, it } from 'vitest';
import {
  computeEnabledApiProfileSignature,
  getSecondaryApiActions,
} from '../../../../extension/content/handlers/apiSecondaryActions.js';

describe('content/handlers/apiSecondaryActions', () => {
  const apiProfilesJson = JSON.stringify([
    {
      id: 'yt-a',
      name: 'YouTube A',
      enabled: true,
      emoji: '🎬',
      actionBackground: '#123456',
      integrationAvailability: { youtube: true },
      version: 2,
    },
    {
      id: 'yt-b',
      name: 'YouTube B',
      enabled: true,
      emoji: '📺',
      actionBackground: '#654321',
      integrationAvailability: { youtube: true },
      version: 2,
    },
    {
      id: 'hn-a',
      name: 'HN A',
      enabled: true,
      integrationAvailability: { hackernews: true },
      version: 2,
    },
  ]);

  it('returns stable sorted signature for enabled integration profiles', () => {
    const signature = computeEnabledApiProfileSignature({
      apiProfilesJson,
      apiOutputEnabled: true,
      integration: 'youtube',
    });
    expect(signature).toBe('yt-a|yt-b');
  });

  it('returns empty signature when API output is disabled', () => {
    const signature = computeEnabledApiProfileSignature({
      apiProfilesJson,
      apiOutputEnabled: false,
      integration: 'youtube',
    });
    expect(signature).toBe('');
  });

  it('builds secondary actions for the requested integration only', async () => {
    const invoked = [];
    const actions = getSecondaryApiActions({
      apiProfilesJson,
      apiOutputEnabled: true,
      integration: 'hackernews',
      onProfileAction: async (profileId) => {
        invoked.push(profileId);
      },
    });

    expect(actions).toHaveLength(1);
    expect(actions[0].title).toContain('HN A');
    await actions[0].onClick();
    expect(invoked).toEqual(['hn-a']);
  });
});
