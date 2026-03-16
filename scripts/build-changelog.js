#!/usr/bin/env node

/**
 * Build website changelog page from root CHANGELOG.md.
 * Excludes the Unreleased section and renders released entries only.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const outputPath = path.join(rootDir, 'web', 'changelog.html');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function extractReleasedMarkdown(markdownContent) {
  const sections = markdownContent.split(/(?=^## )/gm);
  const releasedSections = sections.filter((section) => {
    const trimmed = section.trimStart();
    return /^## \[(?!Unreleased\]).+/m.test(trimmed);
  });

  return releasedSections.join('\n').trim();
}

function getLatestReleaseMeta(releasedMarkdown) {
  const match = releasedMarkdown.match(/^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/m);
  if (!match) {
    return { version: 'N/A', date: 'N/A' };
  }

  return { version: match[1], date: match[2] };
}

function buildHtmlPage(releasedHtml, latestRelease) {
  const escapedVersion = escapeHtml(latestRelease.version);
  const escapedDate = escapeHtml(latestRelease.date);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Changelog - ExtractMD</title>
    <meta
      name="description"
      content="ExtractMD release notes and version history."
    />
    <meta name="author" content="ExtractMD" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="format-detection" content="telephone=no" />

    <link rel="canonical" href="https://extractmd.miguelcorderocollar.com/changelog" />

    <meta property="og:title" content="Changelog - ExtractMD" />
    <meta
      property="og:description"
      content="ExtractMD release notes and version history."
    />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://extractmd.miguelcorderocollar.com/changelog" />
    <meta
      property="og:image"
      content="https://extractmd.miguelcorderocollar.com/images/promotional-banner.png"
    />
    <meta property="og:site_name" content="ExtractMD" />
    <meta property="og:locale" content="en_US" />

    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Changelog - ExtractMD" />
    <meta
      name="twitter:description"
      content="ExtractMD release notes and version history."
    />

    <link rel="icon" type="image/png" sizes="128x128" href="favicon.png" />
    <link rel="icon" type="image/png" sizes="48x48" href="favicon.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="favicon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="favicon.png" />
    <link rel="manifest" href="manifest.json" />

    <link rel="stylesheet" href="styles.css" />

    <script>
      (function () {
        const saved = localStorage.getItem('theme');
        if (saved) {
          document.documentElement.setAttribute('data-theme', saved);
        }
      })();
    </script>
  </head>
  <body>
    <header class="site-header">
      <div class="container">
        <nav class="nav">
          <a href="/" class="logo">
            <img src="favicon.png" alt="ExtractMD" class="logo-icon" />
            ExtractMD
          </a>
          <div class="nav-links">
            <a href="/#features" class="nav-link nav-link-text">Features</a>
            <a href="privacy" class="nav-link nav-link-text">Privacy</a>
            <a href="changelog" class="nav-link nav-link-text">Changelog</a>
            <a
              href="https://github.com/miguelcorderocollar/yt-transcript-extension"
              class="nav-link nav-link-github"
              target="_blank"
              rel="noopener"
            >
              <span class="nav-link-text">GitHub</span>
              <svg
                class="nav-link-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                />
              </svg>
            </a>
            <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
              <svg class="icon-sun" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <svg class="icon-moon" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>

    <main class="changelog-page">
      <div class="container">
        <div class="changelog-content">
          <h1>Changelog</h1>
          <p class="changelog-meta">
            Latest release: <strong>${escapedVersion}</strong> (${escapedDate})<br />
            Source: <code>CHANGELOG.md</code><br />
            Also on GitHub:
            <a
              href="https://github.com/miguelcorderocollar/ExtractMD/releases"
              target="_blank"
              rel="noopener"
              >Releases</a
            >
          </p>
          ${releasedHtml}
        </div>
      </div>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-content">
          <span class="footer-logo">ExtractMD</span>
          <div class="footer-links">
            <a href="privacy" class="footer-link">Privacy Policy</a>
            <a href="changelog" class="footer-link">Changelog</a>
            <a
              href="https://github.com/miguelcorderocollar/yt-transcript-extension"
              class="footer-link"
              target="_blank"
              rel="noopener"
              >GitHub</a
            >
            <a
              href="https://github.com/miguelcorderocollar/yt-transcript-extension/issues"
              class="footer-link"
              target="_blank"
              rel="noopener"
              >Support</a
            >
          </div>
        </div>
        <p class="footer-copy">&copy; 2026 ExtractMD. Open source under MIT License.</p>
      </div>
    </footer>

    <script>
      (function () {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        function getEffectiveTheme() {
          const saved = localStorage.getItem('theme');
          if (saved) return saved;
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        toggle.addEventListener('click', function () {
          const current = getEffectiveTheme();
          const next = current === 'dark' ? 'light' : 'dark';

          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('theme', next);
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
          if (!localStorage.getItem('theme')) {
            document.documentElement.removeAttribute('data-theme');
          }
        });
      })();
    </script>
  </body>
</html>
`;
}

function buildChangelogPage() {
  try {
    console.log('Building changelog page...');

    const markdownContent = fs.readFileSync(changelogPath, 'utf8');
    const releasedMarkdown = extractReleasedMarkdown(markdownContent);

    if (!releasedMarkdown) {
      throw new Error('No released changelog sections found after filtering Unreleased.');
    }

    const latestRelease = getLatestReleaseMeta(releasedMarkdown);
    const releasedHtml = marked.parse(releasedMarkdown, {
      gfm: true,
    });

    const htmlPage = buildHtmlPage(releasedHtml, latestRelease);
    fs.writeFileSync(outputPath, htmlPage, 'utf8');

    console.log(`Created ${path.relative(rootDir, outputPath)} from CHANGELOG.md`);
    console.log(`Latest release: ${latestRelease.version} (${latestRelease.date})`);
  } catch (error) {
    console.error('Error building changelog page:', error);
    process.exit(1);
  }
}

buildChangelogPage();
