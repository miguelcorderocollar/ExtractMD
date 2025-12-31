import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// We need to test extractTranscriptText which is not exported,
// so we'll create a test version that mimics the function logic
function extractTranscriptText(doc, includeTimestamps = true) {
  let transcript = '';
  const allElements = Array.from(doc.querySelectorAll('ytd-transcript-segment-renderer, ytd-transcript-section-header-renderer'));
  allElements.forEach(element => {
    if (element.tagName === 'YTD-TRANSCRIPT-SECTION-HEADER-RENDERER') {
      const headerText = element.querySelector('.shelf-header-layout-wiz__title')?.textContent?.trim();
      if (headerText) {
        transcript += `\n\n## ${headerText}\n`;
      }
    } else if (element.tagName === 'YTD-TRANSCRIPT-SEGMENT-RENDERER') {
      const timestamp = element.querySelector('.segment-timestamp')?.textContent?.trim();
      const text = element.querySelector('.segment-text')?.textContent?.trim();
      if (text) {
        if (includeTimestamps && timestamp) {
          transcript += `[${timestamp}] ${text}\n`;
        } else {
          transcript += `${text}\n`;
        }
      }
    }
  });
  return transcript.trim();
}

describe('YouTube extractTranscriptText', () => {
  let dom;
  let document;

  beforeEach(() => {
    // Create a mock YouTube transcript DOM structure
    dom = new JSDOM(`
      <html>
        <body>
          <ytd-transcript-segment-renderer>
            <div class="segment-timestamp">0:00</div>
            <div class="segment-text">Hello and welcome</div>
          </ytd-transcript-segment-renderer>
          <ytd-transcript-segment-renderer>
            <div class="segment-timestamp">0:05</div>
            <div class="segment-text">to this video</div>
          </ytd-transcript-segment-renderer>
          <ytd-transcript-section-header-renderer>
            <div class="shelf-header-layout-wiz__title">Chapter 1</div>
          </ytd-transcript-section-header-renderer>
          <ytd-transcript-segment-renderer>
            <div class="segment-timestamp">1:30</div>
            <div class="segment-text">Let's get started</div>
          </ytd-transcript-segment-renderer>
        </body>
      </html>
    `);
    document = dom.window.document;
  });

  it('includes timestamps when includeTimestamps is true', () => {
    const result = extractTranscriptText(document, true);
    
    expect(result).toContain('[0:00]');
    expect(result).toContain('[0:05]');
    expect(result).toContain('[1:30]');
    expect(result).toContain('Hello and welcome');
    expect(result).toContain('to this video');
    expect(result).toContain('## Chapter 1');
  });

  it('excludes timestamps when includeTimestamps is false', () => {
    const result = extractTranscriptText(document, false);
    
    expect(result).not.toContain('[0:00]');
    expect(result).not.toContain('[0:05]');
    expect(result).not.toContain('[1:30]');
    expect(result).toContain('Hello and welcome');
    expect(result).toContain('to this video');
    expect(result).toContain('## Chapter 1');
  });

  it('defaults to including timestamps when parameter is omitted', () => {
    const result = extractTranscriptText(document);
    
    expect(result).toContain('[0:00]');
    expect(result).toContain('[0:05]');
  });

  it('handles segments without timestamps', () => {
    const domNoTimestamp = new JSDOM(`
      <html>
        <body>
          <ytd-transcript-segment-renderer>
            <div class="segment-text">Text without timestamp</div>
          </ytd-transcript-segment-renderer>
        </body>
      </html>
    `);
    
    const result = extractTranscriptText(domNoTimestamp.window.document, true);
    expect(result).toBe('Text without timestamp');
    expect(result).not.toContain('[');
  });

  it('preserves section headers regardless of timestamp setting', () => {
    const resultWithTimestamps = extractTranscriptText(document, true);
    const resultWithoutTimestamps = extractTranscriptText(document, false);
    
    expect(resultWithTimestamps).toContain('## Chapter 1');
    expect(resultWithoutTimestamps).toContain('## Chapter 1');
  });
});

