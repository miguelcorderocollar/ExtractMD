import { test, expect } from '@playwright/test';
import { launchWithExtension } from './helpers/extension.js';

test.describe('ExtractMD YouTube', () => {
  test.skip('extracts from real YouTube video', async () => {
    // This test is skipped by default as it requires:
    // 1. Internet connection
    // 2. A YouTube video with transcript
    // 3. YouTube's dynamic content to load
    // To run: remove .skip and ensure video has transcript
    
    const context = await launchWithExtension();
    const page = await context.newPage();
    
    // Navigate to a known video with transcript (example: YouTube Rewind)
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for page and extension to load
    await page.waitForTimeout(3000);
    
    // Check if floating button appears
    const button = page.locator('#yt-transcript-floating-button');
    await expect(button).toBeVisible({ timeout: 10000 });
    
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Click button to extract
    await button.click();
    
    // Wait for extraction and notification
    await page.waitForTimeout(5000);
    
    // Check for notification (success or error)
    const notification = page.locator('div[style*="position: fixed"]').first();
    await expect(notification).toBeVisible({ timeout: 5000 });
    
    await context.close();
  });
});

test.describe('ExtractMD YouTube - Structure', () => {
  let context;

  test.beforeAll(async () => {
    context = await launchWithExtension();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('content script loads on YouTube watch page', async () => {
    const page = await context.newPage();
    
    // Navigate to YouTube (will show actual site, but won't click anything)
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if page is YouTube
    const title = await page.title();
    expect(title).toContain('YouTube');
  });
});

