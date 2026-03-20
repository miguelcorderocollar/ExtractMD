import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
    setupFiles: ['tests/unit/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['extension/**/*.js'],
      exclude: ['extension/dist/**', 'tests/unit/**'],
    },
  },
  plugins: [
    {
      name: 'svg-loader',
      enforce: 'pre',
      load(id) {
        const pathOnly = id.split('?')[0];
        if (pathOnly.endsWith('.svg')) {
          // Trim whitespace and newlines from SVG content (match esbuild `text` loader)
          const svgContent = readFileSync(pathOnly, 'utf-8').trim();
          return `export default ${JSON.stringify(svgContent)}`;
        }
      },
    },
  ],
});
