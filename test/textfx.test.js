'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const sharp=require('sharp');
const {textEffect,effectSvg,nameFor,THEMES,ALIAS}=require('../src/features/textfx');
const {createRouter}=require('../src/commands');
const {loadConfig}=require('../src/config');
const user='6281111111111@s.whatsapp.net';
test('original textfx styles render PNG with distinctive content and constrained size',async()=>{
  const png1=await textEffect('neon','Beauté.');
  const png2=await textEffect('rainbow','Beauté.');
  const png3=await textEffect('matrix','Beauté.');
  for(const png of [png1,png2,png3]){
    const meta=await sharp(png).metadata();
    assert.equal(meta.format,'png');
    assert.equal(meta.width,1024);
    assert.equal(meta.height,512);
    assert.ok(png.length<2*1024*1024);
  }
  assert.notDeepEqual(png1,png2);
  assert.notDeepEqual(png2,png3);
  assert.ok(Object.keys(THEMES).length>=10);
});
test('textfx escapes XML and maps legacy style aliases to original renderers',async()=>{
  const xml=effectSvg('neon','<script>hi</script>').toString('utf8');
  assert.match(xml,/&lt;script&gt;/);
  assert.doesNotMatch(xml,/<script>/);
  assert.equal(nameFor('3dsteel'),'metallic');
  assert.equal(nameFor('glitch2'),'glitch');
  assert.throws(()=>effectSvg('neon','x'.repeat(86)),/85/);
  assert.throws(()=>nameFor('unknown-style'),/Unknown style/);
});
test('prefixless TextPro-style command returns an image without network request',async()=>{
  const sent=[];const cfg=loadConfig({OWNER_NUMBER:'6287721373781'});
  const router=createRouter(cfg,{mode:'public',group:()=>({})},{warn(){}},
    {now:(()=>{let x=1;return()=>x+=2500;})()});
  const sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,data)=>sent.push(data)};
  const make=text=>({key:{remoteJid:user},message:{conversation:text}});
  await router.handle(sock,make('textfx neon Hello'));
  assert.ok(Buffer.isBuffer(sent.at(-1).image));
  await router.handle(sock,make('halloween SPOOKY'));
  assert.ok(Buffer.isBuffer(sent.at(-1).image));
});
