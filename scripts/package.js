#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdir, stat, readFile, writeFile, mkdir } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const extensionDir = join(rootDir, 'extension');
const distDir = join(extensionDir, 'dist');
const packagesDir = join(rootDir, 'packages');

// Files that MUST be included
const REQUIRED_FILES = [
  'manifest.json',
  'background.js',
  'dist/content.js',
  'popup.html',
  'popup.css',
  'options.html',
  'options.css',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

// Directories/files that MUST be excluded
const EXCLUDED_PATTERNS = [
  'node_modules',
  'tests',
  'test-results',
  'coverage',
  '.git',
  '.gitignore',
  'README.md',
  'package.json',
  'package-lock.json',
  'build.js',
  'vitest.config.js',
  'scripts',
  'docs',
  'web',
  'dist/*.map', // Source maps should not be in production ZIP
];

// Files that should exist but may be in dist/
const DIST_FILES = ['dist/popup.js', 'dist/options.js'];

let errors = [];
let warnings = [];

function log(message, type = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  }[type];
  console.log(`${prefix} ${message}`);
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkRequiredFiles() {
  log('Checking required files...', 'info');
  const missing = [];

  for (const file of REQUIRED_FILES) {
    const fullPath = join(extensionDir, file);
    if (!(await fileExists(fullPath))) {
      missing.push(file);
      errors.push(`Missing required file: ${file}`);
    }
  }

  // Check dist files
  for (const file of DIST_FILES) {
    const fullPath = join(extensionDir, file);
    if (!(await fileExists(fullPath))) {
      warnings.push(`Dist file not found: ${file} (may need production build)`);
    }
  }

  if (missing.length === 0) {
    log('All required files present', 'success');
  } else {
    log(`Missing ${missing.length} required file(s)`, 'error');
  }

  return missing.length === 0;
}

async function checkSourceMaps() {
  log('Checking for source maps in dist/...', 'info');
  try {
    const files = await readdir(distDir);
    const sourceMaps = files.filter((f) => f.endsWith('.map'));

    if (sourceMaps.length > 0) {
      warnings.push(
        `Source maps found in dist/: ${sourceMaps.join(', ')}. These should not be included in production ZIP.`
      );
      log(`Found ${sourceMaps.length} source map(s) - will exclude from ZIP`, 'warning');
    } else {
      log('No source maps found (good for production)', 'success');
    }
  } catch (err) {
    warnings.push(`Could not check dist directory: ${err.message}`);
  }
}

async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(baseDir, fullPath);

    // Check if this path should be excluded
    const shouldExclude = EXCLUDED_PATTERNS.some((pattern) => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*'));
        return regex.test(relPath);
      }
      return relPath === pattern || relPath.startsWith(pattern + '/');
    });

    if (shouldExclude) {
      continue;
    }

    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      // Exclude source maps
      if (!fullPath.endsWith('.map')) {
        files.push({ path: fullPath, relPath });
      }
    }
  }

  return files;
}

