// AI Chat storage utilities
// Handles API key storage (local) and AI chat settings (sync)

/**
 * Get OpenRouter API key from local storage
 * @returns {Promise<string>} API key or empty string if not set
 */
export async function getApiKey() {
  try {
    const result = await chrome.storage.local.get({ aiChatOpenRouterApiKey: '' });
    return result.aiChatOpenRouterApiKey || '';
  } catch (error) {
    console.error('[ExtractMD] Error getting API key:', error);
    return '';
  }
}

/**
 * Save OpenRouter API key to local storage
 * @param {string} apiKey - The API key to save
 * @returns {Promise<void>}
 */
export async function saveApiKey(apiKey) {
  try {
    await chrome.storage.local.set({ aiChatOpenRouterApiKey: apiKey });
  } catch (error) {
    console.error('[ExtractMD] Error saving API key:', error);
    throw error;
  }
}

/**
 * Check if API key is configured
 * @returns {Promise<boolean>} True if API key exists and is not empty
 */
export async function hasApiKey() {
  const apiKey = await getApiKey();
  return apiKey.length > 0;
}

/**
 * Get all AI chat settings from sync storage
 * @returns {Promise<Object>} AI chat settings with defaults
 */
export async function getAiChatSettings() {
  try {
    const result = await chrome.storage.sync.get({
      aiChatEnabled: false,
      aiChatModel: 'openai/gpt-4o-mini',
      aiChatSystemPrompt: 'You are a helpful assistant analyzing extracted content from web pages.',
      aiChatAutoOpen: false,
      aiChatSendDirectly: true,
      aiChatOutputMode: 'copy',
    });
    return result;
  } catch (error) {
    console.error('[ExtractMD] Error getting AI chat settings:', error);
    return {
      aiChatEnabled: false,
      aiChatModel: 'openai/gpt-4o-mini',
      aiChatSystemPrompt: 'You are a helpful assistant analyzing extracted content from web pages.',
      aiChatAutoOpen: false,
      aiChatSendDirectly: true,
      aiChatOutputMode: 'copy',
    };
  }
}

/**
 * Clear API key from storage
 * @returns {Promise<void>}
 */
export async function clearApiKey() {
  try {
    await chrome.storage.local.remove('aiChatOpenRouterApiKey');
  } catch (error) {
    console.error('[ExtractMD] Error clearing API key:', error);
    throw error;
  }
}
