import {
  buildResolvedApiRequest,
  getActiveApiProfile,
  mergeApiVariables,
} from '../shared/api/index.js';
import { getApiProfileSecrets, saveApiProfileSecrets } from '../shared/storage.js';
import { showStatus } from './ui.js';

function getSyncSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        apiProfilesJson: '',
        apiActiveProfileId: 'default',
      },
      resolve
    );
  });
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

function getSampleVariables() {
  return {
    title: 'Roadmap update for synthetic project',
    author: 'Avery Stone (@averystone)',
    display_name: 'Avery Stone',
    handle: '@averystone',
    date: '2026-03-19T11:45:00.000Z',
    link: 'https://x.com/averystone/status/1234567890123456789',
    content: 'Synthetic sample post content used for local API profile validation in ExtractMD.',
    comments: 14,
    reposts: 8,
    likes: 57,
    bookmarks: 5,
    views: 1203,
    extracted_at: new Date().toISOString(),
  };
}

function emitSavedToast() {
  document.dispatchEvent(
    new CustomEvent('extractmd-setting-saved', {
      detail: { settingId: 'apiProfileSecretsJson', value: 'saved' },
    })
  );
}

async function loadSecretsIntoTextarea() {
  const activeProfileInput = document.getElementById('apiActiveProfileId');
  const secretsTextarea = document.getElementById('apiProfileSecretsJson');
  if (!activeProfileInput || !secretsTextarea) return;

  const profileId = String(activeProfileInput.value || '').trim() || 'default';
  const secrets = await getApiProfileSecrets(profileId);
  secretsTextarea.value = JSON.stringify(secrets, null, 2);
}

async function saveSecretsFromTextarea() {
  const activeProfileInput = document.getElementById('apiActiveProfileId');
  const secretsTextarea = document.getElementById('apiProfileSecretsJson');
  if (!activeProfileInput || !secretsTextarea) return;

  const profileId = String(activeProfileInput.value || '').trim() || 'default';

  let parsedSecrets = {};
  try {
    parsedSecrets = secretsTextarea.value.trim() ? JSON.parse(secretsTextarea.value) : {};
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Invalid JSON';
    showStatus(`Secret variables JSON is invalid: ${reason}`, 'error');
    return;
  }

  if (!parsedSecrets || typeof parsedSecrets !== 'object' || Array.isArray(parsedSecrets)) {
    showStatus('Secret variables must be a JSON object.', 'error');
    return;
  }

  await saveApiProfileSecrets(profileId, parsedSecrets);
  emitSavedToast();
}

async function testApiProfileRequest() {
  try {
    const settings = await getSyncSettings();
    const profile = getActiveApiProfile(settings);
    const secretVariables = await getApiProfileSecrets(profile.id);
    const variables = mergeApiVariables(getSampleVariables(), secretVariables);
    const request = buildResolvedApiRequest(profile, variables);

    const response = await sendMessageAsync({
      action: 'dispatchApiRequest',
      request,
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Mock request failed');
    }

    showStatus(`API test succeeded (${response.result.status}).`, 'success');
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown API test error';
    showStatus(`API test failed: ${reason}`, 'error');
  }
}

export function initializeApiSettings() {
  const loadSecretsButton = document.getElementById('loadApiSecretsBtn');
  const saveSecretsButton = document.getElementById('saveApiSecretsBtn');
  const testApiButton = document.getElementById('testApiRequestBtn');
  const activeProfileInput = document.getElementById('apiActiveProfileId');

  if (activeProfileInput) {
    activeProfileInput.addEventListener('change', loadSecretsIntoTextarea);
  }

  if (loadSecretsButton) {
    loadSecretsButton.addEventListener('click', loadSecretsIntoTextarea);
  }

  if (saveSecretsButton) {
    saveSecretsButton.addEventListener('click', saveSecretsFromTextarea);
  }

  if (testApiButton) {
    testApiButton.addEventListener('click', testApiProfileRequest);
  }

  loadSecretsIntoTextarea();
}
