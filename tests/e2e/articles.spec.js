import { test, expect } from '@playwright/test';
import { launchWithExtension } from './helpers/extension.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('ExtractMD Articles', () => {
  let context;

  test.beforeAll(async () => {
    context = await launchWithExtension();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('floating button appears on single article page', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-article.html');
    await page.goto(fixturePath);
    
    // Wait for extension content script to load and create button
    await page.waitForTimeout(1000);
    
    const button = page.locator('#yt-transcript-floating-button');
    await expect(button).toBeVisible();
  });

  test('floating button appears on multiple articles page', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-multiple-articles.html');
    await page.goto(fixturePath);
    
    await page.waitForTimeout(1000);
    
    const button = page.locator('#yt-transcript-floating-button');
    await expect(button).toBeVisible();
  });

  test('article extraction works', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-article.html');
    await page.goto(fixturePath);
    
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await page.waitForTimeout(1000);
    
    const button = page.locator('#yt-transcript-floating-button');
    await button.click();
    
    // Wait for copy operation
    await page.waitForTimeout(500);
    
    // Check for success notification
    const notification = page.locator('div:has-text("copied")').first();
    await expect(notification).toBeVisible({ timeout: 3000 });
  });
});

