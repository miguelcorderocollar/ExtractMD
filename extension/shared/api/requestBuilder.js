import {
  collectTemplateVariableKeys,
  parseJsonTemplate,
  renderTemplateString,
  renderTemplateValue,
} from './template.js';

const SUPPORTED_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function hasHeader(headers, headerName) {
  const target = String(headerName).toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === target);
}

function ensureValidMethod(method) {
  const normalized = String(method || '').toUpperCase();
  if (!SUPPORTED_METHODS.has(normalized)) {
    throw new Error(`Unsupported API method: ${method}`);
  }
  return normalized;
}

function assertRequiredVariables(variableSources, variables) {
  const requiredKeys = new Set();
  variableSources.forEach((source) => collectTemplateVariableKeys(source, requiredKeys));

  const missing = Array.from(requiredKeys).filter((key) => {
    const value = variables[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing API template variables: ${missing.sort().join(', ')}. Check profile templates and saved secret variables for the active profile.`
    );
  }
}

function buildUrlWithQueryParams(baseUrl, queryParamsObject, variables) {
  const renderedBaseUrl = renderTemplateString(baseUrl, variables).trim();
  if (!renderedBaseUrl) {
    throw new Error('API profile URL is empty.');
  }

  let url;
  try {
    url = new URL(renderedBaseUrl);
  } catch {
    throw new Error(`Invalid API profile URL: ${renderedBaseUrl}`);
  }

  const renderedParams = renderTemplateValue(queryParamsObject, variables);
  Object.entries(renderedParams).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export function buildResolvedApiRequest(profile, variables = {}) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Missing API profile.');
  }

  const method = ensureValidMethod(profile.method);
  const headersTemplate = parseJsonTemplate(profile.headersTemplate || '{}', 'headers');
  const queryParamsTemplate = parseJsonTemplate(
    profile.queryParamsTemplate || '{}',
    'query parameters'
  );
  const bodyTemplate = String(profile.bodyTemplate || '').trim();
  const bodyTemplateSource =
    profile.contentType === 'text' ? bodyTemplate : parseJsonTemplate(bodyTemplate || '{}', 'body');

  assertRequiredVariables(
    [String(profile.url || ''), headersTemplate, queryParamsTemplate, bodyTemplateSource],
    variables
  );

  const headers = renderTemplateValue(headersTemplate, variables);
  const url = buildUrlWithQueryParams(profile.url, queryParamsTemplate, variables);

  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    throw new Error('Headers template must resolve to an object.');
  }

  const request = {
    method,
    url,
    headers,
  };

  if (bodyTemplate) {
    if (profile.contentType === 'text') {
      request.body = renderTemplateString(bodyTemplate, variables);
      if (!hasHeader(headers, 'Content-Type')) {
        request.headers['Content-Type'] = 'text/plain; charset=utf-8';
      }
    } else {
      const bodyObject = bodyTemplateSource;
      request.body = JSON.stringify(renderTemplateValue(bodyObject, variables));
      if (!hasHeader(headers, 'Content-Type')) {
        request.headers['Content-Type'] = 'application/json';
      }
    }
  }

  return request;
}
