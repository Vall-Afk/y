'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const sharp=require('sharp');
const {loadConfig}=require('../src/config');
const {createRouter}=require('../src/commands');
const {imageTransform,textImageSticker,svgTextImage,imageInput}=require('../src/features/image-studio');
const cfg=loadConfig({OWNER_NUMBER:'6287721373781'});
const log={warn(){},error(){}};
const user='6281111111111@s.whatsapp.net';
const imageMessage=()=>({key:{remoteJid:user},message:{imageMessage:{fileLength:200}}});
const input=()=>sharp({create:{width:300,height:170,channels:4,background:'#d95454'}}).png().toBuffer();
test('local image effects generate valid JPEG or transparent PNG, keep bounded dimensions',async()=>{
  const src=await input();
  for(const command of ['blur','grayscale','invert','rotate','flip','mirror',
    'pixelate','circle','enhance','compress','resize']){
    const out=await imageTransform(src,command,command==='rotate'?['90']:command==='resize'?['200']:[]);
    assert.ok(Buffer.isBuffer(out),command);
    const meta=await sharp(out).metadata();
    assert.ok(meta.width>=128&&meta.height>=100,command);
    assert.ok(out.length<5*1024*1024,command);
    assert.equal(meta.format,command==='circle'?'png':'jpeg',command);
  }
  assert.throws(()=>imageTransform(src,'blur',['999']),/Blur/);
  assert.throws(()=>imageTransform(src,'rotate',['45']),/rotate/);
  assert.throws(()=>imageTransform(src,'resize',['900000']),/resize/);
});
test('Brat and quoted-chat stickers are WebP and reject unsafe text',async()=>{
  const brat=await textImageSticker('HELLO BEAUTÉ');
  const qc=await textImageSticker('Amazing quote','qc','Vall');
  for(const item of [brat,qc]){
    const meta=await sharp(item).metadata();
    assert.equal(meta.format,'webp');
    assert.equal(meta.width,512);
    assert.equal(meta.height,512);
  }
  assert.match(svgTextImage('safe <script>', 'brat').toString(),/&lt;script&gt;/);
  await assert.rejects(textImageSticker(''),/Text/);
  await assert.rejects(textImageSticker('x'.repeat(250)),/Text/);
});
test('media helper refuses overlarge stated size and invalid content',async()=>{
  const oversized=imageMessage();oversized.message.imageMessage.fileLength=6*1024*1024;
  await assert.rejects(imageInput({},oversized,log,async()=>Buffer.from('anything')),/5 MB/);
  await assert.rejects(imageInput({},imageMessage(),log,async()=>Buffer.alloc(0)),/invalid/);
  const src=await input();
  const out=await imageInput({},imageMessage(),log,async()=>src);
  assert.deepEqual(out,src);
});
test('prefixless image studio Brat sticker sends only local output',async()=>{
  const sent=[];let clock=2000;
  const sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_chat,body)=>sent.push(body)};
  const router=createRouter(cfg,{mode:'public',group:()=>({})},log,{now:()=>clock+=3000});
  await router.handle(sock,{key:{remoteJid:user},message:{conversation:'brat Welcome'}});
  assert.ok(Buffer.isBuffer(sent.at(-1).sticker));
  const meta=await sharp(sent.at(-1).sticker).metadata();
  assert.equal(meta.format,'webp');
  await router.handle(sock,{key:{remoteJid:user},message:{conversation:'qc'}});
  assert.match(sent.at(-1).text,/processing|gagal/i);
});
