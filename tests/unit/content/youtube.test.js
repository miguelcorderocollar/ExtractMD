import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  extractTranscriptText,
  extractChapters,
  formatChaptersSection,
} from '../../../extension/content/youtube.js';

// Mock the dependencies of youtube.js since we're importing it
vi.mock('../../../extension/content/utils.js', () => ({
  copyToClipboard: vi.fn(),
  showNotification: vi.fn(),
  sleep: vi.fn(),
  getSettings: vi.fn(),
  closeCurrentTab: vi.fn(),
  downloadMarkdownFile: vi.fn(),
  showSuccessNotificationWithTokens: vi.fn(),
  isFullscreen: vi.fn(),
}));

vi.mock('../../../extension/shared/storage.js', () => ({
  incrementKpi: vi.fn(),
}));

vi.mock('../../../extension/content/components/FloatingButton.js', () => ({
  createFloatingButton: vi.fn(),
}));

vi.mock('gpt-tokenizer', () => ({
  encode: vi.fn(() => ({ length: 0 })),
}));

describe('YouTube content script logic', () => {
  describe('extractTranscriptText', () => {
    beforeEach(() => {
      document.body.innerHTML = `
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
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('includes timestamps when includeTimestamps is true', () => {
      const result = extractTranscriptText(true);

      expect(result).toContain('[0:00]');
      expect(result).toContain('[0:05]');
      expect(result).toContain('[1:30]');
      expect(result).toContain('Hello and welcome');
      expect(result).toContain('to this video');
      expect(result).toContain('## Chapter 1');
    });

    it('excludes timestamps when includeTimestamps is false', () => {
      const result = extractTranscriptText(false);

      expect(result).not.toContain('[0:00]');
      expect(result).not.toContain('[0:05]');
      expect(result).not.toContain('[1:30]');
      expect(result).toContain('Hello and welcome');
      expect(result).toContain('to this video');
      expect(result).toContain('## Chapter 1');
    });

    it('excludes chapter headers when includeChapters is false', () => {
      const result = extractTranscriptText(true, false);

      expect(result).toContain('[0:00]');
      expect(result).toContain('[0:05]');
      expect(result).toContain('[1:30]');
      expect(result).not.toContain('## Chapter 1');
    });

    it('extracts transcript from the new YouTube transcript DOM', () => {
      document.body.innerHTML = `
        <macro-markers-panel-item-view-model>
          <timeline-item-view-model>
            <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
              <div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
              <span class="yt-core-attributed-string">Intro segment for a synthetic policy briefing</span>
            </transcript-segment-view-model>
          </timeline-item-view-model>
        </macro-markers-panel-item-view-model>
        <macro-markers-panel-item-view-model>
          <timeline-item-view-model>
            <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
              <div class="ytwTranscriptSegmentViewModelTimestamp">0:16</div>
              <span class="yt-core-attributed-string">Next we compare two fictional city planning options</span>
            </transcript-segment-view-model>
          </timeline-item-view-model>
        </macro-markers-panel-item-view-model>
      `;

      const result = extractTranscriptText(true);
      expect(result).toContain('[0:00] Intro segment for a synthetic policy briefing');
      expect(result).toContain('[0:16] Next we compare two fictional city planning options');
    });

    it('extracts transcript from the new DOM without timestamps', () => {
      document.body.innerHTML = `
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
          <span class="yt-core-attributed-string">Intro segment for a synthetic policy briefing</span>
        </transcript-segment-view-model>
      `;

      const result = extractTranscriptText(false);
      expect(result).toBe('Intro segment for a synthetic policy briefing');
      expect(result).not.toContain('[0:00]');
    });

    it('cleans up fragmented line breaks when timestamps are disabled', () => {
      document.body.innerHTML = `
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
          <span class="yt-core-attributed-string">They buried themselves</span>
        </transcript-segment-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:05</div>
          <span class="yt-core-attributed-string">deep within lorem ipsum,</span>
        </transcript-segment-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:10</div>
          <span class="yt-core-attributed-string">wreaking synthetic havoc.</span>
        </transcript-segment-view-model>
      `;

      const result = extractTranscriptText(false, true, true);

      expect(result).toBe(
        'They buried themselves deep within lorem ipsum, wreaking synthetic havoc.'
      );
    });

    it('preserves line breaks when cleanup is disabled', () => {
      document.body.innerHTML = `
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
          <span class="yt-core-attributed-string">They buried themselves</span>
        </transcript-segment-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:05</div>
          <span class="yt-core-attributed-string">deep within lorem ipsum.</span>
        </transcript-segment-view-model>
      `;

      const result = extractTranscriptText(false, true, false);

      expect(result).toBe('They buried themselves\ndeep within lorem ipsum.');
    });

    it('does not clean up line breaks when timestamps are enabled', () => {
      document.body.innerHTML = `
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
          <span class="yt-core-attributed-string">They buried themselves</span>
        </transcript-segment-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:05</div>
          <span class="yt-core-attributed-string">deep within lorem ipsum.</span>
        </transcript-segment-view-model>
      `;

      const result = extractTranscriptText(true, true, true);

      expect(result).toBe('[0:00] They buried themselves\n[0:05] deep within lorem ipsum.');
    });

    it('preserves speaker, sound effect, and chapter boundaries during cleanup', () => {
      document.body.innerHTML = `
        <timeline-chapter-view-model class="ytwTimelineChapterViewModelHost">
          <h3 class="ytwTimelineChapterViewModelTitle">Chapter 1: Lorem</h3>
        </timeline-chapter-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
          <span class="yt-core-attributed-string">Look at</span>
        </transcript-segment-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:05</div>
          <span class="yt-core-attributed-string">how many samples appear.</span>
        </transcript-segment-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:10</div>
          <span class="yt-core-attributed-string">- [Researcher] This line starts a speaker turn.</span>
        </transcript-segment-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:15</div>
          <span class="yt-core-attributed-string">(soft synthetic music)</span>
        </transcript-segment-view-model>
      `;

      const result = extractTranscriptText(false, true, true);

      expect(result).toBe(`## Chapter 1: Lorem
Look at how many samples appear.
- [Researcher] This line starts a speaker turn.
(soft synthetic music)`);
    });

    it('extracts transcript text from the latest YouTube DOM using ytAttributedStringHost', () => {
      document.body.innerHTML = `
        <macro-markers-panel-item-view-model class="ytwMacroMarkersPanelItemViewModelHost">
          <timeline-item-view-model>
            <div class="ytwTimelineItemViewModelContentItems">
              <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
                <div aria-hidden="true" class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
                <div class="ytwTranscriptSegmentViewModelTimestampA11yLabel">0 seconds</div>
                <span class="ytAttributedStringHost ytAttributedStringLinkInheritColor" role="text">
                  Lorem ipsum opening segment
                </span>
              </transcript-segment-view-model>
            </div>
          </timeline-item-view-model>
        </macro-markers-panel-item-view-model>
        <macro-markers-panel-item-view-model class="ytwMacroMarkersPanelItemViewModelHost">
          <timeline-item-view-model>
            <div class="ytwTimelineItemViewModelContentItems">
              <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
                <div aria-hidden="true" class="ytwTranscriptSegmentViewModelTimestamp">0:11</div>
                <div class="ytwTranscriptSegmentViewModelTimestampA11yLabel">11 seconds</div>
                <span class="ytAttributedStringHost ytAttributedStringLinkInheritColor" role="text">
                  Dolor sit amet follow up
                </span>
              </transcript-segment-view-model>
            </div>
          </timeline-item-view-model>
        </macro-markers-panel-item-view-model>
      `;

      const result = extractTranscriptText(true);

      expect(result).toContain('[0:00] Lorem ipsum opening segment');
      expect(result).toContain('[0:11] Dolor sit amet follow up');
      expect(result).not.toContain('11 seconds');
    });

    it('keeps chapter headings while extracting latest DOM transcript lines', () => {
      document.body.innerHTML = `
        <macro-markers-panel-item-view-model>
          <timeline-chapter-view-model>
            <div class="ytwTimelineChapterViewModelTimestamp">0:00</div>
            <h3 class="ytwTimelineChapterViewModelTitle">Chapter 1: Lorem</h3>
          </timeline-chapter-view-model>
        </macro-markers-panel-item-view-model>
        <macro-markers-panel-item-view-model>
          <timeline-item-view-model>
            <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
              <div aria-hidden="true" class="ytwTranscriptSegmentViewModelTimestamp">0:05</div>
              <span class="ytAttributedStringHost" role="text">Synthetic chapter body text</span>
            </transcript-segment-view-model>
          </timeline-item-view-model>
        </macro-markers-panel-item-view-model>
      `;

      const result = extractTranscriptText(true);

      expect(result).toContain('## Chapter 1: Lorem');
      expect(result).toContain('[0:05] Synthetic chapter body text');
    });

    it('handles segments without timestamps', () => {
      document.body.innerHTML = `
        <ytd-transcript-segment-renderer>
          <div class="segment-text">Text without timestamp</div>
        </ytd-transcript-segment-renderer>
      `;

      const result = extractTranscriptText(true);
      expect(result).toBe('Text without timestamp');
      expect(result).not.toContain('[');
    });

    it('extracts inline chapter headers from the new YouTube UI', () => {
      document.body.innerHTML = `
        <timeline-chapter-view-model class="ytwTimelineChapterViewModelHost">
          <h3 class="ytwTimelineChapterViewModelTitle">Chapter 1: Introduction</h3>
        </timeline-chapter-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
          <span class="yt-core-attributed-string">Welcome to the video</span>
        </transcript-segment-view-model>
        <timeline-chapter-view-model class="ytwTimelineChapterViewModelHost">
          <h3 class="ytwTimelineChapterViewModelTitle">Chapter 2: Deep Dive</h3>
        </timeline-chapter-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">5:30</div>
          <span class="yt-core-attributed-string">Let us dive deeper</span>
        </transcript-segment-view-model>
      `;

      const result = extractTranscriptText(true);
      expect(result).toContain('## Chapter 1: Introduction');
      expect(result).toContain('[0:00] Welcome to the video');
      expect(result).toContain('## Chapter 2: Deep Dive');
      expect(result).toContain('[5:30] Let us dive deeper');
    });

    it('skips new UI inline chapter headers when includeChapters is false', () => {
      document.body.innerHTML = `
        <timeline-chapter-view-model class="ytwTimelineChapterViewModelHost">
          <h3 class="ytwTimelineChapterViewModelTitle">Chapter 1: Introduction</h3>
        </timeline-chapter-view-model>
        <transcript-segment-view-model class="ytwTranscriptSegmentViewModelHost">
          <div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
          <span class="yt-core-attributed-string">Welcome to the video</span>
        </transcript-segment-view-model>
      `;

      const result = extractTranscriptText(true, false);
      expect(result).not.toContain('## Chapter 1: Introduction');
      expect(result).toContain('[0:00] Welcome to the video');
    });
  });

  describe('extractChapters', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('extracts chapters from old UI (ytd-transcript-section-header-renderer)', () => {
      document.body.innerHTML = `
        <ytd-transcript-section-header-renderer>
          <div class="shelf-header-layout-wiz__title">Introduction</div>
        </ytd-transcript-section-header-renderer>
        <ytd-transcript-section-header-renderer>
          <div class="shelf-header-layout-wiz__title">Main Topic</div>
        </ytd-transcript-section-header-renderer>
      `;

      const chapters = extractChapters();
      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Introduction');
      expect(chapters[1].title).toBe('Main Topic');
    });

    it('extracts chapters from new UI (timeline-chapter-view-model)', () => {
      document.body.innerHTML = `
        <timeline-chapter-view-model class="ytwTimelineChapterViewModelHost">
          <h3 class="ytwTimelineChapterViewModelTitle">Chapter 1: Intro</h3>
        </timeline-chapter-view-model>
        <timeline-chapter-view-model class="ytwTimelineChapterViewModelHost">
          <h3 class="ytwTimelineChapterViewModelTitle">Chapter 2: The Problem</h3>
        </timeline-chapter-view-model>
      `;

      const chapters = extractChapters();
      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Chapter 1: Intro');
      expect(chapters[1].title).toBe('Chapter 2: The Problem');
    });

    it('extracts chapters with timestamps from new UI', () => {
      document.body.innerHTML = `
        <timeline-chapter-view-model class="ytwTimelineChapterViewModelHost">
          <div class="ytwTimelineChapterViewModelTimestamp">0:00</div>
          <h3 class="ytwTimelineChapterViewModelTitle">Chapter 1: Start</h3>
        </timeline-chapter-view-model>
        <timeline-chapter-view-model class="ytwTimelineChapterViewModelHost">
          <div class="ytwTimelineChapterViewModelTimestamp">12:34</div>
          <h3 class="ytwTimelineChapterViewModelTitle">Chapter 2: Middle</h3>
        </timeline-chapter-view-model>
      `;

      const chapters = extractChapters();
      expect(chapters).toHaveLength(2);
      expect(chapters[0]).toEqual({ title: 'Chapter 1: Start', timestamp: '0:00' });
      expect(chapters[1]).toEqual({ title: 'Chapter 2: Middle', timestamp: '12:34' });
    });

    it('returns empty array when no chapters exist', () => {
      document.body.innerHTML = `
        <transcript-segment-view-model>
          <span class="yt-core-attributed-string">Just a segment</span>
        </transcript-segment-view-model>
      `;

      const chapters = extractChapters();
      expect(chapters).toHaveLength(0);
    });
  });

  describe('formatChaptersSection', () => {
    it('formats chapters without timestamps', () => {
      const chapters = [{ title: 'Intro' }, { title: 'Main Topic' }];
      const result = formatChaptersSection(chapters);
      expect(result).toBe('## Chapters\n- Intro\n- Main Topic');
    });

    it('formats chapters with timestamps', () => {
      const chapters = [
        { title: 'Intro', timestamp: '0:00' },
        { title: 'Deep Dive', timestamp: '5:30' },
      ];
      const result = formatChaptersSection(chapters);
      expect(result).toBe('## Chapters\n- Intro (0:00)\n- Deep Dive (5:30)');
    });

    it('returns empty string when no chapters', () => {
      expect(formatChaptersSection([])).toBe('');
    });
  });
});
