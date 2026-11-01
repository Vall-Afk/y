'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const sharp=require('sharp'),fs=require('node:fs/promises'),path=require('node:path');
const {paperSvg,emojiPair,emojiSvg,portraitSvg,safeMediafire,quotedText,
  safeSearchUrl,animatedTtp,handleLegacyUtilities}=require('../src/features/legacy-utilities');
const {createRouter}=require('../src/commands');
const {loadConfig}=require('../src/config');
const user='6281111111111@s.whatsapp.net';
test('legacy handwritten notes and illustrated avatars render safely without network',async()=>{
  for(const style of ['nuliskiri','nuliskanan','foliokiri','foliokanan']){
    const svg=paperSvg('Halo <script> Beauté.',style).toString();
    assert.match(svg,/&lt;script&gt;/);
    const meta=await sharp(Buffer.from(svg)).metadata();
    assert.equal(meta.width,1024);
    assert.equal(meta.height,768);
  }
  for(const style of ['cecan','cogan','waifu']){
    const buffer=await sharp(portraitSvg(style,123)).png().toBuffer();
    assert.equal((await sharp(buffer).metadata()).format,'png');
  }
  assert.throws(()=>paperSvg('x'.repeat(181),'nuliskiri'),/180/);
});
test('emoji composition and animated sticker use bounded local media processing',async()=>{
  assert.deepEqual(emojiPair('😀+😎'),['😀','😎']);
  assert.throws(()=>emojiPair('not+emoji'),/emojimix/);
  const image=await sharp(emojiSvg(['😀','😎'])).webp().toBuffer();
  assert.equal((await sharp(image).metadata()).format,'webp');
  let workspace='',args;
  const out=await animatedTtp('TEST',{
    run:async(_binary,params)=>{
      args=params;
      workspace=path.dirname(params.at(-1));
      await fs.writeFile(params.at(-1),Buffer.from('fake-animated-webp'));
    }
  });
  assert.equal(out.toString(),'fake-animated-webp');
  assert.ok(args.includes('libwebp_anim'));
  assert.equal(await fs.stat(workspace).catch(()=>null),null);
});
test('external links are strictly scoped; quote is local and registration is never checked',()=>{
  assert.equal(safeMediafire('https://www.mediafire.com/file/abcdefgh1234/file?tracking=1'),
    'https://www.mediafire.com/file/abcdefgh1234/file');
  for(const url of ['http://www.mediafire.com/file/abcdefgh1234/file',
    'https://www.mediafire.com.evil.com/file/abcdefgh1234/file',
    'https://user@www.mediafire.com/file/abcdefgh1234/file','https://localhost/'])
    assert.throws(()=>safeMediafire(url),/MediaFire|official/);
  assert.match(safeSearchUrl('pinterest','cat art'),/^https:\/\/www.pinterest.com\/search/);
  assert.match(safeSearchUrl('grupwa','coding'),/^https:\/\/www.google.com\/search/);
  assert.equal(quotedText({message:{extendedTextMessage:{contextInfo:{
    stanzaId:'abc',quotedMessage:{conversation:'Hello quoted!'}
  }}}}),'Hello quoted!');
});
test('prefixless legacy commands send original output and avoid arbitrary external requests',async()=>{
  const sent=[];const sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,body)=>sent.push(body)};
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {now:(()=>{let x=1;return()=>x+=2000;})()});
  const msg=text=>({key:{remoteJid:user},message:{conversation:text}});
  await router.handle(sock,msg('emojimix 😀+😎'));
  assert.ok(Buffer.isBuffer(sent.at(-1).sticker));
  await router.handle(sock,msg('nuliskanan Halo dunia'));
  assert.ok(Buffer.isBuffer(sent.at(-1).image));
  await router.handle(sock,msg('nowa 628123456789'));
  assert.match(sent.at(-1).text,/wa.me\/628123456789/);
  await router.handle(sock,msg('mediafire https://www.mediafire.com/file/abcdefgh1234/file'));
  assert.match(sent.at(-1).text,/browser/);
});
test('image fingerprint remains local and does not upload the photo',async()=>{
  const image=await sharp({create:{width:50,height:50,channels:3,background:'#ee1122'}}).png().toBuffer();
  const sent=[],ctx={
    cmd:{name:'searchbyimage',args:[]},sock:{updateMediaMessage:async()=>{}},
    message:{key:{remoteJid:user},message:{extendedTextMessage:{text:'searchbyimage',contextInfo:{
      stanzaId:'quoted',participant:user,quotedMessage:{imageMessage:{fileLength:image.length}}
    }}}},chat:user,lang:'en',logger:{warn(){}},
    reply:async text=>sent.push(text)
  };
  await handleLegacyUtilities(ctx,{download:async()=>image});
  assert.match(sent.at(-1),/SHA-256:/);
  assert.match(sent.at(-1),/No photo is uploaded/);
});
