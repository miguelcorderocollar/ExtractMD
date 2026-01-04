import { test, expect } from '@playwright/test';
import { launchWithExtension, getExtensionId } from './helpers/extension.js';

test.describe('ExtractMD Options Page', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    context = await launchWithExtension();
    extensionId = await getExtensionId(context);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('options page opens and displays settings', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Check that main elements are present
    // Sidebar shows "ExtractMD" logo, section header shows "General Settings"
    await expect(page.locator('.logo')).toContainText('ExtractMD');
    await expect(page.locator('h2:has-text("General Settings")')).toBeVisible();
  });

  test('displays all navigation sections', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Check for all sidebar navigation items
    await expect(page.locator('.nav-item:has-text("General")')).toBeVisible();
    await expect(page.locator('.nav-item:has-text("YouTube")')).toBeVisible();
    await expect(page.locator('.nav-item:has-text("Hacker News")')).toBeVisible();
    await expect(page.locator('.nav-item:has-text("Articles")')).toBeVisible();
    await expect(page.locator('.nav-item:has-text("Universal")')).toBeVisible();
    await expect(page.locator('.nav-item:has-text("Workflow")')).toBeVisible();
    await expect(page.locator('.nav-item:has-text("Data")')).toBeVisible();
  });

  test('can toggle a setting', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Clear localStorage to ensure clean state
    await page.evaluate(() => localStorage.clear());

    // Reload to apply clean state
    await page.reload();

    // Wait for page to fully load and initialize
    await page.waitForLoadState('networkidle');

    // Navigate to YouTube section via sidebar
    await page.locator('.nav-item[data-section="youtube"]').click();
    await page.waitForTimeout(500); // Wait for section transition

    // Check YouTube Settings section is active (has active class)
    const youtubeSection = page.locator('#section-youtube');
    await expect(youtubeSection).toHaveClass(/active/);

    // Check YouTube Settings section is visible
    await expect(page.locator('h2:has-text("YouTube Settings")')).toBeVisible();

    const checkbox = page.locator('#includeTimestamps');
    await expect(checkbox).toHaveCount(1); // Element exists
    await expect(checkbox).toHaveAttribute('type', 'checkbox'); // Correct type

    // Wait for the checkbox to be properly initialized
    await page.waitForTimeout(200);

    const initialState = await checkbox.isChecked();

    // Click the toggle switch label (parent of the hidden input)
    const toggleSwitch = checkbox.locator('xpath=ancestor::label[1]');
    await toggleSwitch.click();

    // Wait a bit for setting to save
    await page.waitForTimeout(100);

    // Reload options page
    await page.reload();

    // Re-navigate to YouTube section
    await page.locator('.nav-item:has-text("YouTube")').click();
    await page.waitForTimeout(300);

    // Check if state persisted
    const newState = await page.locator('#includeTimestamps').isChecked();
    expect(newState).toBe(!initialState);

    // Reset to initial state
    if (newState !== initialState) {
      const resetCheckbox = page.locator('#includeTimestamps').locator('xpath=ancestor::label[1]');
      await resetCheckbox.click();
      await page.waitForTimeout(100);
    }
  });

  test('displays KPI counters with clear button', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Navigate to Data section where KPI is located
    await page.locator('.nav-item:has-text("Data")').click();
    await page.waitForTimeout(300);

    // Check Data & Statistics section is visible
    await expect(page.locator('h2:has-text("Data & Statistics")')).toBeVisible();

    const kpiCounters = page.locator('#kpi-counters');
    await expect(kpiCounters).toBeVisible();

    const clearBtn = page.locator('#clearKpiBtn');
    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toContainText('Clear');
  });

  test('displays import/export buttons', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Navigate to Data section where import/export buttons are located
    await page.locator('.nav-item:has-text("Data")').click();
    await page.waitForTimeout(300);

    const exportBtn = page.locator('#exportSettingsBtn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('Export Settings');

    const importBtn = page.locator('#importSettingsBtn');
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toContainText('Import Settings');
  });

  test('floating button settings persist across page reloads', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Clear localStorage to ensure clean state
    await page.evaluate(() => localStorage.clear());

    // Reload to apply clean state
    await page.reload();

    // Wait for page to fully load and initialize
    await page.waitForLoadState('networkidle');

    // General section should be active by default
    const generalSection = page.locator('#section-general');
    await expect(generalSection).toHaveClass(/active/);

    // General section should be active by default with Floating Button settings group
    await expect(page.locator('h3.group-title:has-text("Floating Button")')).toBeVisible();

    // Wait for settings to be loaded
    await page.waitForTimeout(200);

    // Toggle "Enable Drag" setting
    const dragToggle = page.locator('#floatingButtonEnableDrag');
    await expect(dragToggle).toHaveCount(1); // Element exists
    await expect(dragToggle).toHaveAttribute('type', 'checkbox'); // Correct type
    const initialDragState = await dragToggle.isChecked();
    // Click the toggle switch label (parent of the hidden input)
    const dragToggleSwitch = dragToggle.locator('xpath=ancestor::label[1]');
    await dragToggleSwitch.click();
    await page.waitForTimeout(100);

    // Toggle "Enable Dismiss" setting
    const dismissToggle = page.locator('#floatingButtonEnableDismiss');
    await expect(dismissToggle).toHaveCount(1);
    await expect(dismissToggle).toHaveAttribute('type', 'checkbox');
    const initialDismissState = await dismissToggle.isChecked();
    // Click the toggle switch label (parent of the hidden input)
    const dismissToggleSwitch = dismissToggle.locator('xpath=ancestor::label[1]');
    await dismissToggleSwitch.click();
    await page.waitForTimeout(100);

    // Change button size
    const sizeSelect = page.locator('#floatingButtonSize');
    await expect(sizeSelect).toHaveCount(1);
    await sizeSelect.selectOption('large');
    await page.waitForTimeout(100);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(300);

    // Verify settings persisted
    const newDragToggle = page.locator('#floatingButtonEnableDrag');
    await expect(newDragToggle).toHaveCount(1);
    const newDragState = await newDragToggle.isChecked();
    expect(newDragState).toBe(!initialDragState);

    const newDismissToggle = page.locator('#floatingButtonEnableDismiss');
    await expect(newDismissToggle).toHaveCount(1);
    const newDismissState = await newDismissToggle.isChecked();
    expect(newDismissState).toBe(!initialDismissState);

    const newSizeSelect = page.locator('#floatingButtonSize');
    await expect(newSizeSelect).toHaveCount(1);
    const newSize = await newSizeSelect.inputValue();
    expect(newSize).toBe('large');

    // Reset to original values
    if (newDragState !== initialDragState) {
      const resetDragToggle = page
        .locator('#floatingButtonEnableDrag')
        .locator('xpath=ancestor::label[1]');
      await resetDragToggle.click();
      await page.waitForTimeout(100);
    }
    if (newDismissState !== initialDismissState) {
      const resetDismissToggle = page
        .locator('#floatingButtonEnableDismiss')
        .locator('xpath=ancestor::label[1]');
      await resetDismissToggle.click();
      await page.waitForTimeout(100);
    }
    if (newDismissState !== initialDismissState) {
      const resetDismissToggle = page
        .locator('setting-toggle[setting-id="floatingButtonEnableDismiss"] input')
        .locator('xpath=ancestor::label[1]');
      await resetDismissToggle.click();
      await page.waitForTimeout(100);
    }
    await page
      .locator('setting-select[setting-id="floatingButtonSize"] select')
      .selectOption('medium');
    await page.waitForTimeout(100);
  });

  test('displays reset positions button and can reset positions', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Navigate to Data section where reset button is located
    await page.locator('[data-section="data"]').click();
    await page.waitForTimeout(300);

    // Check that Reset Data section is visible
    await expect(page.locator('text=Reset Data')).toBeVisible();

    // Check that reset button is visible
    const resetBtn = page.locator('#resetPositionsBtn');
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toContainText('Reset Positions');

    // Set up a dialog handler to accept the confirmation
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('reset all floating button positions');
      await dialog.accept();
    });

    // Click the reset button
    await resetBtn.click();
    await page.waitForTimeout(500); // Wait for async operation

    // Check for success message
    const statusMessage = page.locator('#status');
    await expect(statusMessage).toBeVisible();
    await expect(statusMessage).toContainText('positions have been reset');
  });
});
