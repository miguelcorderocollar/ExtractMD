import {
  API_PROFILE_VERSION,
  createDefaultApiProfile,
  parseApiProfilesJson,
} from '../shared/api/index.js';
import { API_SOURCE_KEYS, API_SOURCE_VARIABLES } from '../shared/api/variables.js';
import { getApiProfileSecrets, saveApiProfileSecrets, saveSetting } from '../shared/storage.js';
import { showSaveToast } from './ui.js';
import {
  EMPTY_PROFILES_JSON,
  SOURCE_CHECKBOX_IDS,
  SOURCE_ICONS,
  SOURCE_LABELS,
  SUPPORTED_METHODS,
} from './apiSettings/constants.js';
import {
  getErrorMessage,
  getIntegrationLabel,
  getMasterToggleChecked,
  parseSecretsJson,
  parseTemplateObject,
  slugifyId,
} from './apiSettings/helpers.js';
import {
  collectProfileDraftFromEditor,
  createInitialProfile,
  validateProfileDraft,
} from './apiSettings/model.js';
import {
  getSelectedSourcesFromEditor,
  renderCards as renderCardsView,
  renderVariableChips as renderVariableChipsView,
  setEditorFieldValues as setEditorFieldValuesView,
  setUiVisibility as setUiVisibilityView,
  updateGeneratedIdPreview,
} from './apiSettings/view.js';

const state = {
  apiOutputEnabled: false,
  profiles: [],
  selectedProfileId: '',
  currentSecrets: '{}',
};

function getSelectedProfile() {
  if (!state.selectedProfileId) return null;
  return state.profiles.find((profile) => profile.id === state.selectedProfileId) || null;
}

function getSyncSettingsAsync() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        apiOutputEnabled: false,
        apiProfilesJson: EMPTY_PROFILES_JSON,
        apiActiveProfileId: 'default',
      },
      resolve
    );
  });
}

function renderCards() {
  renderCardsView({
    profiles: state.profiles,
    selectedProfileId: state.selectedProfileId,
    onSelectProfile: selectProfile,
  });
}

function setEditorFieldValues(profile) {
  setEditorFieldValuesView({
    profile,
    sourceCheckboxIds: SOURCE_CHECKBOX_IDS,
    updateGeneratedIdPreview: (value) => updateGeneratedIdPreview(value, slugifyId),
  });
}

async function onCopyVariable(variable) {
  const value = `{{${variable}}}`;
  try {
    await navigator.clipboard.writeText(value);
    showSaveToast(`Copied ${value}`, 'success', 'clipboard');
  } catch {
    showSaveToast('Clipboard copy failed.', 'error', 'clipboard');
  }
}

function renderVariableChips() {
  renderVariableChipsView({
    sourceKeys: API_SOURCE_KEYS,
    sourceLabels: SOURCE_LABELS,
    sourceIcons: SOURCE_ICONS,
    sourceVariables: API_SOURCE_VARIABLES,
    sourceCheckboxIds: SOURCE_CHECKBOX_IDS,
    onCopyVariable,
  });
}

function setUiVisibility() {
  setUiVisibilityView({
    state,
    getSelectedProfile,
    setEditorFieldValues,
    renderVariableChips,
  });
}

function warnIfProfileVersionInvalid(profile) {
  if (!profile || !profile.versionError) return;
  showSaveToast(
    `${getIntegrationLabel(profile)} is disabled: ${profile.versionError} Edit it and save to migrate.`,
    'error'
  );
}

async function saveSelectedIntegration() {
  const selected = getSelectedProfile();
  if (!selected) {
    showSaveToast('No integration selected to save.', 'error');
    return;
  }

  try {
    const draft = collectProfileDraftFromEditor({
      createDefaultApiProfile,
      slugifyId,
      getSelectedSourcesFromEditor: () => getSelectedSourcesFromEditor(SOURCE_CHECKBOX_IDS),
    });
    validateProfileDraft({
      draft,
      previousProfileId: selected.id,
      profiles: state.profiles,
      supportedMethods: SUPPORTED_METHODS,
      sourceKeys: API_SOURCE_KEYS,
      parseTemplateObject,
    });

    const secretsInput = document.getElementById('apiIntegrationSecrets');
    const parsedSecrets = parseSecretsJson(secretsInput ? secretsInput.value : '{}');

    state.profiles = state.profiles.map((profile) =>
      profile.id === selected.id ? draft : profile
    );
    state.selectedProfileId = draft.id;
    state.currentSecrets = JSON.stringify(parsedSecrets, null, 2);

    await saveApiProfileSecrets(draft.id, parsedSecrets);
    saveSetting('apiProfilesJson', JSON.stringify(state.profiles, null, 2));
    saveSetting('apiActiveProfileId', draft.id);
    showSaveToast(`Updated ${getIntegrationLabel(draft)}.`, 'success');
    renderCards();
    setUiVisibility();
  } catch (error) {
    showSaveToast(
      `Could not save ${getIntegrationLabel(selected)}: ${getErrorMessage(error)}`,
      'error'
    );
  }
}

