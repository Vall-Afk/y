'use strict';
// Local-only static image studio; no third-party photo upload or shell execution.
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { contentAndKey } = require('../media');
const { getText } = require('../util');
const { xmlSafe, splitText } = require('./sticker-tools');
const IMAGE_COMMANDS = new Set([
  'blur','grayscale','greyscale','invert','negative','rotate','flip','mirror',
  'pixelate','circle','enhance','compress','resize','brat','qc'
]);
const MAX_INPUT=5*1024*1024, MAX_OUTPUT=5*1024*1024;
async function imageInput(sock,message,logger,download=downloadMediaMessage){
  const target=contentAndKey(message);
  if (!target?.message?.imageMessage) throw new Error('Reply to an image first.');
  const declared=Number(target.message.imageMessage.fileLength||0);
  if (declared>MAX_INPUT) throw new Error('Image must be 5 MB or smaller.');
  const buffer=await download(target,'buffer',{},{
    logger,reuploadRequest:sock.updateMediaMessage
  });
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length>MAX_INPUT)
    throw new Error('Image is invalid or too large.');
  const meta=await sharp(buffer,{limitInputPixels:20_000_000,animated:false}).metadata();
  if (!meta.width||!meta.height||meta.width*meta.height>20_000_000 ||
      meta.width>8192||meta.height>8192)
    throw new Error('Image dimensions are too large.');
  return buffer;
}
function validateDegrees(degrees){
  const n=Number(degrees);
  if (![0,90,180,270].includes(n)) throw new Error('Use rotate 90, rotate 180, or rotate 270.');
  return n;
}
function imageTransform(buffer,command,args=[]){
  let image=sharp(buffer,{limitInputPixels:20_000_000,animated:false}).rotate();
  let transparent=false;
  switch(command){
    case 'blur': {
      const value=args[0]===undefined?6:Number(args[0]);
      if (!Number.isFinite(value)||value<1||value>30) throw new Error('Blur must be 1–30.');
      image=image.blur(value);break;
    }
    case 'grayscale':case 'greyscale':image=image.grayscale();break;
    case 'invert':case 'negative':image=image.negate();break;
    case 'rotate':image=image.rotate(validateDegrees(args[0]));break;
    case 'flip':image=image.flip();break;
    case 'mirror':image=image.flop();break;
    case 'enhance':image=image.normalize().sharpen();break;
    case 'pixelate':
      return (async()=>{
        const original=sharp(buffer,{limitInputPixels:20_000_000,animated:false}).rotate();
        const meta=await original.metadata();
        const w=meta.autoOrient?.width||meta.width;
        const h=meta.autoOrient?.height||meta.height;
        const scale=Math.min(1,2048/Math.max(w,h));
        const width=Math.max(1,Math.round(w*scale));
        const height=Math.max(1,Math.round(h*scale));
        const pixelSize=args[0]===undefined?12:Number(args[0]);
        if(!Number.isInteger(pixelSize)||pixelSize<2||pixelSize>64)
          throw new Error('Use pixelate 2 to 64.');
        const smallWidth=Math.max(1,Math.ceil(width/pixelSize));
        const smallHeight=Math.max(1,Math.ceil(height/pixelSize));
        const small=await original.resize(smallWidth,smallHeight,{fit:'fill',kernel:'nearest'})
          .png().toBuffer();
        return sharp(small).resize(width,height,{fit:'fill',kernel:'nearest'})
          .flatten({background:'#ffffff'}).jpeg({quality:83}).toBuffer();
      })();
    case 'resize':{
      const n=Number(args[0]);
      if (!Number.isInteger(n)||n<128||n>2048) throw new Error('Use resize 128 to 2048.');
      image=image.resize(n,n,{fit:'inside',withoutEnlargement:true});break;
    }
    case 'circle':transparent=true;break;
    case 'compress':break;
    default:throw new Error('Unsupported image filter.');
  }
  if (command==='circle'){
    const mask=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><circle cx="256" cy="256" r="250" fill="white"/></svg>');
    return image.resize(512,512,{fit:'cover'}).ensureAlpha()
      .composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  }
  const pipeline=transparent?image:image.flatten({background:'#ffffff'});
  return pipeline.jpeg({quality:command==='compress'?55:83,mozjpeg:false}).toBuffer();
}
function isSimpleText(text,max){
  return typeof text==='string'&&text.trim()&&[...text].length<=max &&
    !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text);
}
function svgTextImage(text,variant='brat',caption=''){
  if (!isSimpleText(text,220)||(caption && !isSimpleText(caption,60))) throw new Error('Text too long (max 220).');
  const lines=splitText(text.trim(),220);
  if (lines.length>9) throw new Error('Too many lines.');
  const font=variant==='qc'?'Arial, sans-serif':'Arial, sans-serif';
  const size=Math.min(variant==='qc'?42:82,variant==='qc'?260/lines.length:320/lines.length);
  const start=variant==='qc'?185:256-(lines.length-1)*size*0.56;
  const textElements=lines.map((line,i)=>'<text x="'+(variant==='qc'?56:256)+
    '" y="'+(start+i*size*1.12)+'" text-anchor="'+(variant==='qc'?'start':'middle')+
    '" font-family="'+font+'" font-size="'+size+'" font-weight="'+
    (variant==='qc'?'600':'900')+'" fill="'+(variant==='qc'?'#222222':'#121212')+'">'+
    xmlSafe(line)+'</text>').join('');
  const background=variant==='qc'
    ?'<rect width="512" height="512" rx="38" fill="#f9f5ef"/>'+
      '<circle cx="62" cy="70" r="25" fill="#88a7cf"/>'+
      '<text x="100" y="78" font-family="Arial" font-weight="700" font-size="23" fill="#202020">'+
      xmlSafe(caption.slice(0,30))+'</text>'
    :'<rect width="512" height="512" fill="#f9f9f9"/>';
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">'+
    background+textElements+'</svg>');
}
async function textImageSticker(text,variant='brat',caption=''){
  const svg=svgTextImage(text,variant,caption);
  const out=await sharp(svg,{limitInputPixels:512*512})
    .webp({quality:75,effort:4}).toBuffer();
  if(out.length>800*1024)throw new Error('Sticker output exceeds size limit.');
  return out;
}
async function handleImage(ctx,download=downloadMediaMessage){
  const {cmd,sock,message,chat,logger,lang,reply}=ctx;
  if (!IMAGE_COMMANDS.has(cmd.name)) return false;
  try{
    if(cmd.name==='brat'){
      const text=cmd.args.join(' ');
      await sock.sendMessage(chat,{sticker:await textImageSticker(text)},{quoted:message});
      return true;
    }
    if(cmd.name==='qc'){
      const quoted=message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const text=quoted?getText({message:quoted}):cmd.args.join(' ');
      if(!text||[...text].length>220)throw new Error('Reply to a short text message (max 220 characters).');
      const sender=message.message?.extendedTextMessage?.contextInfo?.participant;
      const caption=sender?'@'+sender.split('@')[0].slice(-8):'Beauté.';
      await sock.sendMessage(chat,{sticker:await textImageSticker(text,'qc',caption)},{quoted:message});
      return true;
    }
    const buffer=await imageInput(sock,message,logger,download);
    const out=await imageTransform(buffer,cmd.name,cmd.args);
    if(!Buffer.isBuffer(out)||out.length>MAX_OUTPUT)throw new Error('Processed image is too large.');
    await sock.sendMessage(chat,{
      image:out,caption:(lang==='en'?'Image ready: ':'Gambar selesai: ')+cmd.name
    },{quoted:message});
  }catch(error){
    await reply((lang==='en'?'Image processing failed: ':'Pemrosesan gambar gagal: ')+
      String(error.message).slice(0,150));
  }
  return true;
}
module.exports={IMAGE_COMMANDS,imageInput,imageTransform,svgTextImage,textImageSticker,handleImage};
