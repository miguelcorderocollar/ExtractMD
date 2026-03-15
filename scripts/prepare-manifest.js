#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const manifestPath = join(rootDir, 'extension', 'manifest.json');

const ICON_PATHS = {
  local: {
    16: 'icons/local/icon16.png',
    48: 'icons/local/icon48.png',
    128: 'icons/local/icon128.png',
  },
  prod: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
};

function parseMode(args) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--mode' && args[i + 1]) {
      return args[i + 1];
    }
    if (arg.startsWith('--mode=')) {
      return arg.split('=')[1];
    }
    if (arg === '--production') {
      return 'prod';
    }
    if (arg === '--local') {
      return 'local';
    }
  }
  return 'local';
}

function replaceIconEntries(blockContent, iconPaths) {
  const with16 = blockContent.replace(/("16"\s*:\s*")[^"]*(")/, `$1${iconPaths['16']}$2`);
  const with48 = with16.replace(/("48"\s*:\s*")[^"]*(")/, `$1${iconPaths['48']}$2`);
  return with48.replace(/("128"\s*:\s*")[^"]*(")/, `$1${iconPaths['128']}$2`);
}

function replaceIconBlock(manifestContent, blockName, iconPaths) {
  const blockRegex = new RegExp(`("${blockName}"\\s*:\\s*\\{)([\\s\\S]*?)(\\n\\s*\\})`, 'm');

  return manifestContent.replace(blockRegex, (match, prefix, body, suffix) => {
    const updatedBody = replaceIconEntries(body, iconPaths);
    return `${prefix}${updatedBody}${suffix}`;
  });
}

async function main() {
  const mode = parseMode(process.argv.slice(2));

  if (!ICON_PATHS[mode]) {
    console.error(`Invalid mode "${mode}". Use --mode local or --mode prod.`);
    process.exit(1);
  }

  const manifestContent = await readFile(manifestPath, 'utf-8');
  const withDefaultIcons = replaceIconBlock(manifestContent, 'default_icon', ICON_PATHS[mode]);
  const updatedManifest = replaceIconBlock(withDefaultIcons, 'icons', ICON_PATHS[mode]);

  await writeFile(manifestPath, updatedManifest, 'utf-8');
  console.log(`Updated manifest icons for ${mode} mode.`);
}

main().catch((error) => {
  console.error('Failed to prepare manifest:', error);
  process.exit(1);
});
