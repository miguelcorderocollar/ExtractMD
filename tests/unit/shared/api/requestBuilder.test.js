import { describe, expect, it } from 'vitest';
import { buildResolvedApiRequest } from '../../../../extension/shared/api/requestBuilder.js';

describe('shared/api/requestBuilder', () => {
  it('builds JSON request with rendered headers, query params, and body', () => {
    const request = buildResolvedApiRequest(
      {
        method: 'POST',
        url: 'https://example.test/webhook',
        contentType: 'json',
        headersTemplate: '{ "Authorization": "Bearer {{secret_api_token}}" }',
        queryParamsTemplate: '{ "source": "{{handle}}" }',
        bodyTemplate: '{ "author": "{{author}}", "likes": "{{likes}}" }',
      },
      {
        author: 'Alex',
        handle: '@alex',
        likes: '42',
        secret_api_token: 'token-123',
      }
    );

    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://example.test/webhook?source=%40alex');
    expect(request.headers.Authorization).toBe('Bearer token-123');
    expect(request.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(request.body)).toEqual({ author: 'Alex', likes: '42' });
  });

  it('builds text request and applies default text content type', () => {
    const request = buildResolvedApiRequest(
      {
        method: 'PATCH',
        url: 'https://example.test/text-endpoint',
        contentType: 'text',
        headersTemplate: '{}',
        queryParamsTemplate: '{}',
        bodyTemplate: 'Author={{author}}',
      },
      {
        author: 'Taylor',
      }
    );

    expect(request.method).toBe('PATCH');
    expect(request.body).toBe('Author=Taylor');
    expect(request.headers['Content-Type']).toBe('text/plain; charset=utf-8');
  });

  it('rejects unsupported HTTP methods', () => {
    expect(() =>
      buildResolvedApiRequest(
        {
          method: 'GET',
          url: 'https://example.test',
          headersTemplate: '{}',
          queryParamsTemplate: '{}',
          bodyTemplate: '{}',
        },
        {}
      )
    ).toThrow(/Unsupported API method/);
  });

  it('fails fast when required template variables are missing', () => {
    expect(() =>
      buildResolvedApiRequest(
        {
          method: 'POST',
          url: 'https://example.test/{{path}}',
          contentType: 'json',
          headersTemplate: '{ "Authorization": "Bearer {{secret_api_key}}" }',
          queryParamsTemplate: '{}',
          bodyTemplate: '{ "database_id": "{{database_id}}" }',
        },
        {
          path: 'capture',
        }
      )
    ).toThrow(/Missing API template variables/);
  });
});
