'use strict';
// Adds WhatsApp EXIF pack metadata to a static, locally generated WebP.
// The EXIF/TIFF descriptor follows the public sticker metadata convention.
// No native webpmux dependency is needed for this small bounded file.
const sharp=require('sharp');
const {randomUUID}=require('node:crypto');
const {imageInput}=require('./image-studio');
const STICKERWM_COMMANDS=new Set(['stickerwm','wm']);
function chunk(type,payload){
  if(!/^[A-Z0-9 ]{4}$/.test(type)||!Buffer.isBuffer(payload))
    throw new Error('Invalid WebP chunk.');
  const length=payload.length;
  const out=Buffer.allocUnsafe(8+length+(length&1));
  out.write(type,0,'ascii');
  out.writeUInt32LE(length,4);
  payload.copy(out,8);
  if(length&1)out[8+length]=0;
  return out;
}
function readChunks(buffer){
  if(!Buffer.isBuffer(buffer)||buffer.length<20||buffer.subarray(0,4).toString()!=='RIFF'||
      buffer.subarray(8,12).toString()!=='WEBP' ||
      buffer.readUInt32LE(4)!==buffer.length-8)throw new Error('Invalid WebP RIFF.');
  const pieces=[];
  let position=12;
  while(position<buffer.length){
    if(position+8>buffer.length)throw new Error('Invalid WebP chunk header.');
    const type=buffer.toString('ascii',position,position+4);
    const size=buffer.readUInt32LE(position+4);
    const next=position+8+size+(size&1);
    if(next>buffer.length || next<=position)throw new Error('Invalid WebP chunk size.');
    pieces.push({type,payload:Buffer.from(buffer.subarray(position+8,position+8+size))});
    position=next;
  }
  if(!pieces.length||!pieces.some(p=>['VP8 ','VP8L','ANIM'].includes(p.type)))
    throw new Error('No WebP image chunk.');
  return pieces;
}
function exifData(pack,author){
  const meta={
    'sticker-pack-id':'beaute.'+randomUUID(),
    'sticker-pack-name':pack,
    'sticker-pack-publisher':author,
    emojis:['✨']
  };
  const json=Buffer.from(JSON.stringify(meta),'utf8');
  const prefix=Buffer.from([
    0x49,0x49,0x2a,0x00,0x08,0x00,0x00,0x00,0x01,0x00,
    0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00
  ]);
  prefix.writeUInt32LE(json.length,14);
  return Buffer.concat([prefix,json]);
}
function validLabel(text){
  return typeof text==='string'&&[...text.trim()].length>=1 &&
    [...text.trim()].length<=40&&!/[\x00-\x1f]/.test(text);
}
function metadataWebp(webp,pack,author,width=512,height=512){
  if(!validLabel(pack)||!validLabel(author))throw new Error('Pack/author must be 1–40 characters.');
  if(!Number.isInteger(width)||!Number.isInteger(height)||
      width<1||height<1||width>16384||height>16384)throw new Error('Invalid sticker dimensions.');
  const previous=readChunks(webp);
  const withoutExif=previous.filter(x=>x.type!=='EXIF');
  let hasExtended=false;
  const next=withoutExif.map(({type,payload})=>{
    if(type==='VP8X'){
      if(payload.length!==10)throw new Error('Invalid VP8X chunk.');
      const copy=Buffer.from(payload);copy[0]|=0x08;
      hasExtended=true;return {type,payload:copy};
    }
    return {type,payload};
  });
  if(!hasExtended){
    const descriptor=Buffer.alloc(10);
    descriptor[0]=0x08; // EXIF flag
    descriptor.writeUIntLE(width-1,4,3);
    descriptor.writeUIntLE(height-1,7,3);
    next.unshift({type:'VP8X',payload:descriptor});
  }
  next.push({type:'EXIF',payload:exifData(pack.trim(),author.trim())});
  const parts=next.map(x=>chunk(x.type,x.payload));
  const size=4+parts.reduce((sum,part)=>sum+part.length,0);
  if(size>900*1024)throw new Error('Sticker size limit exceeded.');
  const header=Buffer.alloc(12);
  header.write('RIFF',0,'ascii');header.writeUInt32LE(size,4);header.write('WEBP',8,'ascii');
  return Buffer.concat([header,...parts],size+8);
}
async function createStickerWm(buffer,pack,author){
  const webp=await sharp(buffer,{limitInputPixels:20_000_000,animated:false})
    .resize(512,512,{fit:'contain',background:'#00000000'})
    .webp({quality:76,effort:4}).toBuffer();
  return metadataWebp(webp,pack,author,512,512);
}
async function handleStickerWm(ctx,download){
  if(!STICKERWM_COMMANDS.has(ctx.cmd.name))return false;
  const {cmd,sock,message,chat,logger,reply,config,lang}=ctx;
  try{
    const args=cmd.args.join(' ');
    const pos=args.indexOf('|');
    const pack=(pos<0?args:args.slice(0,pos)).trim()||config.name;
    const author=(pos<0?config.ownerName:args.slice(pos+1)).trim()||config.ownerName;
    if(!validLabel(pack)||!validLabel(author))throw new Error('Use stickerwm Pack | Author (max 40 each).');
    const buffer=await imageInput(sock,message,logger,download);
    await sock.sendMessage(chat,{sticker:await createStickerWm(buffer,pack,author)},{quoted:message});
  }catch(error){
    await reply((lang==='en'?'Sticker failed: ':'Stiker gagal: ')+String(error.message).slice(0,160));
  }
  return true;
}
module.exports={STICKERWM_COMMANDS,readChunks,metadataWebp,createStickerWm,handleStickerWm,exifData};
