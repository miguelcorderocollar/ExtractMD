const esbuild = require('esbuild');

// Bundle content.js
esbuild.build({
  entryPoints: ['extension/content.js'],
  bundle: true,
  outfile: 'extension/dist/content.js',
  format: 'iife',
  sourcemap: true,
  target: ['chrome58'],
  logLevel: 'info',
  // minify: true,
}).catch(() => process.exit(1));

// Bundle sidebar.js (with markdown-it)
esbuild.build({
  entryPoints: ['extension/sidebar.js'],
  bundle: true,
  outfile: 'extension/dist/sidebar.js',
  format: 'iife',
  sourcemap: true,
  target: ['chrome58'],
  logLevel: 'info',
  // minify: true,
}).catch(() => process.exit(1)); 