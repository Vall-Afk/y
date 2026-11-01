'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('Windows-safe default test script limits worker concurrency while preserving isolation',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
  assert.equal(pkg.scripts.test,'node --test --test-concurrency=1');
  assert.equal(pkg.scripts['test:parallel'],'node --test');
  assert.ok(!pkg.scripts.test.includes('test-isolation=none'));
});
