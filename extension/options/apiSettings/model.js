export function createInitialProfile({ profiles, createDefaultApiProfile, slugifyId }) {
  let numericSuffix = profiles.length + 1;
  let defaultName = `Integration ${numericSuffix}`;
  const usedNames = new Set(
    profiles.map((profile) =>
      String(profile.name || '')
        .trim()
        .toLowerCase()
    )
  );
  while (usedNames.has(defaultName.toLowerCase())) {
    numericSuffix += 1;
    defaultName = `Integration ${numericSuffix}`;
  }
  return createDefaultApiProfile({
    id: slugifyId(defaultName),
    name: defaultName,
    emoji: '🚀',
    actionBackground: '#4f46e5',
  });
}

export function collectProfileDraftFromEditor({
  createDefaultApiProfile,
  slugifyId,
  getSelectedSourcesFromEditor,
}) {
  const readText = (id) => {
    const element = document.getElementById(id);
    return String(element ? element.value : '').trim();
  };

  const enabledInput = document.getElementById('apiIntegrationEnabled');
  const name = readText('apiIntegrationName');
  return {
    ...createDefaultApiProfile(),
    id: slugifyId(name),
    name,
    emoji: readText('apiIntegrationEmoji') || '🚀',
    actionBackground: readText('apiIntegrationBackground') || '#4f46e5',
    enabled: enabledInput ? enabledInput.checked === true : true,
    method: readText('apiIntegrationMethod').toUpperCase(),
    url: readText('apiIntegrationUrl'),
    headersTemplate: readText('apiIntegrationHeadersTemplate') || '{}',
    bodyTemplate: readText('apiIntegrationBodyTemplate') || '{}',
    integrationAvailability: getSelectedSourcesFromEditor(),
  };
}

export function validateProfileDraft({
  draft,
  previousProfileId = '',
  profiles,
  supportedMethods,
  sourceKeys,
  parseTemplateObject,
}) {
  if (!draft.name) {
    throw new Error('Name is required.');
  }
  if (!draft.id) {
    throw new Error('ID is required and must contain letters or numbers.');
  }
  if (!supportedMethods.has(draft.method)) {
    throw new Error('Method must be POST, PUT, or PATCH.');
  }
  if (!draft.url) {
    throw new Error('URL is required.');
  }

  try {
    const parsedUrl = new URL(draft.url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Only http and https URLs are supported.');
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Invalid URL';
    throw new Error(`URL is invalid: ${reason}`);
  }

  parseTemplateObject(draft.headersTemplate, 'Headers template');
  if (draft.contentType === 'json') {
    parseTemplateObject(draft.bodyTemplate || '{}', 'Body template');
  }

  const hasSourceEnabled = sourceKeys.some(
    (source) => draft.integrationAvailability?.[source] === true
  );
  if (!hasSourceEnabled) {
    throw new Error('Enable at least one source in "Where available".');
  }

  const normalizedName = String(draft.name || '')
    .trim()
    .toLowerCase();
  const duplicateByName = profiles.find(
    (profile) =>
      profile.id !== String(previousProfileId || '') &&
      String(profile.name || '')
        .trim()
        .toLowerCase() === normalizedName
  );
  if (duplicateByName) {
    throw new Error(`Integration name '${draft.name}' already exists.`);
  }

  const duplicateById = profiles.find(
    (profile) => profile.id !== String(previousProfileId || '') && profile.id === draft.id
  );
  if (duplicateById) {
    throw new Error(`Integration id '${draft.id}' already exists.`);
  }
}
