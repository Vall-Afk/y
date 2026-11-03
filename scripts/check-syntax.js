'use strict';
// Cross-platform syntax checker: shows progress and times out a stuck node --check.
// This only checks syntax; it does not import or run the WhatsApp bot.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DEFAULT_TIMEOUT_MS = 20000;

function collectJavaScriptFiles(directory) {
  const files = [];
  function visit(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
      // Symlinks are deliberately not traversed.
    }
  }
  visit(directory);
  return files;
}

function checkSyntax({
  root = path.resolve(__dirname, '..'),
  runner = spawnSync,
  log = console.log,
  error = console.error,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const sourceDir = path.join(root, 'src');
  const files = collectJavaScriptFiles(sourceDir);
  if (files.length === 0) {
    error('ERROR: No JavaScript source files found in src/.');
    return 1;
  }
  log('Checking ' + files.length + ' JavaScript files (max ' + (timeoutMs / 1000) +
    ' seconds per file).');
  for (const [index, file] of files.entries()) {
    const relative = path.relative(root, file);
    log('[' + (index + 1) + '/' + files.length + '] ' + relative);
    const started = Date.now();
    const result = runner(process.execPath, ['--check', file], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024
    });
    if (result.error) {
      if (result.error.code === 'ETIMEDOUT') {
        error('TIMEOUT: ' + relative + ' exceeded ' + timeoutMs / 1000 +
          's. Try: node --check .\\' + relative.replace(/\//g, '\\'));
      } else {
        error('ERROR: Could not check ' + relative + ': ' + result.error.message);
      }
      return 1;
    }
    if (result.status !== 0 || result.signal) {
      error('FAILED: ' + relative + ' (exit: ' + result.status + ', signal: ' +
        (result.signal || 'none') + ')');
      if (result.stdout) error(result.stdout.trim());
      if (result.stderr) error(result.stderr.trim());
      return 1;
    }
    log('  OK (' + (Date.now() - started) + ' ms)');
  }
  log('PASS: Syntax checks completed for all ' + files.length + ' files.');
  return 0;
}

if (require.main === module) process.exitCode = checkSyntax();
module.exports = { collectJavaScriptFiles, checkSyntax, DEFAULT_TIMEOUT_MS };
