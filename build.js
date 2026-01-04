import esbuild from 'esbuild';
import { readdir, unlink } from 'fs/promises';
import { join } from 'path';

// Check for production mode via CLI arg or NODE_ENV
const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

const distDir = 'extension/dist';

// Clean dist directory in production mode
async function cleanDist() {
  if (!isProduction) return;

  try {
    const files = await readdir(distDir);
    for (const file of files) {
      const filePath = join(distDir, file);
      try {
        await unlink(filePath);
      } catch (err) {
        // Ignore errors for files that don't exist
      }
    }
    console.log('🧹 Cleaned dist directory\n');
  } catch (err) {
    // Dist directory might not exist yet, that's okay
    if (err.code !== 'ENOENT') {
      console.warn(`Warning: Could not clean dist directory: ${err.message}`);
    }
  }
}

const commonOptions = {
  bundle: true,
  format: 'iife',
  target: ['chrome88'], // Modern Chrome for Manifest V3
  logLevel: 'info',
  minify: isProduction,
  sourcemap: isProduction ? false : true, // No source maps in production
  loader: {
    '.svg': 'text', // Load SVG files as text strings
  },
};

console.log(`\n🔨 Building ExtractMD (${isProduction ? 'PRODUCTION' : 'development'})...\n`);

// Clean dist directory before building in production
await cleanDist();

// Build all bundles in parallel
try {
  await Promise.all([
    // Content script bundle
    esbuild.build({
      ...commonOptions,
      entryPoints: ['extension/content.js'],
      outfile: 'extension/dist/content.js',
    }),
    // Popup bundle
    esbuild.build({
      ...commonOptions,
      entryPoints: ['extension/popup/index.js'],
      outfile: 'extension/dist/popup.js',
    }),
    // Options page bundle
    esbuild.build({
      ...commonOptions,
      entryPoints: ['extension/options/index.js'],
      outfile: 'extension/dist/options.js',
    }),
  ]);
  console.log('\n✅ Build completed successfully!\n');
} catch (error) {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
}
