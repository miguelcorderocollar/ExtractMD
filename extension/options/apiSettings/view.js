export function updateGeneratedIdPreview(nameValue, slugifyId) {
  const preview = document.getElementById('apiIntegrationIdPreview');
  if (!preview) return;
  const generated = slugifyId(nameValue);
  preview.textContent = `ID auto-generated from name: ${generated || '(enter a name)'}`;
}

export function renderCards({ profiles, selectedProfileId, onSelectProfile }) {
  const grid = document.getElementById('apiIntegrationsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  profiles.forEach((profile) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'api-integration-card';
    if (profile.id === selectedProfileId) {
      card.classList.add('selected');
    }

    const emoji = document.createElement('span');
    emoji.className = 'api-integration-card-emoji';
    emoji.textContent = profile.emoji || '🚀';
    emoji.style.background = profile.actionBackground || '#4f46e5';
    emoji.style.color = '#ffffff';

    const name = document.createElement('span');
    name.className = 'api-integration-card-name';
    name.textContent = profile.name || profile.id;

    card.appendChild(emoji);
    card.appendChild(name);
    card.addEventListener('click', () => {
      onSelectProfile(profile.id);
    });
    grid.appendChild(card);
  });
}

export function setEditorFieldValues({ profile, sourceCheckboxIds, updateGeneratedIdPreview }) {
  const setValue = (id, value) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.value = value;
  };

  setValue('apiIntegrationName', profile.name || '');
  setValue('apiIntegrationEmoji', profile.emoji || '🚀');
  setValue('apiIntegrationBackground', profile.actionBackground || '#4f46e5');
  setValue('apiIntegrationMethod', profile.method || 'POST');
  setValue('apiIntegrationUrl', profile.url || '');
  setValue('apiIntegrationHeadersTemplate', profile.headersTemplate || '{}');
  setValue('apiIntegrationBodyTemplate', profile.bodyTemplate || '{}');
  updateGeneratedIdPreview(profile.name || '');

  const enabledInput = document.getElementById('apiIntegrationEnabled');
  if (enabledInput) enabledInput.checked = profile.enabled === true;

  const availability = profile.integrationAvailability || {};
  Object.entries(sourceCheckboxIds).forEach(([source, id]) => {
    const checkbox = document.getElementById(id);
    const checked = availability[source] === true;
    if (checkbox) checkbox.checked = checked;
  });
}

export function getSelectedSourcesFromEditor(sourceCheckboxIds) {
  return Object.fromEntries(
    Object.entries(sourceCheckboxIds).map(([source, id]) => {
      const element = document.getElementById(id);
      return [source, element ? element.checked === true : false];
    })
  );
}

export function renderVariableChips({
  sourceKeys,
  sourceLabels,
  sourceIcons,
  sourceVariables,
  sourceCheckboxIds,
  onCopyVariable,
}) {
  const container = document.getElementById('apiVariableChips');
  if (!container) return;

  container.innerHTML = '';
  const availability = getSelectedSourcesFromEditor(sourceCheckboxIds);
  const enabledSources = sourceKeys.filter((source) => availability[source] === true);

  if (enabledSources.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'group-desc api-variable-empty';
    empty.textContent = 'Select at least one source above to preview available variables.';
    container.appendChild(empty);
    return;
  }

  enabledSources.forEach((source) => {
    const group = document.createElement('div');
    group.className = 'api-variable-group';

    const header = document.createElement('div');
    header.className = 'api-variable-group-header';

    const icon = document.createElement('span');
    icon.className = 'api-variable-group-icon';
    icon.innerHTML = sourceIcons[source] || '';

    const title = document.createElement('span');
    title.className = 'api-variable-group-title';
    title.textContent = sourceLabels[source] || source;

    header.appendChild(icon);
    header.appendChild(title);

    const chips = document.createElement('div');
    chips.className = 'api-variable-group-chips';

    (sourceVariables[source] || []).forEach((variable) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'api-variable-chip';
      button.textContent = `{{${variable}}}`;
      button.addEventListener('click', async () => {
        await onCopyVariable(variable);
      });
      chips.appendChild(button);
    });

    group.appendChild(header);
    group.appendChild(chips);
    container.appendChild(group);
  });
}

export function setUiVisibility({
  state,
  getSelectedProfile,
  setEditorFieldValues,
  renderVariableChips,
}) {
  const apiSettingsContent = document.getElementById('apiSettingsContent');
  const emptyState = document.getElementById('apiIntegrationsEmptyState');
  const panel = document.getElementById('apiIntegrationsPanel');
  const editor = document.getElementById('apiIntegrationEditor');
  const variablesGroup = document.getElementById('apiVariablesGroup');

  if (apiSettingsContent) {
    apiSettingsContent.hidden = !state.apiOutputEnabled;
  }

  if (!state.apiOutputEnabled) {
    if (editor) editor.hidden = true;
    if (variablesGroup) variablesGroup.hidden = true;
    return;
  }

  const hasProfiles = state.profiles.length > 0;
  if (emptyState) emptyState.hidden = hasProfiles;
  if (panel) panel.hidden = !hasProfiles;

  const selectedProfile = getSelectedProfile();
  const hasSelected = Boolean(selectedProfile);
  if (editor) editor.hidden = !hasSelected;
  if (!hasSelected) {
    if (variablesGroup) variablesGroup.hidden = true;
    return;
  }

  setEditorFieldValues(selectedProfile);
  const secretsInput = document.getElementById('apiIntegrationSecrets');
  if (secretsInput) {
    secretsInput.value = state.currentSecrets || '{}';
  }

  if (variablesGroup) {
    variablesGroup.hidden = selectedProfile.enabled !== true;
  }
  renderVariableChips();
}

export function refreshVariableChipsFromEditor({ getSelectedProfile, renderVariableChips }) {
  const profile = getSelectedProfile();
  if (!profile) return;
  renderVariableChips(profile);
}
