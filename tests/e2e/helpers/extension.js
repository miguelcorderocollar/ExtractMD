import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function launchWithExtension() {
  const extensionPath = path.resolve(__dirname, '../../../extension');
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      // Required for CI environments (GitHub Actions, Docker, etc.)
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ]
  });
  
  // Wait for extension to load (with timeout to prevent hanging)
  await Promise.race([
    context.waitForEvent('page'),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Extension failed to load within 10s')), 10000)
    )
  ]);
  
  return context;
}

export async function getExtensionId(context) {
  // Navigate to chrome://extensions to get extension ID
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  
  // Get extension ID from the page
  const extensionId = await page.evaluate(() => {
    const extensions = document.querySelector('extensions-manager')
      ?.shadowRoot?.querySelector('extensions-item-list')
      ?.shadowRoot?.querySelectorAll('extensions-item');
    
    for (const ext of extensions || []) {
      const name = ext.shadowRoot?.querySelector('#name')?.textContent;
      if (name?.includes('ExtractMD')) {
        return ext.getAttribute('id');
      }
    }
    return null;
  });
  
  await page.close();
  return extensionId;
}

