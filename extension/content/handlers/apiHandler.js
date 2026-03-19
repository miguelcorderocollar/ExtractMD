import { getSettings, getApiProfileSecrets } from '../../shared/storage.js';
import {
  buildResolvedApiRequest,
  getActiveApiProfile,
  mergeApiVariables,
} from '../../shared/api/index.js';
import { showNotification } from '../utils.js';

const API_SETTINGS_KEYS = [
  'apiOutputEnabled',
  'apiProfilesJson',
  'apiActiveProfileId',
  'apiEnabledForX',
  'apiEnabledForYouTube',
  'apiEnabledForHackerNews',
  'apiEnabledForArticles',
  'apiEnabledForUniversal',
];

function isIntegrationEnabled(integration, settings) {
  if (integration === 'x') return settings.apiEnabledForX === true;
  if (integration === 'youtube') return settings.apiEnabledForYouTube === true;
  if (integration === 'hackernews') return settings.apiEnabledForHackerNews === true;
  if (integration === 'articles') return settings.apiEnabledForArticles === true;
  if (integration === 'universal') return settings.apiEnabledForUniversal === true;
  return false;
}

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

export async function sendToConfiguredApi({ integration, variables }) {
  const settings = await getSettings(API_SETTINGS_KEYS);

  if (settings.apiOutputEnabled !== true) {
    throw new Error('API output mode is disabled.');
  }

  if (!isIntegrationEnabled(integration, settings)) {
    throw new Error(`API output is not enabled for ${integration}.`);
  }

  const profile = getActiveApiProfile(settings);
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

  showNotification(
    `API request sent successfully<br><span>${request.method} ${request.url}</span>`,
    'success'
  );

  return response.result;
}
