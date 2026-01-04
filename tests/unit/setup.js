import { vi } from 'vitest';

// Mock chrome.storage.sync
const mockStorage = {};

// Mock chrome.storage.local
const mockLocalStorage = {};

global.chrome = {
  storage: {
    sync: {
      get: vi.fn((keys, callback) => {
        let result = {};

        if (keys === null) {
          // get(null) should return all stored data
          result = { ...mockStorage };
        } else {
          let defaults = {};

          if (typeof keys === 'string') {
            defaults = { [keys]: undefined };
          } else if (Array.isArray(keys)) {
            keys.forEach((k) => (defaults[k] = undefined));
          } else {
            defaults = keys || {};
          }

          for (const key of Object.keys(defaults)) {
            result[key] = mockStorage[key] !== undefined ? mockStorage[key] : defaults[key];
          }
        }

        if (callback) callback(result);
        return Promise.resolve(result); // Support promise-based calls if any
      }),
      set: vi.fn((items, callback) => {
        Object.assign(mockStorage, items);
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: vi.fn((keys, callback) => {
        const keysArr = Array.isArray(keys) ? keys : [keys];
        keysArr.forEach((k) => delete mockStorage[k]);
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: vi.fn((callback) => {
        Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
        if (callback) callback();
        return Promise.resolve();
      }),
    },
    local: {
      get: vi.fn((keys, callback) => {
        const result = {};
        let defaults = {};

        if (typeof keys === 'string') {
          defaults = { [keys]: undefined };
        } else if (Array.isArray(keys)) {
          keys.forEach((k) => (defaults[k] = undefined));
        } else {
          defaults = keys || {};
        }

        for (const key of Object.keys(defaults)) {
          result[key] = mockLocalStorage[key] !== undefined ? mockLocalStorage[key] : defaults[key];
        }

        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: vi.fn((items, callback) => {
        Object.assign(mockLocalStorage, items);
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: vi.fn((keys, callback) => {
        const keysArr = Array.isArray(keys) ? keys : [keys];
        keysArr.forEach((k) => delete mockLocalStorage[k]);
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: vi.fn((callback) => {
        Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]);
        if (callback) callback();
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    getURL: vi.fn((path) => `chrome-extension://mock-id/${path}`),
  },
  tabs: {
    query: vi.fn((opts, callback) => {
      const tabs = [{ id: 1, url: 'https://example.com', hostname: 'example.com' }];
      if (callback) callback(tabs);
      return Promise.resolve(tabs);
    }),
    create: vi.fn(),
    remove: vi.fn(),
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
  },
};

// Helper to reset storage between tests
export function resetMockStorage() {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
}
