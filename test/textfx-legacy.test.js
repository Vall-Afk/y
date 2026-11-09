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

test('paginated TextFX listing is available without a prefix',async()=>{
  const {createRouter}=require('../src/commands');
  const {loadConfig}=require('../src/config');
  const sent=[],sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,body)=>sent.push(body)};
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {now:(()=>{let n=1;return()=>n+=2000;})()});
  const msg=text=>({key:{remoteJid:'6281111111111@s.whatsapp.net'},message:{conversation:text}});
  await router.handle(sock,msg('menutextpro'));
  assert.match(sent.at(-1).text,/TEXT EFFECTS|EFEK TEKS/);
  await router.handle(sock,msg('textfx list 5'));
  assert.match(sent.at(-1).text,/TextFX original alternatives \(5\/5\)/);
  await router.handle(sock,msg('textfx list 6'));
  assert.match(sent.at(-1).text,/1-5/);
});

test('legacy 3D numeric-leading command names route without treating numbers as commands',async()=>{
  const {getCommand}=require('../src/util');
  const {createRouter,ALL_COMMANDS}=require('../src/commands');
  const {loadConfig}=require('../src/config');
  assert.equal(getCommand('3dchrome Beauté','!',ALL_COMMANDS).name,'3dchrome');
  assert.equal(getCommand('!3dsteel HELLO','!',ALL_COMMANDS).name,'3dsteel');
  assert.equal(getCommand('123','!',ALL_COMMANDS),null);
  const sent=[],sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,body)=>sent.push(body)};
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {now:(()=>{let n=1;return()=>n+=2000;})()});
  await router.handle(sock,{key:{remoteJid:'6281111111111@s.whatsapp.net'},
    message:{conversation:'3dchrome HELLO'}});
  assert.ok(Buffer.isBuffer(sent.at(-1).image));
});


test('named maker materials render structural differences rather than only palette changes',async()=>{
  const names=['game8bit','3dchrome','glass','firework','papercut','sketch','blood','neonlight'];
  const svgs=names.map(name=>effectSvg(name,'Beauté').toString());
  const signatures=['shape-rendering="crispEdges"','materialShadow','fill="none" stroke="#d5faff"','stroke="#fff4bc"','translate(16,18)','stroke-dasharray="6 3"','fill="#a90d2d"','fill="#29f6fa"'];
  for(let i=0;i<names.length;i++){
    assert.ok(svgs[i].includes(signatures[i]),names[i]+' missing material effect');
    const image=await textEffect(names[i],'Beauté');
    const meta=await sharp(image).metadata();
    assert.equal(meta.format,'png');
    assert.equal(meta.width,1024);
    assert.equal(meta.height,512);
  }
});
