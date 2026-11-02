'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { collectJavaScriptFiles, checkSyntax } = require('../scripts/check-syntax');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'beaute-check-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src', 'features'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'index.js'), 'const ok = true;\n');
  fs.writeFileSync(path.join(root, 'src', 'features', 'alpha.js'), 'module.exports = 1;\n');
  fs.writeFileSync(path.join(root, 'src', 'notes.txt'), 'not JavaScript');
  return root;
}
test('syntax checker discovers nested JavaScript, ignoring non-js files', t => {
  const root = fixture(t);
  const paths = collectJavaScriptFiles(path.join(root, 'src'))
    .map(p => path.relative(root, p).replaceAll(path.sep, '/')).sort();
  assert.deepEqual(paths, ['src/features/alpha.js', 'src/index.js']);
});
test('syntax checker reports each file and uses a bounded subprocess timeout', t => {
  const root = fixture(t);
  const calls = [], logs = [];
  const outcome = checkSyntax({
    root, timeoutMs: 12000, log: x => logs.push(x), error: x => logs.push(x),
    runner: (binary, args, options) => {
      calls.push({ binary, args, options });
      return { status: 0 };
    }
  });
  assert.equal(outcome, 0);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(c => c.binary === process.execPath &&
    c.args[0] === '--check' && c.options.timeout === 12000));
  assert.ok(logs.some(x => x.includes('PASS:')));
});
test('syntax checker fails quickly and identifies timed-out file', t => {
  const root = fixture(t);
  const errors = [];
  const result = checkSyntax({
    root, timeoutMs: 2000, log: () => {}, error: x => errors.push(x),
    runner: () => ({ error: Object.assign(new Error('spawn timeout'), { code: 'ETIMEDOUT' }) })
  });
  assert.equal(result, 1);
  assert.match(errors.join('\n'), /TIMEOUT:.*\.js/);
});
test('syntax checker rejects failing child processes', t => {
  const root = fixture(t);
  const errors = [];
  const result = checkSyntax({
    root, log: () => {}, error: x => errors.push(x),
    runner: () => ({ status: 1, stderr: 'SyntaxError: unexpected token' })
  });
  assert.equal(result, 1);
  assert.match(errors.join('\n'), /SyntaxError/);
});
