const esbuild = require('esbuild');

// Content script bundle
esbuild.build({
  entryPoints: ['extension/content.js'],
  bundle: true,
  outfile: 'extension/dist/content.js',
  format: 'iife', // ensures all code is in a single closure, no import/export
  sourcemap: true,
  target: ['chrome58'], // or your minimum Chrome version
  logLevel: 'info',
  // minify: true, // enable for production
}).catch(() => process.exit(1));

// Popup bundle
esbuild.build({
  entryPoints: ['extension/popup/index.js'],
  bundle: true,
  outfile: 'extension/dist/popup.js',
  format: 'iife',
  sourcemap: true,
  target: ['chrome58'],
  logLevel: 'info',
  // minify: true, // enable for production
}).catch(() => process.exit(1));
