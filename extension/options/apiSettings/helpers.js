export function getErrorMessage(error, fallback = 'Unexpected error.') {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function getIntegrationLabel(profile) {
  if (!profile || typeof profile !== 'object') return 'integration';
  const emoji = String(profile.emoji || '').trim();
  const name = String(profile.name || profile.id || 'integration').trim();
  return `${emoji ? `${emoji} ` : ''}${name || 'integration'}`;
}

export function slugifyId(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function parseSecretsJson(value) {
  try {
    const parsed = String(value || '').trim() ? JSON.parse(value) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Secrets must be a JSON object.');
    }
    return parsed;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Invalid JSON';
    throw new Error(`Secrets JSON is invalid: ${reason}`);
  }
}

export function parseTemplateObject(value, label) {
  try {
    const parsed = JSON.parse(String(value || '{}'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object.`);
    }
    return parsed;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Invalid JSON';
    throw new Error(`${label} is invalid JSON: ${reason}`);
  }
}

export function getMasterToggleChecked() {
  const masterToggle = document.querySelector('[setting-id="apiOutputEnabled"]');
  if (!masterToggle) return false;
  if (typeof masterToggle.checked === 'boolean') return masterToggle.checked;
  const input = masterToggle.querySelector('input[type="checkbox"]');
  return input ? input.checked : false;
}
