// OpenRouter API Client
// Handles communication with OpenRouter API for AI chat

/**
 * Custom error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
  constructor(type, message, statusCode = null, details = null) {
    super(message);
    this.name = 'OpenRouterError';
    this.type = type; // 'no_api_key', 'rate_limit', 'network', 'api_error', 'invalid_response'
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Send chat completion request to OpenRouter API
 * @param {Object} params - Request parameters
 * @param {string} params.apiKey - OpenRouter API key
 * @param {string} params.model - Model ID (e.g., 'nvidia/nemotron-3-nano-30b-a3b:free')
 * @param {Array} params.messages - Array of message objects with role and content
 * @param {number} params.temperature - Temperature for response generation (0-2)
 * @returns {Promise<string>} Assistant's response content
 * @throws {OpenRouterError} On API or network errors
 */
export async function sendChatCompletion({ apiKey, model, messages, temperature = 1.0 }) {
  if (!apiKey || apiKey.trim() === '') {
    throw new OpenRouterError('no_api_key', 'API key is required');
  }

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  const requestBody = {
    model,
    messages,
    temperature,
  };

  console.debug('[ExtractMD OpenRouter] Sending request:', {
    model,
    messageCount: messages.length,
    temperature,
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://extractmd.miguelcorderocollar.com',
        'X-Title': 'ExtractMD',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { message: errorText };
      }

      console.error('[ExtractMD OpenRouter] API error:', {
        status: response.status,
        details: errorDetails,
      });

      // Map HTTP status codes to error types
      if (response.status === 429) {
        throw new OpenRouterError(
          'rate_limit',
          'Rate limit exceeded (50 requests/day for free tier)',
          response.status,
          errorDetails
        );
      } else if (response.status === 401 || response.status === 403) {
        throw new OpenRouterError(
          'api_error',
          'Invalid API key. Please check your settings.',
          response.status,
          errorDetails
        );
      } else if (response.status === 400) {
        throw new OpenRouterError(
          'api_error',
          'Invalid request. Try a different model or check your message.',
          response.status,
          errorDetails
        );
      } else if (response.status >= 500) {
        throw new OpenRouterError(
          'api_error',
          'OpenRouter server error. Please try again later.',
          response.status,
          errorDetails
        );
      } else {
        throw new OpenRouterError(
          'api_error',
          `API error: ${response.status} ${response.statusText}`,
          response.status,
          errorDetails
        );
      }
    }

    // Parse response
    const data = await response.json();

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[ExtractMD OpenRouter] Invalid response structure:', data);
      throw new OpenRouterError(
        'invalid_response',
        'Received invalid response from API',
        null,
        data
      );
    }

    const content = data.choices[0].message.content;

    if (!content || typeof content !== 'string') {
      console.error('[ExtractMD OpenRouter] Missing or invalid content:', data);
      throw new OpenRouterError(
        'invalid_response',
        'Response content is missing or invalid',
        null,
        data
      );
    }

    console.debug('[ExtractMD OpenRouter] Response received:', {
      contentLength: content.length,
      model: data.model,
    });

    return content;
  } catch (error) {
    // Re-throw OpenRouterError as-is
    if (error instanceof OpenRouterError) {
      throw error;
    }

    // Handle network errors
    console.error('[ExtractMD OpenRouter] Network error:', error);
    throw new OpenRouterError('network', 'Network error. Please check your connection.', null, {
      originalError: error.message,
    });
  }
}

/**
 * Format chat history for OpenRouter API
 * Filters out UI-only system messages and prepends system prompt
 * @param {Array} chatHistory - Array of chat messages from UI
 * @param {string} systemPrompt - System prompt to prepend
 * @returns {Array} Formatted messages for API
 */
export function formatMessagesForAPI(chatHistory, systemPrompt) {
  // Start with system prompt if provided
  const messages = [];

  if (systemPrompt && systemPrompt.trim()) {
    messages.push({
      role: 'system',
      content: systemPrompt.trim(),
    });
  }

  // Filter and format chat history
  // Only include user and assistant messages (skip UI-only system messages)
  chatHistory.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  });

  return messages;
}
