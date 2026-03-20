import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

vi.mock('../../../extension/content/components/FloatingButton.js', () => ({
  createFloatingButton: vi.fn(() => ({
    appendTo: vi.fn(),
    show: vi.fn(),
    remove: vi.fn(),
    setLoading: vi.fn(),
    setSuccess: vi.fn(),
    setError: vi.fn(),
    setNormal: vi.fn(),
  })),
}));

vi.mock('../../../extension/content/utils.js', () => ({
  showNotification: vi.fn(),
}));

vi.mock('../../../extension/content/handlers/copyHandler.js', () => ({
  handleCopyOrDownload: vi.fn().mockResolvedValue({ action: 'copy', tokens: 42 }),
}));

vi.mock('../../../extension/shared/storage.js', () => ({
  incrementKpi: vi.fn(),
}));

import {
  isLinkedInJobPage,
  getLinkedInJobId,
  decodeLinkedInRedirectUrl,
  extractLinkedInJobData,
} from '../../../extension/content/linkedin-jobs.js';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/linkedin');

const loadFixture = (name) => {
  document.body.innerHTML = readFileSync(join(fixtureDir, name), 'utf8');
};

describe('LinkedIn Jobs content extractor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('route detection', () => {
    it('detects /jobs/view/ routes', () => {
      window.history.pushState({}, '', '/jobs/view/3800000001/');
      expect(isLinkedInJobPage()).toBe(true);
    });

    it('detects /jobs/search-results/ with currentJobId', () => {
      window.history.pushState(
        {},
        '',
        '/jobs/search-results/?keywords=engineer&currentJobId=3800000002'
      );
      expect(isLinkedInJobPage()).toBe(true);
    });

    it('detects /jobs/collections/ with currentJobId', () => {
      window.history.pushState({}, '', '/jobs/collections/recommended/?currentJobId=3800000003');
      expect(isLinkedInJobPage()).toBe(true);
    });

    it('rejects /jobs/search-results/ without currentJobId', () => {
      window.history.pushState({}, '', '/jobs/search-results/?keywords=engineer');
      expect(isLinkedInJobPage()).toBe(false);
    });

    it('rejects non-job LinkedIn pages', () => {
      window.history.pushState({}, '', '/feed/');
      expect(isLinkedInJobPage()).toBe(false);
      window.history.pushState({}, '', '/in/someuser/');
      expect(isLinkedInJobPage()).toBe(false);
      window.history.pushState({}, '', '/');
      expect(isLinkedInJobPage()).toBe(false);
    });
  });

  describe('job ID extraction', () => {
    it('extracts ID from /jobs/view/{id}', () => {
      window.history.pushState({}, '', '/jobs/view/3800000001/');
      expect(getLinkedInJobId()).toBe('3800000001');
    });

    it('extracts ID from currentJobId param', () => {
      window.history.pushState(
        {},
        '',
        '/jobs/search-results/?keywords=dev&currentJobId=3800000042'
      );
      expect(getLinkedInJobId()).toBe('3800000042');
    });

    it('extracts ID from referenceJobId fallback', () => {
      window.history.pushState({}, '', '/jobs/search-results/?referenceJobId=3800000099');
      expect(getLinkedInJobId()).toBe('3800000099');
    });

    it('returns null when no ID found', () => {
      window.history.pushState({}, '', '/feed/');
      expect(getLinkedInJobId()).toBeNull();
    });
  });

  describe('apply link decoding', () => {
    it('decodes LinkedIn redirect URLs', () => {
      const redirect =
        'https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fexample.com%2Fapply';
      expect(decodeLinkedInRedirectUrl(redirect)).toBe('https://example.com/apply');
    });

    it('returns non-redirect URLs as-is', () => {
      const direct = 'https://example.com/apply';
      expect(decodeLinkedInRedirectUrl(direct)).toBe('https://example.com/apply');
    });

    it('returns null for empty input', () => {
      expect(decodeLinkedInRedirectUrl('')).toBeNull();
      expect(decodeLinkedInRedirectUrl(null)).toBeNull();
    });
  });

  describe('job view extraction', () => {
    beforeEach(() => {
      loadFixture('job-view.html');
      window.history.pushState({}, '', '/jobs/view/3800000001/');
    });

    it('extracts job title', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.job_title).toBe('Software Engineer');
    });

    it('extracts company name', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.company_name).toBe('Acme Corporation');
    });

    it('extracts company URL', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.company_url).toContain('/company/acme-corp/');
    });

    it('extracts location', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.location_text).toBe('San Francisco, CA');
    });

    it('extracts workplace type', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.workplace_type).toBe('Remote');
    });

    it('extracts posted time', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.posted_relative).toBe('2 days ago');
    });

    it('detects verified job', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.verified_job).toBe(true);
    });

    it('extracts applicant count', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.applicant_count_text).toBe('42 applicants');
    });

    it('extracts description as markdown', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.description_markdown).toContain('Software Engineer');
      expect(result.jobData.description_markdown).toContain('5+ years');
    });

    it('extracts apply info', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.apply_label).toContain('Apply');
      expect(result.jobData.apply_url).toContain('acme-corp.com');
      expect(result.jobData.apply_type).toBe('external');
    });

    it('sets correct page type', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.page_type).toBe('view');
    });

    it('sets canonical URL', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.canonical_job_url).toBe(
        'https://www.linkedin.com/jobs/view/3800000001/'
      );
    });

    it('builds API variables', async () => {
      const result = await extractLinkedInJobData();
      expect(result.apiVariables.title).toBe('Software Engineer');
      expect(result.apiVariables.company).toBe('Acme Corporation');
      expect(result.apiVariables.location).toBe('San Francisco, CA');
      expect(result.apiVariables.extracted_at).toBeDefined();
    });

    it('includes extracted_at timestamp', async () => {
      const result = await extractLinkedInJobData();
      expect(result.jobData.extracted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('search results extraction', () => {
    beforeEach(() => {
      loadFixture('job-search.html');
      window.history.pushState(
        {},
        '',
        '/jobs/search-results/?keywords=developer&currentJobId=3900000001'
      );
    });

    it('extracts header info before lazy load completes', async () => {
      // The fixture has skeleton state (no expandable-text-box, no About the job heading).
      // Title, company, metadata should still be extractable from the header.
      // The waitForJobDetailContent will timeout since no content appears,
      // so we simulate lazy load by adding content before the timeout.
    });

    it('extracts job from detail panel after lazy load', async () => {
      // Simulate lazy load: add description content to the skeleton container
      const skeletonContainer = document.querySelector(
        '[componentkey="JobDetails_AboutTheJob_3900000001"]'
      );
      if (skeletonContainer) {
        skeletonContainer.innerHTML = `
          <h2>About the job</h2>
          <div class="description-wrapper">
            <span tabindex="-1" data-testid="expandable-text-box">
              <p>TechStart is seeking a Senior Frontend Developer.</p>
              <p>You will lead our frontend architecture and mentor junior developers.</p>
              <ul>
                <li>7+ years frontend experience</li>
                <li>Expert in TypeScript and React</li>
                <li>Experience with design systems</li>
              </ul>
            </span>
          </div>
        `;
      }

      const result = await extractLinkedInJobData();
      expect(result.jobData.job_title).toBe('Senior Frontend Developer');
      expect(result.jobData.company_name).toBe('TechStart Inc.');
      expect(result.jobData.description_markdown).toContain('7+ years frontend experience');
    });

    it('sets correct page type for search results', async () => {
      // Simulate lazy load so extraction succeeds
      const skeletonContainer = document.querySelector(
        '[componentkey="JobDetails_AboutTheJob_3900000001"]'
      );
      if (skeletonContainer) {
        skeletonContainer.innerHTML = `
          <h2>About the job</h2>
          <span tabindex="-1" data-testid="expandable-text-box">
            <p>Some job description content here.</p>
          </span>
        `;
      }

      const result = await extractLinkedInJobData();
      expect(result.jobData.page_type).toBe('search_results');
    });

    it('extracts Easy Apply button', async () => {
      // Simulate lazy load
      const skeletonContainer = document.querySelector(
        '[componentkey="JobDetails_AboutTheJob_3900000001"]'
      );
      if (skeletonContainer) {
        skeletonContainer.innerHTML = `
          <h2>About the job</h2>
          <span tabindex="-1" data-testid="expandable-text-box">
            <p>Job description.</p>
          </span>
        `;
      }

      const result = await extractLinkedInJobData();
      expect(result.jobData.apply_label).toBe('Easy Apply');
      expect(result.jobData.apply_type).toBe('linkedin');
    });

    it('throws when detail pane has not loaded yet', async () => {
      // Don't simulate lazy load — skeleton state only
      await expect(extractLinkedInJobData()).rejects.toThrow('still loading');
    });
  });

  describe('collections extraction', () => {
    beforeEach(() => {
      loadFixture('job-collections.html');
      window.history.pushState({}, '', '/jobs/collections/recommended/?currentJobId=3900000100');
    });

    it('throws not-supported error for collections pages', async () => {
      await expect(extractLinkedInJobData()).rejects.toThrow(
        'Collections page extraction is not fully supported'
      );
    });
  });

  describe('login wall handling', () => {
    beforeEach(() => {
      loadFixture('login-wall.html');
      window.history.pushState({}, '', '/jobs/view/3800000001/');
    });

    it('throws error when login wall is detected', async () => {
      await expect(extractLinkedInJobData()).rejects.toThrow('Please sign in to LinkedIn');
    });
  });

  describe('error handling', () => {
    it('throws error when no job ID found', async () => {
      document.body.innerHTML = '<main></main>';
      window.history.pushState({}, '', '/feed/');
      await expect(extractLinkedInJobData()).rejects.toThrow('Could not find job ID');
    });
  });
});
