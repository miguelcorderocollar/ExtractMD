import { test, expect } from '@playwright/test';
import { launchWithExtension, getExtensionId } from './helpers/extension.js';

test.describe('ExtractMD Popup', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    context = await launchWithExtension();
    extensionId = await getExtensionId(context);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('popup opens and displays quick actions', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Check that main elements are present
    await expect(page.locator('text=ExtractMD')).toBeVisible();
    // Note: extractNowBtn is hidden when no active tab with content script
    // This is correct behavior - the button only shows when extraction is available
    await expect(page.locator('#openSettingsBtn')).toBeVisible();
  });

  test('Extract Now button exists in DOM', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Button exists in DOM but may be hidden when no active tab with content
    const extractBtn = page.locator('#extractNowBtn');
    await expect(extractBtn).toHaveCount(1);
    await expect(extractBtn).toHaveText(/Extract Now/);
  });

  test('displays KPI counters', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const kpiSection = page.locator('#kpi-section');
    await expect(kpiSection).toBeVisible();

    const kpiCounters = page.locator('#kpi-counters');
    await expect(kpiCounters).toBeVisible();
  });

  test('displays domain toggle section', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const domainBar = page.locator('.domain-bar');
    await expect(domainBar).toBeVisible();

    const toggleBtn = page.locator('#toggleDomainBtn');
    // Button is hidden when no active tab with domain
    await expect(toggleBtn).toBeHidden();
  });

  test('settings button is visible', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const settingsBtn = page.locator('#openSettingsBtn');
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toContainText('Settings');
  });

  test('global enable toggle works and persists', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Check that global enable toggle exists and is visible
    const toggleLabel = page.locator('.toggle-switch').first(); // The label containing the globalEnabled input
    await expect(toggleLabel).toBeVisible();

    // Check label and description are visible
    await expect(page.locator('text=Enabled')).toBeVisible();
    await expect(page.locator('text=Master switch for all functionality')).toBeVisible();

    // Wait for initialization
    await page.waitForTimeout(200);

    // Get initial state from the hidden input
    const globalInput = page.locator('#globalEnabled');
    const initialState = await globalInput.isChecked();
    expect(initialState).toBe(true); // Should be enabled by default

    // Toggle the switch off by clicking the label
    await toggleLabel.click();

    // Wait for setting to save
    await page.waitForTimeout(100);

    // Verify toggle is now unchecked
    const newState = await globalInput.isChecked();
    expect(newState).toBe(false);

    // Reload popup to test persistence
    await page.reload();
    await page.waitForTimeout(200);

    // Verify state persisted
    const persistedState = await page.locator('#globalEnabled').isChecked();
    expect(persistedState).toBe(false);

    // Toggle back to enabled state for cleanup
    const resetLabel = page.locator('.toggle-switch').first();
    await resetLabel.click();
    await page.waitForTimeout(100);

    // Verify it's back to enabled
    const resetState = await page.locator('#globalEnabled').isChecked();
    expect(resetState).toBe(true);
  });
});