async function selectProfile(profileId) {
  state.selectedProfileId = String(profileId || '').trim();
  if (!state.selectedProfileId) {
    state.currentSecrets = '{}';
    renderCards();
    setUiVisibility();
    return;
  }

  const selected = getSelectedProfile();
  if (!selected) {
    showSaveToast('Could not load selected integration.', 'error');
    return;
  }

  try {
    const secrets = await getApiProfileSecrets(selected.id);
    state.currentSecrets = JSON.stringify(secrets, null, 2);
    renderCards();
    setUiVisibility();
    warnIfProfileVersionInvalid(selected);
  } catch (error) {
    showSaveToast(
      `Could not load secrets for ${getIntegrationLabel(selected)}: ${getErrorMessage(error)}`,
      'error'
    );
  }
}

function createIntegration() {
  try {
    const profile = createInitialProfile({
      profiles: state.profiles,
      createDefaultApiProfile,
      slugifyId,
    });
    state.profiles = [...state.profiles, profile];
    state.selectedProfileId = profile.id;
    state.currentSecrets = '{}';
    showSaveToast(`Created ${getIntegrationLabel(profile)}.`, 'success');
    renderCards();
    setUiVisibility();
  } catch (error) {
    showSaveToast(`Could not create integration: ${getErrorMessage(error)}`, 'error');
  }
}

function deleteSelectedIntegration() {
  const selected = getSelectedProfile();
  if (!selected) {
    showSaveToast('No integration selected to delete.', 'error');
    return;
  }

  try {
    state.profiles = state.profiles.filter((profile) => profile.id !== selected.id);
    state.selectedProfileId = '';
    state.currentSecrets = '{}';
    saveSetting('apiProfilesJson', JSON.stringify(state.profiles, null, 2));
    saveSetting('apiActiveProfileId', '');
    showSaveToast(`Deleted ${getIntegrationLabel(selected)}.`, 'success');
    renderCards();
    setUiVisibility();
  } catch (error) {
    showSaveToast(
      `Could not delete ${getIntegrationLabel(selected)}: ${getErrorMessage(error)}`,
      'error'
    );
  }
}

function saveIntegrationEnabledToggle() {
  const selected = getSelectedProfile();
  const enabledInput = document.getElementById('apiIntegrationEnabled');
  if (!selected || !enabledInput) {
    showSaveToast('Could not update integration status.', 'error');
    return;
  }

  if (enabledInput.checked === true && selected.versionError) {
    enabledInput.checked = false;
    showSaveToast(
      `Cannot enable ${getIntegrationLabel(selected)}: ${selected.versionError} Edit and save it first.`,
      'error'
    );
    return;
  }

  try {
    const enabled = enabledInput.checked === true;
    state.profiles = state.profiles.map((profile) =>
      profile.id === selected.id ? { ...profile, enabled } : profile
    );
    saveSetting('apiProfilesJson', JSON.stringify(state.profiles, null, 2));
    showSaveToast(
      `${enabled ? 'Enabled' : 'Disabled'} ${getIntegrationLabel(selected)}.`,
      'success'
    );
    renderCards();
    setUiVisibility();
  } catch (error) {
    showSaveToast(
      `Could not update ${getIntegrationLabel(selected)}: ${getErrorMessage(error)}`,
      'error'
    );
  }
}

function attachListeners() {
  const createButton = document.getElementById('apiCreateIntegrationBtn');
  const saveButton = document.getElementById('apiSaveIntegrationBtn');
  const deleteButton = document.getElementById('apiDeleteIntegrationBtn');
  const nameInput = document.getElementById('apiIntegrationName');
  const enabledInput = document.getElementById('apiIntegrationEnabled');
  const masterToggle = document.querySelector('[setting-id="apiOutputEnabled"]');

  if (createButton) createButton.addEventListener('click', createIntegration);
  if (saveButton) saveButton.addEventListener('click', saveSelectedIntegration);
  if (deleteButton) deleteButton.addEventListener('click', deleteSelectedIntegration);
  if (enabledInput) enabledInput.addEventListener('change', saveIntegrationEnabledToggle);
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      updateGeneratedIdPreview(nameInput.value, slugifyId);
    });
  }
  Object.values(SOURCE_CHECKBOX_IDS).forEach((id) => {
    const checkbox = document.getElementById(id);
    if (!checkbox) return;
    checkbox.addEventListener('change', () => renderVariableChips());
  });
  if (masterToggle) {
    masterToggle.addEventListener('change', () => {
      state.apiOutputEnabled = getMasterToggleChecked();
      setUiVisibility();
    });
  }
}

async function initializeState() {
  const settings = await getSyncSettingsAsync();
  state.apiOutputEnabled = settings.apiOutputEnabled === true;
  try {
    state.profiles = parseApiProfilesJson(settings.apiProfilesJson);
  } catch (error) {
    state.profiles = [];
    showSaveToast(`Invalid API integrations JSON: ${getErrorMessage(error)}`, 'error');
  }

  const activeId = String(settings.apiActiveProfileId || '').trim();
  state.selectedProfileId = activeId || state.profiles[0]?.id || '';
  if (state.profiles.some((profile) => profile.versionError)) {
    showSaveToast(
      `Some integrations were disabled due to version mismatch (expected v${API_PROFILE_VERSION}).`,
      'error'
    );
  }
}

export async function initializeApiSettings() {
  await initializeState();
  attachListeners();
  renderCards();
  setUiVisibility();
  if (state.selectedProfileId) {
    await selectProfile(state.selectedProfileId);
  }
}
