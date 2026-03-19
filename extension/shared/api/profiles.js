import { createDefaultApiProfile, DEFAULT_API_PROFILE_ID } from './constants.js';

function parseProfileItem(rawProfile) {
  if (!rawProfile || typeof rawProfile !== 'object' || Array.isArray(rawProfile)) {
    return null;
  }

  return createDefaultApiProfile({
    ...rawProfile,
    id: String(rawProfile.id || DEFAULT_API_PROFILE_ID),
    name: String(rawProfile.name || 'API Profile'),
    method: String(rawProfile.method || 'POST').toUpperCase(),
    url: String(rawProfile.url || ''),
    contentType: rawProfile.contentType === 'text' ? 'text' : 'json',
    headersTemplate: String(rawProfile.headersTemplate || '{}'),
    queryParamsTemplate: String(rawProfile.queryParamsTemplate || '{}'),
    bodyTemplate: String(rawProfile.bodyTemplate || ''),
    enabled: rawProfile.enabled === true,
  });
}

export function parseApiProfilesJson(apiProfilesJson) {
  if (!apiProfilesJson || !String(apiProfilesJson).trim()) {
    return [createDefaultApiProfile()];
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
  if (normalized.length === 0) {
    return [createDefaultApiProfile()];
  }
  return normalized;
}

export function getActiveApiProfile({ apiProfilesJson, apiActiveProfileId }) {
  const profiles = parseApiProfilesJson(apiProfilesJson);
  const activeId = String(apiActiveProfileId || DEFAULT_API_PROFILE_ID);

  const profile = profiles.find((candidate) => candidate.id === activeId) || profiles[0];
  if (!profile) {
    throw new Error('No API profile available.');
  }

  return profile;
}

export function mergeApiVariables(baseVariables = {}, secretVariables = {}) {
  return {
    ...baseVariables,
    ...secretVariables,
  };
}
