import { describe, it, expect } from 'vitest';
import { parseCaptionEvents } from '../../../extension/content/youtubeTranscript.js';

describe('youtubeTranscript parser', () => {
  it('parses full caption event list with timestamps', () => {
    const events = [
      { tStartMs: 0, segs: [{ utf8: 'Hello ' }, { utf8: 'world' }] },
      { tStartMs: 4200, segs: [{ utf8: 'Second line' }] },
      { tStartMs: 9500, segs: [{ utf8: '\n' }] },
      { tStartMs: 12000, segs: [{ utf8: 'Third line' }] },
    ];

    const result = parseCaptionEvents(events, true);
    expect(result).toContain('[0:00] Hello world');
    expect(result).toContain('[0:04] Second line');
    expect(result).toContain('[0:12] Third line');
  });

  it('omits timestamps when disabled', () => {
    const events = [
      { tStartMs: 0, segs: [{ utf8: 'Only text' }] },
      { tStartMs: 1234, segs: [{ utf8: 'More text' }] },
    ];

    const result = parseCaptionEvents(events, false);
    expect(result).toBe('Only text\nMore text');
    expect(result).not.toContain('[');
  });
});
