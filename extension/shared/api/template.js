const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const FULL_PLACEHOLDER_REGEX = /^\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}$/;

function normalizeTemplateValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function renderTemplateString(template, variables = {}) {
  const input = String(template ?? '');
  return input.replace(PLACEHOLDER_REGEX, (_, key) => normalizeTemplateValue(variables[key]));
}

export function renderTemplateValue(value, variables = {}) {
  if (typeof value === 'string') {
    const fullMatch = value.match(FULL_PLACEHOLDER_REGEX);
    if (fullMatch) {
      const variableValue = variables[fullMatch[1]];
      return variableValue === undefined ? '' : variableValue;
    }
    return renderTemplateString(value, variables);
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderTemplateValue(item, variables));
  }

  if (value && typeof value === 'object') {
    const rendered = {};
    Object.entries(value).forEach(([k, v]) => {
      rendered[k] = renderTemplateValue(v, variables);
    });
    return rendered;
  }

  return value;
}

export function parseJsonTemplate(jsonTemplate, label) {
  if (!jsonTemplate || !String(jsonTemplate).trim()) {
    return {};
  }

  try {
    return JSON.parse(jsonTemplate);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new Error(`Invalid ${label} JSON template: ${reason}`);
  }
}

export function collectTemplateVariableKeys(value, output = new Set()) {
  if (typeof value === 'string') {
    const matches = value.matchAll(PLACEHOLDER_REGEX);
    for (const match of matches) {
      output.add(match[1]);
    }
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectTemplateVariableKeys(item, output));
    return output;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectTemplateVariableKeys(entry, output));
    return output;
  }

  return output;
}
