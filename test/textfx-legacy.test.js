'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {LEGACY_STYLES,ALIAS,TEXTFX_COMMANDS,textEffect,effectSvg}=require('../src/features/textfx');
test('all 145 pending legacy TextPro keywords have routed original alternatives',()=>{
  const s=fs.readFileSync(path.resolve(__dirname,'../LEGACY_COMMAND_MATRIX.md'),'utf8');
  const rows=[...s.matchAll(/^\| \x60([a-z0-9_]+)\x60 \| TEXTPRO MENU \| Original local alternative \|/gm)].map(m=>m[1]);
  assert.equal(Object.keys(LEGACY_STYLES).length,145);
  for(const name of Object.keys(LEGACY_STYLES)){
    assert.ok(TEXTFX_COMMANDS.has(name),name);
    assert.ok(Object.hasOwn(ALIAS,name),name);
    assert.ok(rows.includes(name),name);
  }
});
test('procedural aliases are distinct valid local PNG and escape markup',async()=>{
  const [a,b,c]=await Promise.all(['marvel','honey','jewelry8'].map(n=>textEffect(n,'Hello <world>')));
  for(const img of [a,b,c]){
    const meta=await sharp(img).metadata();
    assert.equal(meta.format,'png');
    assert.equal(meta.width,1024);
    assert.equal(meta.height,512);
  }
  assert.notDeepEqual(a,b);
  assert.notDeepEqual(b,c);
  const svg=effectSvg('jewelry8','<script> &');
  assert.match(svg.toString(),/&lt;script&gt;/);
  assert.doesNotMatch(svg.toString(),/<script>/);
});
