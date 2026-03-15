export function toAbsoluteUrl(url) {
  if (!url) return '';
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return '';
  }
}

export function normalizeWhitespace(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export function normalizeInlineWhitespace(text) {
  return (text || '').replace(/\s+/g, ' ');
}

function formatInlineEmphasis(rawText, marker) {
  const normalized = normalizeInlineWhitespace(rawText);
  if (!normalized.trim()) return '';
  const leading = /^\s/.test(normalized) ? ' ' : '';
  const trailing = /\s$/.test(normalized) ? ' ' : '';
  return `${leading}${marker}${normalized.trim()}${marker}${trailing}`;
}

export function normalizeMarkdownBlock(text) {
  return (text || '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

export function renderInlineMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tag = node.tagName.toLowerCase();

  if (tag === 'br') return '\n';

  if (tag === 'a') {
    const href = toAbsoluteUrl(node.getAttribute('href') || '');
    const text = normalizeInlineWhitespace(
      Array.from(node.childNodes).map(renderInlineMarkdown).join('')
    );
    if (!text.trim()) return '';
    return href ? `[${text.trim()}](${href})` : text;
  }

  if (tag === 'strong' || tag === 'b') {
    return formatInlineEmphasis(
      Array.from(node.childNodes).map(renderInlineMarkdown).join(''),
      '**'
    );
  }

  if (tag === 'em' || tag === 'i') {
    return formatInlineEmphasis(
      Array.from(node.childNodes).map(renderInlineMarkdown).join(''),
      '*'
    );
  }

  if (tag === 'code') {
    const text = normalizeWhitespace(node.textContent || '');
    return text ? `\`${text}\`` : '';
  }

  if (tag === 'img') {
    const src = toAbsoluteUrl(node.getAttribute('src') || '');
    const altText = node.getAttribute('alt') || '';
    if (/emoji\/v2\/svg\//.test(src)) {
      return altText;
    }
    const alt = normalizeWhitespace(node.getAttribute('alt') || 'Image');
    return src ? `![${alt}](${src})` : '';
  }

  const style = node.getAttribute('style') || '';
  if (style.includes('font-style') && style.includes('italic')) {
    return formatInlineEmphasis(
      Array.from(node.childNodes).map(renderInlineMarkdown).join(''),
      '*'
    );
  }
  if (style.includes('font-weight') && style.includes('bold')) {
    return formatInlineEmphasis(
      Array.from(node.childNodes).map(renderInlineMarkdown).join(''),
      '**'
    );
  }

  return Array.from(node.childNodes).map(renderInlineMarkdown).join('');
}

export function renderBlockMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeWhitespace(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tag = node.tagName.toLowerCase();
  const inlineContent = normalizeWhitespace(
    Array.from(node.childNodes).map(renderInlineMarkdown).join('')
  );

  if (tag === 'section') {
    const inlineImage = node.querySelector('[data-testid="tweetPhoto"] img[src], img[src]');
    return inlineImage ? renderInlineMarkdown(inlineImage) : '';
  }
  if (tag === 'h1') return inlineContent ? `# ${inlineContent}` : '';
  if (tag === 'h2') return inlineContent ? `## ${inlineContent}` : '';
  if (tag === 'h3') return inlineContent ? `### ${inlineContent}` : '';

  if (tag === 'div') {
    const nested = node.querySelector('h1, h2, h3');
    if (nested) return renderBlockMarkdown(nested);
    return inlineContent;
  }

  if (tag === 'p' || tag === 'span' || tag === 'li') return inlineContent;

  if (tag === 'blockquote') {
    let quote = normalizeWhitespace(Array.from(node.childNodes).map(renderInlineMarkdown).join(''));
    const attributionSeparatorIndex = quote.lastIndexOf(' – ');
    if (attributionSeparatorIndex > 0) {
      const body = quote.slice(0, attributionSeparatorIndex);
      const attribution = quote.slice(attributionSeparatorIndex + 1).trimStart();
      quote = `${body}\n${attribution}`;
    }
    return quote
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }

  if (tag === 'pre') {
    const text = (node.textContent || '').trim();
    return text ? `\`\`\`\n${text}\n\`\`\`` : '';
  }

  if (tag === 'ul') {
    const items = Array.from(node.children)
      .map((li) => normalizeWhitespace(renderBlockMarkdown(li)))
      .filter(Boolean);
    return items.length ? items.map((item) => `- ${item}`).join('\n') : '';
  }

  if (tag === 'ol') {
    const items = Array.from(node.children)
      .map((li) => normalizeWhitespace(renderBlockMarkdown(li)))
      .filter(Boolean);
    return items.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '';
  }

  return inlineContent;
}
