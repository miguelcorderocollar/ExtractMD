import { getEnabledApiProfilesForIntegration } from '../../shared/api/index.js';

export function computeEnabledApiProfileSignature({
  apiProfilesJson,
  apiOutputEnabled,
  integration,
}) {
  if (apiOutputEnabled !== true) return '';
  try {
    const profiles = getEnabledApiProfilesForIntegration({
      apiProfilesJson,
      integration,
    });
    return profiles
      .map((profile) => profile.id)
      .sort()
      .join('|');
  } catch {
    return '';
  }
}

export function getSecondaryApiActions({
  apiProfilesJson,
  apiOutputEnabled,
  integration,
  onProfileAction,
}) {
  if (typeof onProfileAction !== 'function') return [];

  let profiles = [];
  if (apiOutputEnabled === true) {
    try {
      profiles = getEnabledApiProfilesForIntegration({
        apiProfilesJson,
        integration,
      });
    } catch {
      profiles = [];
    }
  }

  return profiles.slice(0, 3).map((profile) => ({
    icon: profile.emoji || '🚀',
    title: `Send to ${profile.name || profile.id}`,
    background: profile.actionBackground || 'rgba(79, 70, 229, 0.95)',
    color: '#ffffff',
    onClick: async () => {
      await onProfileAction(profile.id);
    },
  }));
}
