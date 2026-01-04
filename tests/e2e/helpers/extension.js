import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function launchWithExtension() {
  const extensionPath = path.resolve(__dirname, '../../../extension');

  // Use Playwright's bundled Chromium with 'chromium' channel for headless extension support
  // See: https://playwright.dev/docs/chrome-extensions
  const context = await chromium.launchPersistentContext('', {
    headless: true,
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      // Required for CI environments (GitHub Actions, Docker, etc.)
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  // For Manifest V3, wait for the service worker to load
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 15000 });
  }

  return context;
}

export async function getExtensionId(context) {
  // For Manifest V3, get extension ID from service worker URL
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }

  // Service worker URL format: chrome-extension://<extension-id>/background.js
  const extensionId = serviceWorker.url().split('/')[2];
  return extensionId;
}
