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

    it('extracts job title', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.job_title).toBe('Software Engineer');
    });

    it('extracts company name', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.company_name).toBe('Acme Corporation');
    });

    it('extracts company URL', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.company_url).toContain('/company/acme-corp/');
    });

    it('extracts location', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.location_text).toBe('San Francisco, CA');
    });

    it('extracts workplace type', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.workplace_type).toBe('Remote');
    });

    it('extracts posted time', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.posted_relative).toBe('2 days ago');
    });

    it('detects verified job', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.verified_job).toBe(true);
    });

    it('extracts applicant count', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.applicant_count_text).toBe('42 applicants');
    });

    it('extracts description as markdown', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.description_markdown).toContain('Software Engineer');
      expect(result.jobData.description_markdown).toContain('5+ years');
    });

    it('extracts apply info', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.apply_label).toContain('Apply');
      expect(result.jobData.apply_url).toContain('acme-corp.com');
      expect(result.jobData.apply_type).toBe('external');
    });

    it('sets correct page type', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.page_type).toBe('view');
    });

    it('sets canonical URL', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.canonical_job_url).toBe(
        'https://www.linkedin.com/jobs/view/3800000001/'
      );
    });

    it('builds API variables', () => {
      const result = extractLinkedInJobData();
      expect(result.apiVariables.title).toBe('Software Engineer');
      expect(result.apiVariables.company).toBe('Acme Corporation');
      expect(result.apiVariables.location).toBe('San Francisco, CA');
      expect(result.apiVariables.extracted_at).toBeDefined();
    });

    it('includes extracted_at timestamp', () => {
      const result = extractLinkedInJobData();
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

    it('extracts job from selected detail panel', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.job_title).toBe('Senior Frontend Developer');
      expect(result.jobData.company_name).toBe('TechStart Inc.');
    });

    it('sets correct page type for search results', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.page_type).toBe('search_results');
    });

    it('extracts Easy Apply button', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.apply_label).toBe('Easy Apply');
      expect(result.jobData.apply_type).toBe('linkedin');
    });
  });

  describe('collections extraction', () => {
    beforeEach(() => {
      loadFixture('job-collections.html');
      window.history.pushState({}, '', '/jobs/collections/recommended/?currentJobId=3900000100');
    });

    it('extracts job from collection detail panel', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.job_title).toBe('Data Analyst');
      expect(result.jobData.company_name).toBe('DataWise Analytics');
    });

    it('extracts similar jobs', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.similar_jobs).toHaveLength(1);
      expect(result.jobData.similar_jobs[0].title).toBe('Junior Data Analyst');
      expect(result.jobData.similar_jobs[0].job_id).toBe('3900000100');
    });

    it('decodes apply redirect URL', () => {
      const result = extractLinkedInJobData();
      expect(result.jobData.apply_url).toBe('https://datawise.io/careers/apply/456');
      expect(result.jobData.apply_type).toBe('external');
    });
  });

  describe('login wall handling', () => {
    beforeEach(() => {
      loadFixture('login-wall.html');
      window.history.pushState({}, '', '/jobs/view/3800000001/');
    });

    it('throws error when login wall is detected', () => {
      expect(() => extractLinkedInJobData()).toThrow('Please sign in to LinkedIn');
    });
  });

  describe('error handling', () => {
    it('throws error when no job ID found', () => {
      document.body.innerHTML = '<main></main>';
      window.history.pushState({}, '', '/feed/');
      expect(() => extractLinkedInJobData()).toThrow('Could not find job ID');
    });
  });
});
