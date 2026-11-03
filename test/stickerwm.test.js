'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const {createStickerWm,readChunks,metadataWebp,handleStickerWm}=
  require('../src/features/stickerwm');
const src=()=>sharp({create:{width:220,height:160,channels:4,
  background:{r:200,g:20,b:40,alpha:0.8}}}).png().toBuffer();
test('stickerwm produces a decodable WebP with WhatsApp EXIF pack and publisher',async()=>{
  const image=await src();
  const sticker=await createStickerWm(image,'Beauté. Stickers','Vall');
  const info=await sharp(sticker).metadata();
  assert.equal(info.format,'webp');
  assert.equal(info.width,512);
  assert.equal(info.height,512);
  const chunks=readChunks(sticker);
  assert.equal(chunks[0].type,'VP8X');
  assert.ok(chunks[0].payload[0]&0x08,'VP8X EXIF flag');
  const exif=chunks.find(x=>x.type==='EXIF');
  assert.ok(exif,'EXIF chunk');
  const len=exif.payload.readUInt32LE(14);
  const text=exif.payload.subarray(22,22+len).toString('utf8');
  const data=JSON.parse(text);
  assert.equal(data['sticker-pack-name'],'Beauté. Stickers');
  assert.equal(data['sticker-pack-publisher'],'Vall');
  assert.match(data['sticker-pack-id'],/^beaute\./);
});
test('stickerwm safely rewrites metadata without duplicate EXIF chunks',async()=>{
  const image=await src();
  const first=await createStickerWm(image,'First','Owner');
  const second=metadataWebp(first,'Second','Vall');
  const chunks=readChunks(second);
  assert.equal(chunks.filter(c=>c.type==='EXIF').length,1);
  assert.ok(Buffer.isBuffer(second));
  assert.equal((await sharp(second).metadata()).format,'webp');
  assert.throws(()=>metadataWebp(second,'x'.repeat(41),'Vall'),/Pack/);
  assert.throws(()=>metadataWebp(second,'Okay','X\nOther'),/Pack/);
});
test('stickerwm command embeds metadata from quoted image and sends only the sticker',async()=>{
  const image=await src();
  const send=[];
  const sender='6281111111111@s.whatsapp.net';
  const message={
    key:{remoteJid:sender,id:'msg001'},
    message:{extendedTextMessage:{text:'stickerwm Set | Vall',contextInfo:{
      stanzaId:'image001',participant:sender,quotedMessage:{imageMessage:{fileLength:image.length}}
    }}}
  };
  const ctx={
    cmd:{name:'stickerwm',args:['Set','|','Vall']},
    sock:{sendMessage:async(_to,item)=>send.push(item)},
    message,chat:sender,logger:{warn(){}},
    reply:async text=>send.push({text}),
    config:{name:'Beauté.',ownerName:'Vall'},lang:'en'
  };
  await handleStickerWm(ctx,async()=>image);
  assert.ok(Buffer.isBuffer(send[0].sticker),JSON.stringify(send));
  const raw=readChunks(send[0].sticker).find(x=>x.type==='EXIF').payload;
  assert.match(raw.toString('utf8'),/sticker-pack-name/);
  assert.match(raw.toString('utf8'),/Set/);
});
