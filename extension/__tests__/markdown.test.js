import { describe, it, expect } from 'vitest';
import { nodeToMarkdown } from '../content/articles.js';

describe('nodeToMarkdown (DOM-based)', () => {
  const createNode = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstChild;
  };

  it('converts headers', () => {
    expect(nodeToMarkdown(createNode('<h1>Title</h1>'), true)).toBe('# Title\n\n');
    expect(nodeToMarkdown(createNode('<h2>Subtitle</h2>'), true)).toBe('## Subtitle\n\n');
  });

  it('converts paragraphs', () => {
    const p = createNode('<p>This is a <b>bold</b> paragraph.</p>');
    expect(nodeToMarkdown(p, true)).toBe('This is a **bold** paragraph.\n\n');
  });

  it('converts lists', () => {
    const ul = createNode('<ul><li>Item 1</li><li>Item 2</li></ul>');
    expect(nodeToMarkdown(ul, true)).toBe('\n- Item 1\n- Item 2\n');

    const ol = createNode('<ol><li>First</li><li>Second</li></ol>');
    expect(nodeToMarkdown(ol, true)).toBe('\n1. First\n2. Second\n');
  });

  it('converts images when includeImages is true', () => {
    const img = createNode('<img src="https://example.com/test.png" alt="Test Image">');
    expect(nodeToMarkdown(img, true)).toBe('![Test Image](https://example.com/test.png)\n\n');
  });

  it('skips images when includeImages is false', () => {
    const img = createNode('<img src="https://example.com/test.png" alt="Test Image">');
    expect(nodeToMarkdown(img, false)).toBe('');
  });

  it('skips script and style tags', () => {
    expect(nodeToMarkdown(createNode('<script>alert(1)</script>'), true)).toBe('');
    expect(nodeToMarkdown(createNode('<style>.test{color:red}</style>'), true)).toBe('');
  });

  it('converts blockquotes', () => {
    const bq = createNode('<blockquote>Quote text</blockquote>');
    expect(nodeToMarkdown(bq, true)).toBe('> Quote text\n\n');
  });

  it('converts code blocks', () => {
    const code = createNode('<code>console.log("test")</code>');
    expect(nodeToMarkdown(code, true)).toBe('```console.log("test")```');
  });
});