async function getVersion() {
  try {
    const manifestPath = join(extensionDir, 'manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    return manifest.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function createZip() {
  log('Creating ZIP file...', 'info');
  const version = await getVersion();

  // Ensure packages directory exists
  try {
    await mkdir(packagesDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      errors.push(`Could not create packages directory: ${err.message}`);
      throw err;
    }
  }

  const zipPath = join(packagesDir, `extractmd-${version}.zip`);

  try {
    // Get all files to include
    const files = await getAllFiles(extensionDir, extensionDir);
    log(`Found ${files.length} files to include in ZIP`, 'info');

    // Use zip command (available on Linux/Mac)
    // For Windows, user can use 7-Zip or PowerShell Compress-Archive
    try {
      // Create a file list and use zip with @filelist syntax for better handling of special characters
      const fileListPath = join(rootDir, '.zip-filelist.txt');
      const fileListContent = files.map((f) => f.relPath).join('\n');
      await writeFile(fileListPath, fileListContent);

      // Use zip command with file list via stdin
      execSync(`cd "${extensionDir}" && cat "${fileListPath}" | zip -r "${zipPath}" -@`, {
        shell: '/bin/bash',
        stdio: 'pipe',
      });

      // Clean up temp file
      try {
        const { unlink } = await import('fs/promises');
        await unlink(fileListPath);
      } catch {
        // Ignore error if temp file cannot be deleted
      }

      // Get file size
      const stats = await stat(zipPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

      log(`ZIP created: ${zipPath}`, 'success');
      log(`ZIP size: ${sizeMB} MB`, 'info');

      if (stats.size > 10 * 1024 * 1024) {
        warnings.push(`ZIP file is larger than 10MB (${sizeMB} MB). Consider optimizing assets.`);
      } else {
        log('ZIP size is within recommended limit (< 10MB)', 'success');
      }

      return { path: zipPath, size: stats.size };
    } catch {
      // If zip command fails, provide manual instructions
      log(
        'System zip command not available or failed. Providing manual instructions...',
        'warning'
      );

      const fileListPath = join(rootDir, 'zip-files.txt');
      const fileListContent = files.map((f) => f.relPath).join('\n');
      await writeFile(fileListPath, fileListContent);

      warnings.push(`Could not create ZIP automatically. Please create ZIP manually:`);
      warnings.push(
        `  Linux/Mac: cd extension && zip -r ../packages/extractmd-${version}.zip -@ < ../zip-files.txt`
      );
      warnings.push(
        `  Windows: Use 7-Zip or PowerShell: Compress-Archive -Path extension\\* -DestinationPath packages\\extractmd-${version}.zip`
      );
      warnings.push(`  File list saved to: ${fileListPath}`);

      // Return a placeholder result
      return { path: zipPath, size: 0, manual: true };
    }
  } catch (err) {
    errors.push(`Error creating ZIP: ${err.message}`);
    throw err;
  }
}

async function verifyManifest() {
  log('Verifying manifest.json...', 'info');
  try {
    const manifestPath = join(extensionDir, 'manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Check that manifest references correct files
    if (manifest.content_scripts) {
      for (const script of manifest.content_scripts) {
        if (script.js) {
          for (const jsFile of script.js) {
            const jsPath = join(extensionDir, jsFile);
            if (!(await fileExists(jsPath))) {
              errors.push(`Manifest references missing file: ${jsFile}`);
            }
          }
        }
      }
    }

    if (manifest.background?.service_worker) {
      const bgPath = join(extensionDir, manifest.background.service_worker);
      if (!(await fileExists(bgPath))) {
        errors.push(
          `Manifest references missing background script: ${manifest.background.service_worker}`
        );
      }
    }

    log(`Manifest version: ${manifest.version}`, 'info');
    log('Manifest verification complete', 'success');
  } catch (err) {
    errors.push(`Error reading manifest: ${err.message}`);
  }
}

async function main() {
  console.log('\n📦 ExtractMD Package Preparation\n');
  console.log('='.repeat(50) + '\n');

  // Step 1: Run production build
  log('Step 1: Running production build...', 'info');
  try {
    execSync('npm run build:prod', { cwd: rootDir, stdio: 'inherit' });
    log('Production build completed', 'success');
  } catch {
    errors.push('Production build failed');
    log('Production build failed', 'error');
    process.exit(1);
  }

  console.log('');

  // Step 2: Verify required files
  log('Step 2: Verifying required files...', 'info');
  await checkRequiredFiles();
  console.log('');

  // Step 3: Check for source maps
  await checkSourceMaps();
  console.log('');

  // Step 4: Verify manifest
  await verifyManifest();
  console.log('');

  // Step 5: Create ZIP
  log('Step 5: Creating ZIP file...', 'info');
  const zipResult = await createZip();
  console.log('');

  // Summary
  console.log('='.repeat(50));
  console.log('\n📋 Summary\n');

  if (errors.length > 0) {
    log(`Found ${errors.length} error(s):`, 'error');
    errors.forEach((err) => console.log(`  ❌ ${err}`));
    console.log('');
  }

  if (warnings.length > 0) {
    log(`Found ${warnings.length} warning(s):`, 'warning');
    warnings.forEach((warn) => console.log(`  ⚠️  ${warn}`));
    console.log('');
  }

  if (errors.length === 0) {
    log('✅ Package preparation complete!', 'success');
    log(`\n📦 ZIP file: ${zipResult.path}`, 'info');
    log(`📏 Size: ${(zipResult.size / 1024 / 1024).toFixed(2)} MB`, 'info');
    log('\n💡 Next steps:', 'info');
    log('  1. Test the ZIP by loading it as an unpacked extension in Chrome', 'info');
    log('  2. Verify all features work correctly', 'info');
    log('  3. Upload to Chrome Web Store Developer Dashboard', 'info');
  } else {
    log('❌ Package preparation failed. Please fix errors above.', 'error');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
