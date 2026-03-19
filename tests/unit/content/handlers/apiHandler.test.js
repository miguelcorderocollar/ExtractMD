import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../extension/shared/storage.js', () => ({
  getSettings: vi.fn(),
  getApiProfileSecrets: vi.fn(),
}));

vi.mock('../../../../extension/shared/api/index.js', () => ({
  getActiveApiProfile: vi.fn(),
  mergeApiVariables: vi.fn((base, secret) => ({ ...base, ...secret })),
  buildResolvedApiRequest: vi.fn(),
}));

vi.mock('../../../../extension/content/utils.js', () => ({
  showNotification: vi.fn(),
}));

import { sendToConfiguredApi } from '../../../../extension/content/handlers/apiHandler.js';
import { getSettings, getApiProfileSecrets } from '../../../../extension/shared/storage.js';
import {
  buildResolvedApiRequest,
  getActiveApiProfile,
} from '../../../../extension/shared/api/index.js';
import { showNotification } from '../../../../extension/content/utils.js';

describe('content/handlers/apiHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    chrome.runtime.sendMessage = vi.fn((payload, callback) => {
      callback({ success: true, result: { status: 200 } });
    });

    getSettings.mockResolvedValue({
      apiOutputEnabled: true,
      apiEnabledForX: true,
    });

    getActiveApiProfile.mockReturnValue({
      id: 'default',
      enabled: true,
      method: 'POST',
      url: 'https://example.test/receiver',
    });

    getApiProfileSecrets.mockResolvedValue({ secret_api_token: 'abc' });
    buildResolvedApiRequest.mockReturnValue({
      method: 'POST',
      url: 'https://example.test/receiver',
      headers: { Authorization: 'Bearer abc' },
      body: '{"ok":true}',
    });
  });

  it('rejects when API output is disabled', async () => {
    getSettings.mockResolvedValue({
      apiOutputEnabled: false,
      apiEnabledForX: true,
    });

    await expect(
      sendToConfiguredApi({ integration: 'x', variables: { author: 'Test' } })
    ).rejects.toThrow(/API output mode is disabled/);
  });

  it('rejects when integration is disabled', async () => {
    getSettings.mockResolvedValue({
      apiOutputEnabled: true,
      apiEnabledForX: false,
    });

    await expect(
      sendToConfiguredApi({ integration: 'x', variables: { author: 'Test' } })
    ).rejects.toThrow(/not enabled for x/i);
  });

  it('dispatches request via background and shows success notification', async () => {
    const result = await sendToConfiguredApi({
      integration: 'x',
      variables: { author: 'Synthetic Author' },
    });

    expect(result).toEqual({ status: 200 });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'dispatchApiRequest',
        request: expect.objectContaining({
          method: 'POST',
        }),
      }),
      expect.any(Function)
    );
    expect(showNotification).toHaveBeenCalled();
  });
});
