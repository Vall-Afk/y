'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {menu,ALIASES}=require('../src/menu');
const {ALL_COMMANDS}=require('../src/commands');
const {TEXTFX_COMMANDS}=require('../src/features/textfx');
const config={ownerName:'Vall',ownerInstagram:'v4lonenonly',prefix:'!'};
test('full menu uses WhatsApp monospace block without Markdown bold markers',()=>{
  const result=menu(config,'menu');
  assert.ok(result.startsWith('```\n'));
  assert.ok(result.endsWith('\n```'));
  assert.doesNotMatch(result,/\*Beauté\.\*/);
});
test('TextFX is hidden from menu and dynamic catalog but commands stay registered',()=>{
  const profile={commandGroups:[{id:'extra',title:'EXTRA',commands:['3dchrome <teks>','neon <teks>','ping']}]};
  const result=menu(config,'menu',profile);
  assert.doesNotMatch(result,/EFEK TEKS|TEXT EFFECTS|3dchrome <teks>|neon <teks>/);
  assert.ok(ALL_COMMANDS.has('3dchrome'));
  assert.ok(TEXTFX_COMMANDS.has('neon'));
  assert.equal(ALIASES.menutextpro,'textfx');
});


test('explicit maker submenu still works while full catalog keeps it hidden',()=>{
  const full=menu(config,'menu');
  const explicit=menu(config,'menutextpro');
  assert.doesNotMatch(full,/EFEK TEKS|TEXT EFFECTS/);
  assert.match(explicit,/EFEK TEKS/);
  assert.match(explicit,/textfx neon Beauté/);
  assert.ok(explicit.startsWith('```\n'));
  assert.doesNotMatch(explicit,/Kategori tidak ditemukan/);
});
