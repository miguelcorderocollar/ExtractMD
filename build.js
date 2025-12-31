import esbuild from 'esbuild';

// Check for production mode via CLI arg or NODE_ENV
const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

const commonOptions = {
  bundle: true,
  format: 'iife',
  target: ['chrome88'], // Modern Chrome for Manifest V3
  logLevel: 'info',
  minify: isProduction,
  sourcemap: isProduction ? false : true, // No source maps in production
};

console.log(`\n🔨 Building ExtractMD (${isProduction ? 'PRODUCTION' : 'development'})...\n`);

// Content script bundle
esbuild.build({
  ...commonOptions,
  entryPoints: ['extension/content.js'],
  outfile: 'extension/dist/content.js',
}).catch(() => process.exit(1));

// Popup bundle
esbuild.build({
  ...commonOptions,
  entryPoints: ['extension/popup/index.js'],
  outfile: 'extension/dist/popup.js',
}).catch(() => process.exit(1));

// Options page bundle
esbuild.build({
  ...commonOptions,
  entryPoints: ['extension/options/index.js'],
  outfile: 'extension/dist/options.js',
}).catch(() => process.exit(1));
