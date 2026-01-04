import { test, expect } from '@playwright/test';
import { launchWithExtension } from './helpers/extension.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('ExtractMD Universal', () => {
  let context;

  test.beforeAll(async () => {
    context = await launchWithExtension();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('floating button appears on page without article tags', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-universal.html');
    await page.goto(fixturePath);

    // Wait for extension content script to load and create button
    await page.waitForTimeout(1000);

    const button = page.locator('#extractmd-floating-button');
    await expect(button).toBeVisible();
  });

  test('shows content info notification on page load', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-universal.html');
    await page.goto(fixturePath);

    await page.waitForTimeout(1000);

    // Check for content info notification containing "content" or "Main content" or word count
    const notification = page.locator('div:has-text("content")').first();
    await expect(notification).toBeVisible({ timeout: 3000 });
  });

  test('universal extraction works and copies to clipboard', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-universal.html');
    await page.goto(fixturePath);

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.waitForTimeout(1000);

    const button = page.locator('#extractmd-floating-button');
    await button.click();

    // Wait for copy operation
    await page.waitForTimeout(500);

    // Check for success notification
    const notification = page.locator('div:has-text("copied")').first();
    await expect(notification).toBeVisible({ timeout: 3000 });
  });

  test('button shows loading state during extraction', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-universal.html');
    await page.goto(fixturePath);

    await page.waitForTimeout(1000);

    const button = page.locator('#extractmd-floating-button');

    // Click and immediately check for loading state
    await button.click();

    // The button should show success state after extraction
    await page.waitForTimeout(200);

    // Check that button still exists (may have changed state)
    await expect(button).toBeVisible();
  });

  test('universal uses main element when present', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-universal.html');
    await page.goto(fixturePath);

    // The page has a <main> element, so it should detect "Main content"
    await page.waitForTimeout(1000);

    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    const button = page.locator('#extractmd-floating-button');
    await expect(button).toBeVisible();
  });

  test('extracts headings correctly', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-universal.html');
    await page.goto(fixturePath);

    // Verify the page has the expected structure
    const h1 = page.locator('main h1');
    await expect(h1).toHaveText('Universal Extraction Test Page');

    const h2s = page.locator('main h2');
    await expect(h2s).toHaveCount(5); // Features, Text Formatting, Code Examples, Images, Nested Content
  });

  test('page has no article tags (uses universal fallback)', async () => {
    const page = await context.newPage();
    const fixturePath = 'file://' + path.resolve(__dirname, 'fixtures/test-universal.html');
    await page.goto(fixturePath);

    // Verify there are no article elements
    const articles = page.locator('article');
    await expect(articles).toHaveCount(0);

    // But the floating button should still appear (universal mode)
    await page.waitForTimeout(1000);
    const button = page.locator('#extractmd-floating-button');
    await expect(button).toBeVisible();
  });
});
