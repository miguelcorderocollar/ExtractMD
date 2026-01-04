import esbuild from 'esbuild';

const commonOptions = {
  bundle: true,
  format: 'iife',
  target: ['chrome88'],
  logLevel: 'info',
  sourcemap: true,
  loader: {
    '.svg': 'text',
  },
};

async function watch() {
  console.log('👀 Watching for changes in ExtractMD...');

  // Content script context
  const contentCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['extension/content.js'],
    outfile: 'extension/dist/content.js',
  });

  // Popup context
  const popupCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['extension/popup/index.js'],
    outfile: 'extension/dist/popup.js',
  });

  // Options context
  const optionsCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['extension/options/index.js'],
    outfile: 'extension/dist/options.js',
  });

  // Start watching all
  await Promise.all([contentCtx.watch(), popupCtx.watch(), optionsCtx.watch()]);

  console.log('✅ Watchers active for content, popup, and options.');
}

watch().catch((err) => {
  console.error('Watch failed:', err);
  process.exit(1);
});
