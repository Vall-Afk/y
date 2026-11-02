'use strict';
// Bounded, local FFmpeg conversions. No shell, user-controlled output paths,
// arbitrary URLs, or dynamic filter expressions. FFmpeg is optional: normal
// bot startup must work even when the binary is not installed.
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {downloadMediaMessage}=require('@whiskeysockets/baileys');
const MEDIA_COMMANDS=new Set(['tomp3','toaudio','tovn','tovideo','tosticker','togif']);
const MAX_INPUT=12*1024*1024,MAX_OUTPUT=12*1024*1024;
let active=0;
function ffmpegBinary(){
  if(process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try { const result=require('ffmpeg-static');if(result)return result; }
  catch {}
  return process.platform==='win32'?'ffmpeg.exe':'ffmpeg';
}
function mediaTarget(message){
  const m=message.message||{};
  if(m.videoMessage||m.audioMessage||m.stickerMessage||m.imageMessage)
    return message;
  const ci=m.extendedTextMessage?.contextInfo || {};
  if(!ci.quotedMessage)return null;
  return {
    key:{remoteJid:message.key.remoteJid, id:ci.stanzaId, participant:ci.participant},
    message:ci.quotedMessage
  };
}
function mediaKind(target){
  const m=target?.message||{};
  if(m.audioMessage)return ['audio','mp3'];
  if(m.videoMessage)return ['video','mp4'];
  if(m.stickerMessage)return ['sticker','webp'];
  if(m.imageMessage)return ['image','png'];
  return null;
}
async function boundedDownload(sock,message,logger,download=downloadMediaMessage){
  const target=mediaTarget(message);
  const kind=mediaKind(target);
  if(!kind)throw new Error('Reply to an audio, video, sticker, or image message.');
  const item=target.message[kind[0]+'Message'];
  const bytes=Number(item.fileLength||0);
  if(bytes>MAX_INPUT)throw new Error('Media too large (limit 12 MB).');
  // Do not download any URL from the message; only the authenticated media.
  const buffer=await download(target,'buffer',{},{
    logger,reuploadRequest:sock.updateMediaMessage
  });
  if(!Buffer.isBuffer(buffer)||!buffer.length||buffer.length>MAX_INPUT)
    throw new Error('Media invalid or exceeds 12 MB.');
  return {buffer,kind:kind[0],ext:kind[1]};
}
function encodeOptions(command,kind,input,output){
  const first=['-hide_banner','-loglevel','error','-nostdin','-y'];
  if(command==='tomp3'||command==='toaudio'||command==='tovn'){
    if(!['audio','video'].includes(kind))throw new Error('This conversion needs audio/video media.');
    return [...first,'-i',input,'-t','30','-vn','-map','0:a:0',
      '-ac','1','-ar','48000','-threads','1',
      ...(command==='tovn'?['-c:a','libopus','-b:a','48k']:['-c:a','libmp3lame','-b:a','128k']),
      output];
  }
  if(command==='tovideo'||command==='togif'){
    if(!['sticker','image'].includes(kind))throw new Error('Reply to a static image or sticker.');
    return [...first,'-loop','1','-i',input,'-t','3','-an','-r','15',
      '-vf','scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
      '-c:v','libx264','-preset','veryfast','-movflags','+faststart','-threads','1',
      output];
  }
  if(command==='tosticker'){
    if(kind!=='video')throw new Error('Reply to a short video for a moving sticker.');
    return [...first,'-i',input,'-t','5','-an',
      '-vf','fps=8,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
      '-c:v','libwebp_anim','-loop','0','-q:v','50','-threads','1',output];
  }
  throw new Error('Unsupported conversion.');
}
function runFfmpeg(binary,args,{timeoutMs=35000,spawnProcess=spawn}={}){
  return new Promise((resolve,reject)=>{
    let settled=false,stderr='',timer;
    const finish=err=>{
      if(settled)return;settled=true;
      if(timer)clearTimeout(timer);
      if(err)reject(err);else resolve();
    };
    let child;
    try{child=spawnProcess(binary,args,{shell:false,windowsHide:true,stdio:['ignore','ignore','pipe']});}
    catch(e){finish(e);return;}
    timer=setTimeout(()=>{
      try{child.kill('SIGKILL');}catch{}
      finish(new Error('FFmpeg conversion timed out.'));
    },timeoutMs);
    timer.unref?.();
    child.stderr?.on('data',part=>{if(stderr.length<1500)stderr+=String(part).slice(0,1500-stderr.length);});
    child.once('error',e=>finish(new Error('FFmpeg not available. Install FFmpeg or check FFMPEG_PATH: '+e.message)));
    child.once('close',(code,signal)=>finish(code===0?null:new Error('FFmpeg failed ('+code+
      '): '+stderr.replace(/[\r\n]+/g,' ').slice(0,160))));
  });
}
async function transcode({command,media,logger,download=downloadMediaMessage,
  run=runFfmpeg,binary=ffmpegBinary()}){
  if(!MEDIA_COMMANDS.has(command))throw new Error('Unsupported conversion.');
  if(active>=2)throw new Error('Media converter busy; try again later.');
  active++;
  let tempDir;
  try{
    const {buffer,kind,ext}=await boundedDownload(media.sock,media.message,logger,download);
    tempDir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-media-'));
    const input=path.join(tempDir,'input.'+ext);
    const targetExt=['tomp3','toaudio'].includes(command)?'mp3':
      command==='tovn'?'ogg':command==='tosticker'?'webp':'mp4';
    const output=path.join(tempDir,'result.'+targetExt);
    await fs.writeFile(input,buffer,{mode:0o600});
    await run(binary,encodeOptions(command,kind,input,output));
    const stat=await fs.stat(output);
    if(stat.size===0||stat.size>MAX_OUTPUT)throw new Error('Conversion output invalid/too large.');
    return await fs.readFile(output);
  }finally{
    if(tempDir)await fs.rm(tempDir,{recursive:true,force:true}).catch(()=>{});
    active--;
  }
}
async function handleTranscode(ctx,options={}){
  const {cmd,reply,sock,message,chat,logger,lang}=ctx;
  if(!MEDIA_COMMANDS.has(cmd.name))return false;
  try{
    const data=await transcode({command:cmd.name,media:{sock,message},logger,...options});
    let body;
    if(['tomp3','toaudio'].includes(cmd.name)){
      body={audio:data,mimetype:'audio/mpeg',ptt:false};
    }else if(cmd.name==='tovn'){
      body={audio:data,mimetype:'audio/ogg; codecs=opus',ptt:true};
    }else if(cmd.name==='tosticker'){
      body={sticker:data};
    }else{
      body={video:data,mimetype:'video/mp4',gifPlayback:cmd.name==='togif'};
    }
    await sock.sendMessage(chat,body,{quoted:message});
  }catch(err){
    await reply((lang==='en'?'Conversion failed: ':'Konversi gagal: ')+
      String(err.message).slice(0,180));
  }
  return true;
}
module.exports={MEDIA_COMMANDS,ffmpegBinary,mediaTarget,mediaKind,encodeOptions,
  runFfmpeg,boundedDownload,transcode,handleTranscode};
