import { defineConfig } from '@playwright/test';

// Chrome extensions require headed mode, but we use xvfb in CI
// Set HEADLESS=true to run without visible browser (won't work with extensions)
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,

  // Retry failed tests in CI for stability
  retries: isCI ? 2 : 0,

  // Run tests in parallel in CI
  workers: isCI ? 1 : undefined,

  // Reporter configuration
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : [['html', { open: 'on-failure' }]],

  use: {
    // Extensions require headed mode - xvfb provides virtual display in CI
    headless: false,

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Capture trace on first retry
    trace: 'on-first-retry',
  },

  projects: [{ name: 'chromium', use: { channel: 'chrome' } }],

  // Output directory for test artifacts
  outputDir: 'test-results/',
});
