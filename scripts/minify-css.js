#!/usr/bin/env node

/**
 * Minify CSS for web deployment
 * Uses esbuild to minify styles.css
 */

import { transform } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const cssPath = path.join(rootDir, 'web', 'styles.css');
const outputPath = cssPath; // Overwrite original

async function minifyCSS() {
  try {
    console.log('📦 Minifying CSS...');

    const css = fs.readFileSync(cssPath, 'utf8');

    const result = await transform(css, {
      loader: 'css',
      minify: true,
    });

    fs.writeFileSync(outputPath, result.code);

    const originalSize = (css.length / 1024).toFixed(2);
    const minifiedSize = (result.code.length / 1024).toFixed(2);
    const savings = ((1 - result.code.length / css.length) * 100).toFixed(1);

    console.log(`✓ CSS minified successfully`);
    console.log(`  Original: ${originalSize} KB`);
    console.log(`  Minified: ${minifiedSize} KB`);
    console.log(`  Savings: ${savings}%`);
  } catch (error) {
    console.error('❌ Error minifying CSS:', error);
    process.exit(1);
  }
}

minifyCSS();
