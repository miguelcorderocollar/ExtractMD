import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['extension/__tests__/**/*.test.js'],
    setupFiles: ['extension/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['extension/**/*.js'],
      exclude: ['extension/dist/**', 'extension/__tests__/**']
    }
  }
});

