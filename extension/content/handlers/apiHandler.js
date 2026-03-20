import { getSettings, getApiProfileSecrets, incrementApiCallCount } from '../../shared/storage.js';
import {
  buildResolvedApiRequest,
  getApiProfileById,
  getActiveApiProfile,
  getEnabledApiProfilesForIntegration,
  mergeApiVariables,
} from '../../shared/api/index.js';
import { showNotification } from '../utils.js';

const API_SETTINGS_KEYS = ['apiOutputEnabled', 'apiProfilesJson', 'apiActiveProfileId'];

function sendMessageAsync(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

export async function sendToConfiguredApi({ integration, variables, profileId = '' }) {
  const settings = await getSettings(API_SETTINGS_KEYS);

  if (settings.apiOutputEnabled !== true) {
    throw new Error('API output mode is disabled.');
  }

  const targetIntegration = String(integration || '')
    .trim()
    .toLowerCase();
  const explicitProfileId = String(profileId || '').trim();

  let profile = null;
  if (explicitProfileId) {
    profile = getApiProfileById({
      apiProfilesJson: settings.apiProfilesJson,
      profileId: explicitProfileId,
    });
    if (!profile) {
      throw new Error(`API profile '${explicitProfileId}' was not found.`);
    }
    if (profile.integrationAvailability?.[targetIntegration] !== true) {
      throw new Error(
        `API profile '${explicitProfileId}' is not enabled for ${targetIntegration}.`
      );
    }
  } else {
    const enabledProfiles = getEnabledApiProfilesForIntegration({
      apiProfilesJson: settings.apiProfilesJson,
      integration: targetIntegration,
    });
    if (enabledProfiles.length === 0) {
      throw new Error(`API output is not enabled for ${targetIntegration}.`);
    }
    const activeProfile = getActiveApiProfile(settings);
    profile =
      activeProfile.enabled === true &&
      activeProfile.integrationAvailability?.[targetIntegration] === true
        ? activeProfile
        : enabledProfiles[0];
  }

  if (!profile.enabled) {
    throw new Error('Active API profile is disabled.');
  }

  const secretVariables = await getApiProfileSecrets(profile.id);
  const mergedVariables = mergeApiVariables(variables, secretVariables);
  const request = buildResolvedApiRequest(profile, mergedVariables);

  const response = await sendMessageAsync({
    action: 'dispatchApiRequest',
    request,
  });

  if (!response?.success) {
    throw new Error(response?.error || 'API dispatch failed.');
  }

  await incrementApiCallCount();

  showNotification(
    `API request sent successfully<br><span>${request.method} ${request.url}</span>`,
    'success'
  );

  return response.result;
}
