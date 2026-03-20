import { describe, expect, it } from 'vitest';
import {
  parseJsonTemplate,
  renderTemplateString,
  renderTemplateValue,
} from '../../../../extension/shared/api/template.js';

describe('shared/api/template', () => {
  it('renders string placeholders with flat variables', () => {
    const rendered = renderTemplateString('Hello {{name}} from {{city}}', {
      name: 'Sam',
      city: 'Portland',
    });

    expect(rendered).toBe('Hello Sam from Portland');
  });

  it('replaces missing placeholders with empty strings', () => {
    const rendered = renderTemplateString('Token={{secret_token}}', {});
    expect(rendered).toBe('Token=');
  });

  it('renders nested object templates recursively', () => {
    const rendered = renderTemplateValue(
      {
        title: '{{title}}',
        nested: {
          tags: ['x', '{{handle}}'],
        },
      },
      {
        title: 'Synthetic Post',
        handle: '@synthetic',
      }
    );

    expect(rendered).toEqual({
      title: 'Synthetic Post',
      nested: {
        tags: ['x', '@synthetic'],
      },
    });
  });

  it('preserves number type when value is exact placeholder', () => {
    const rendered = renderTemplateValue(
      {
        comments: '{{comments}}',
        label: 'Count: {{comments}}',
      },
      { comments: 42 }
    );

    expect(rendered).toEqual({
      comments: 42,
      label: 'Count: 42',
    });
  });

  it('throws a useful error for invalid JSON template', () => {
    expect(() => parseJsonTemplate('{bad json}', 'headers')).toThrow(
      /Invalid headers JSON template/
    );
  });
});
