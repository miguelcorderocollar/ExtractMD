import { showNotification } from '../utils.js';
import { sendToConfiguredApi } from './apiHandler.js';

function resolveErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallbackMessage;
}

function getFloatingButtonController(getController) {
  if (typeof getController !== 'function') return null;
  return getController();
}

function finishWithButton({ getController, setIsProcessing, stateMethod, resetDelayMs }) {
  const controller = getFloatingButtonController(getController);
  if (!controller || typeof controller[stateMethod] !== 'function') {
    setIsProcessing(false);
    return;
  }

  controller[stateMethod]();
  setTimeout(() => {
    const latestController = getFloatingButtonController(getController);
    if (latestController && typeof latestController.setNormal === 'function') {
      latestController.setNormal();
    }
    setIsProcessing(false);
  }, resetDelayMs);
}

export async function runIntegrationApiSend({
  integration,
  profileId = '',
  updateButton = false,
  defaultErrorMessage,
  getIsProcessing,
  setIsProcessing,
  getFloatingButtonController: getController,
  prepareVariables,
  onError,
}) {
  if (typeof getIsProcessing !== 'function' || typeof setIsProcessing !== 'function') {
    throw new Error('API send workflow requires processing state accessors.');
  }
  if (typeof prepareVariables !== 'function') {
    throw new Error('API send workflow requires a prepareVariables callback.');
  }

  if (getIsProcessing()) return;
  setIsProcessing(true);

  if (updateButton) {
    const controller = getFloatingButtonController(getController);
    if (controller && typeof controller.setLoading === 'function') {
      controller.setLoading();
    }
  }

  try {
    const variables = await prepareVariables();
    await sendToConfiguredApi({
      integration,
      variables,
      profileId,
    });

    if (updateButton) {
      finishWithButton({
        getController,
        setIsProcessing,
        stateMethod: 'setSuccess',
        resetDelayMs: 2000,
      });
      return;
    }

    setIsProcessing(false);
  } catch (error) {
    if (typeof onError === 'function') {
      onError(error);
    }

    const message = resolveErrorMessage(error, defaultErrorMessage);
    showNotification(message, 'error');

    if (updateButton) {
      finishWithButton({
        getController,
        setIsProcessing,
        stateMethod: 'setError',
        resetDelayMs: 3000,
      });
      return;
    }

    setIsProcessing(false);
  }
}
