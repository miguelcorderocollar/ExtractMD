import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('popup/index module', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="kpi-section"></div>';
  });

  it('initializes popup modules on DOMContentLoaded without last extraction UI', async () => {
    vi.doMock('../../../extension/popup/quickActions.js', () => ({
      initializeQuickActions: vi.fn(),
    }));
    vi.doMock('../../../extension/popup/domainToggle.js', () => ({
      initializeDomainToggle: vi.fn(),
    }));
    vi.doMock('../../../extension/popup/kpiSummary.js', () => ({
      initializeKpiSummary: vi.fn(),
    }));
    vi.doMock('../../../extension/popup/settings.js', () => ({
      initializeSettings: vi.fn(),
    }));
    vi.doMock('../../../extension/shared/theme-manager.js', () => ({
      initializeTheme: vi.fn().mockResolvedValue(undefined),
    }));

    const { initializeQuickActions } = await import('../../../extension/popup/quickActions.js');
    const { initializeDomainToggle } = await import('../../../extension/popup/domainToggle.js');
    const { initializeKpiSummary } = await import('../../../extension/popup/kpiSummary.js');
    const { initializeSettings } = await import('../../../extension/popup/settings.js');
    const { initializeTheme } = await import('../../../extension/shared/theme-manager.js');

    await import('../../../extension/popup/index.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();

    expect(initializeTheme).toHaveBeenCalledTimes(1);
    expect(initializeSettings).toHaveBeenCalledTimes(1);
    expect(initializeQuickActions).toHaveBeenCalledTimes(1);
    expect(initializeDomainToggle).toHaveBeenCalledTimes(1);
    expect(initializeKpiSummary).toHaveBeenCalledTimes(1);
    expect(document.getElementById('lastExtractionSection')).toBeNull();
  });
});
