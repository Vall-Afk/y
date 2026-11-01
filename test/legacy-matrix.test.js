'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
test('legacy command audit enumerates all 428 unique old names and honest statuses',()=>{
  const body=fs.readFileSync(path.join(root,'LEGACY_COMMAND_MATRIX.md'),'utf8');
  const rows=[...body.matchAll(/^\| \x60([a-zA-Z0-9_]+)\x60 \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)];
  assert.equal(rows.length,428,'must account for every unique advertised command');
  assert.equal(new Set(rows.map(x=>x[1])).size,428,'no duplicate legacy commands');
  const counts={};
  for(const row of rows)counts[row[3].trim()]=(counts[row[3].trim()]||0)+1;
  assert.deepEqual(counts,{
    'Implemented (unit-tested module)':137,
    'Not yet migrated':173,
    'Deferred (consent/abuse risk)':11,
    'Excluded (content/safety review)':76,
    'Original local alternative':31
  });
  for(const word of ['ytmp3','stickerwm','setwelcome','goplanet','addstik','lirik']){
    assert.match(body,new RegExp('^\\| \\x60'+word+'\\x60','m'));
  }
});
test('README preserves Vall credits, Instagram, thanks and Windows npm.cmd instructions',()=>{
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  const features=fs.readFileSync(path.join(root,'FEATURES.md'),'utf8');
  for(const name of ['Vall-Afk','v4lonenonly','Tritunggal Mahakudus',
    'Orang Tua','Keluarga','Saya sendiri','npm.cmd install','npm.cmd test',
    'npm.cmd run check','git clone --branch feature/beaute-legacy-modern'])
    assert.ok(readme.includes(name),name);
  assert.match(features,/PREMIUM EXCLUSIVE/);
  assert.match(readme,/Bahasa Indonesia & English/);
  assert.match(readme,/not complete|belum|not.*parity/i);
});
