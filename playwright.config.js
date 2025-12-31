import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    headless: false, // Extensions require headed mode
  },
  projects: [
    { name: 'chromium', use: { channel: 'chrome' } }
  ]
});

