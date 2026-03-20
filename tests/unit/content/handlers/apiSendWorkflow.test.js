import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../extension/content/handlers/apiHandler.js', () => ({
  sendToConfiguredApi: vi.fn(),
}));

vi.mock('../../../../extension/content/utils.js', () => ({
  showNotification: vi.fn(),
}));

import { sendToConfiguredApi } from '../../../../extension/content/handlers/apiHandler.js';
import { showNotification } from '../../../../extension/content/utils.js';
import { runIntegrationApiSend } from '../../../../extension/content/handlers/apiSendWorkflow.js';

describe('content/handlers/apiSendWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('returns early when API send is already processing', async () => {
    const setIsProcessing = vi.fn();
    const prepareVariables = vi.fn();

    await runIntegrationApiSend({
      integration: 'x',
      getIsProcessing: () => true,
      setIsProcessing,
      prepareVariables,
      defaultErrorMessage: 'Failed',
    });

    expect(setIsProcessing).not.toHaveBeenCalled();
    expect(prepareVariables).not.toHaveBeenCalled();
    expect(sendToConfiguredApi).not.toHaveBeenCalled();
  });

  it('runs success flow and resets floating button state', async () => {
    vi.useFakeTimers();
    sendToConfiguredApi.mockResolvedValue({ ok: true });

    const setIsProcessing = vi.fn();
    const setLoading = vi.fn();
    const setSuccess = vi.fn();
    const setNormal = vi.fn();
    const controller = { setLoading, setSuccess, setNormal };
    const prepareVariables = vi.fn().mockResolvedValue({ content: 'Synthetic content' });

    await runIntegrationApiSend({
      integration: 'youtube',
      profileId: 'profile-a',
      updateButton: true,
      getIsProcessing: () => false,
      setIsProcessing,
      getFloatingButtonController: () => controller,
      prepareVariables,
      defaultErrorMessage: 'Failed to send',
    });

    expect(setIsProcessing).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledTimes(1);
    expect(prepareVariables).toHaveBeenCalledTimes(1);
    expect(sendToConfiguredApi).toHaveBeenCalledWith({
      integration: 'youtube',
      variables: { content: 'Synthetic content' },
      profileId: 'profile-a',
    });
    expect(setSuccess).toHaveBeenCalledTimes(1);
    expect(setIsProcessing).not.toHaveBeenCalledWith(false);

    vi.advanceTimersByTime(2000);
    expect(setNormal).toHaveBeenCalledTimes(1);
    expect(setIsProcessing).toHaveBeenLastCalledWith(false);
  });

  it('shows resolved error message and resets error state', async () => {
    vi.useFakeTimers();
    sendToConfiguredApi.mockRejectedValue(new Error('Synthetic dispatch failed'));

    const setIsProcessing = vi.fn();
    const setLoading = vi.fn();
    const setError = vi.fn();
    const setNormal = vi.fn();
    const onError = vi.fn();
    const controller = { setLoading, setError, setNormal };

    await runIntegrationApiSend({
      integration: 'hackernews',
      updateButton: true,
      getIsProcessing: () => false,
      setIsProcessing,
      getFloatingButtonController: () => controller,
      prepareVariables: async () => ({ content: 'Synthetic HN content' }),
      defaultErrorMessage: 'Fallback message',
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith('Synthetic dispatch failed', 'error');
    expect(setError).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    expect(setNormal).toHaveBeenCalledTimes(1);
    expect(setIsProcessing).toHaveBeenLastCalledWith(false);
  });
});
