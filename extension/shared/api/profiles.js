import {
  API_PROFILE_VERSION,
  createDefaultApiProfile,
  DEFAULT_API_PROFILE_ID,
} from './constants.js';

function parseProfileItem(rawProfile) {
  if (!rawProfile || typeof rawProfile !== 'object' || Array.isArray(rawProfile)) {
    return null;
  }

  const hasExplicitVersion =
    rawProfile.version !== undefined && rawProfile.version !== null && rawProfile.version !== '';
  const parsedVersion = Number(rawProfile.version);
  const hasValidVersion =
    hasExplicitVersion && Number.isInteger(parsedVersion) && parsedVersion === API_PROFILE_VERSION;

  const parsed = createDefaultApiProfile({
    ...rawProfile,
    version:
      hasExplicitVersion && Number.isFinite(parsedVersion) ? parsedVersion : rawProfile.version,
    id: String(rawProfile.id || DEFAULT_API_PROFILE_ID),
    name: String(rawProfile.name || 'API Profile'),
    method: String(rawProfile.method || 'POST').toUpperCase(),
    url: String(rawProfile.url || ''),
    contentType: rawProfile.contentType === 'text' ? 'text' : 'json',
    headersTemplate: String(rawProfile.headersTemplate || '{}'),
    queryParamsTemplate: String(rawProfile.queryParamsTemplate || '{}'),
    bodyTemplate: String(rawProfile.bodyTemplate || ''),
    enabled: rawProfile.enabled === true,
    emoji: String(rawProfile.emoji || '🚀'),
    actionBackground: String(rawProfile.actionBackground || '#4f46e5'),
    integrationAvailability:
      rawProfile.integrationAvailability && typeof rawProfile.integrationAvailability === 'object'
        ? {
            x: rawProfile.integrationAvailability.x === true,
            youtube: rawProfile.integrationAvailability.youtube === true,
            hackernews: rawProfile.integrationAvailability.hackernews === true,
            articles: rawProfile.integrationAvailability.articles === true,
            universal: rawProfile.integrationAvailability.universal === true,
          }
        : {
            x: true,
            youtube: false,
            hackernews: false,
            articles: false,
            universal: false,
          },
  });

  if (!hasValidVersion) {
    parsed.enabled = false;
    parsed.versionError = hasExplicitVersion
      ? `Unsupported profile version '${rawProfile.version}'. Expected version ${API_PROFILE_VERSION}.`
      : `Missing profile version. Expected version ${API_PROFILE_VERSION}.`;
  } else {
    parsed.versionError = '';
  }

  return parsed;
}

export function parseApiProfilesJson(apiProfilesJson) {
  if (!apiProfilesJson || !String(apiProfilesJson).trim()) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(apiProfilesJson);
  } catch {
    throw new Error('Invalid API profiles JSON.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('API profiles JSON must be an array.');
  }

  const normalized = parsed.map(parseProfileItem).filter(Boolean);
  return normalized;
}

export function getActiveApiProfile({ apiProfilesJson, apiActiveProfileId }) {
  const profiles = parseApiProfilesJson(apiProfilesJson);
  if (profiles.length === 0) {
    throw new Error('No API profile available.');
  }
  const activeId = String(apiActiveProfileId || DEFAULT_API_PROFILE_ID);

  const profile = profiles.find((candidate) => candidate.id === activeId) || profiles[0];
  if (!profile) {
    throw new Error('No API profile available.');
  }

  return profile;
}

export function getApiProfileById({ apiProfilesJson, profileId }) {
  const id = String(profileId || '').trim();
  if (!id) return null;
  const profiles = parseApiProfilesJson(apiProfilesJson);
  return profiles.find((candidate) => candidate.id === id) || null;
}

function supportsIntegration(profile, integration) {
  if (!profile || !profile.integrationAvailability) return false;
  return profile.integrationAvailability[integration] === true;
}

export function getEnabledApiProfilesForIntegration({ apiProfilesJson, integration }) {
  const target = String(integration || '')
    .trim()
    .toLowerCase();
  const profiles = parseApiProfilesJson(apiProfilesJson);
  return profiles.filter(
    (profile) => profile.enabled === true && supportsIntegration(profile, target)
  );
}

export function isLegacyApiProfilesConfig(apiProfilesJson) {
  if (!apiProfilesJson || !String(apiProfilesJson).trim()) {
    return false;
  }

  let parsed = [];
  try {
    parsed = JSON.parse(apiProfilesJson);
  } catch {
    return true;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return false;
  }

  return parsed.some(
    (profile) =>
      !profile ||
      typeof profile !== 'object' ||
      Array.isArray(profile) ||
      !profile.emoji ||
      !profile.actionBackground ||
      !profile.version
  );
}

export function mergeApiVariables(baseVariables = {}, secretVariables = {}) {
  return {
    ...baseVariables,
    ...secretVariables,
  };
}
