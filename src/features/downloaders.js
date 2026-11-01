'use strict';
// Optional public-media downloads with an external yt-dlp binary.
// No cookies, login, DRM workarounds, plugins, arbitrary hosts or shell.
// Users must have rights to save/forward the source media.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const DOWNLOAD_COMMANDS = new Set([
  'tiktok','tiktoknowm','tiktokaudio','instagram','igphoto','igvideo',
  'igreels','ytmp3','ytmp4'
]);
const MAX_BYTES = 12 * 1024 * 1024, MAX_RUNTIME = 90000;
const VIDEO = new Set(['tiktok','tiktoknowm','instagram','igphoto','igvideo','igreels','ytmp4']);
const AUDIO = new Set(['tiktokaudio','ytmp3']);
const ALLOWED_HOSTS = new Set([
  'youtube.com','www.youtube.com','m.youtube.com','youtu.be',
  'www.tiktok.com','tiktok.com','vm.tiktok.com','vt.tiktok.com',
  'instagram.com','www.instagram.com'
]);
const ID = /^[A-Za-z0-9_-]{11}$/;
function normalizeLink(input, command) {
  if (typeof input !== 'string' || input.length > 500) throw new Error('Invalid media link.');
  let url;
  try { url = new URL(input); } catch { throw new Error('Use a full https:// URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) throw new Error('Unsupported or unsafe media URL.');
  const host = url.hostname.toLowerCase(), pathname = url.pathname;
  if (/^yt/.test(command)) {
    if (!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host))
      throw new Error('YouTube command needs a YouTube URL.');
    let videoId = '';
    if (host === 'youtu.be') {
      const match = /^\/([A-Za-z0-9_-]{11})\/?$/.exec(pathname);
      videoId = match?.[1] || '';
    } else if (pathname === '/watch') videoId = url.searchParams.get('v') || '';
    else videoId = /^\/(?:shorts|live)\/([A-Za-z0-9_-]{11})\/?$/.exec(pathname)?.[1] || '';
    if (!ID.test(videoId)) throw new Error('Single YouTube video URL required.');
    return 'https://www.youtube.com/watch?v=' + videoId;
  }
  if (command.startsWith('ig') || command === 'instagram') {
    if (!['instagram.com','www.instagram.com'].includes(host))
      throw new Error('Instagram command needs an Instagram URL.');
    const match = /^\/(p|reel|tv)\/([A-Za-z0-9_-]{5,40})\/?$/.exec(pathname);
    if (!match) throw new Error('Only public Instagram posts or reels are supported.');
    return 'https://www.instagram.com/' + match[1] + '/' + match[2] + '/';
  }
  if (!['tiktok.com','www.tiktok.com','vm.tiktok.com','vt.tiktok.com'].includes(host))
    throw new Error('TikTok command needs a TikTok URL.');
  if (['vm.tiktok.com','vt.tiktok.com'].includes(host)) {
    const match = /^\/([A-Za-z0-9_-]{5,30})\/?$/.exec(pathname);
    if (!match) throw new Error('Invalid TikTok short link.');
    return 'https://' + host + '/' + match[1] + '/';
  }
  const match = /^\/@([A-Za-z0-9._]{2,32})\/video\/(\d{10,24})\/?$/.exec(pathname);
  if (!match) throw new Error('Only single public TikTok videos are supported.');
  return 'https://www.tiktok.com/@' + match[1] + '/video/' + match[2];
}
function downloadArgs(command, url) {
  if (!DOWNLOAD_COMMANDS.has(command)) throw new Error('Unsupported downloader command.');
  const base = [
    '--ignore-config','--no-playlist','--playlist-items','1',
    '--no-cache-dir','--no-warnings','--no-progress',
    '--no-write-subs','--no-write-thumbnail','--no-write-info-json',
    '--no-mtime','--no-exec','--no-overwrites',
    '--max-filesize','12M','--socket-timeout','10','--retries','1',
    '--fragment-retries','1',
    '-o','result.%(ext)s'
  ];
  if (AUDIO.has(command)) base.push('-x','--audio-format','mp3','--audio-quality','5');
  else base.push('-f','best[ext=mp4][height<=480]/best[height<=480]/best');
  base.push('--',url);
  return base;
}
function runDownloader(binary,args,{spawnProcess=spawn,timeoutMs=MAX_RUNTIME}={}) {
  return new Promise((resolve,reject)=>{
    let child,done=false,errbuf='';
    const complete=err=>{
      if(done)return;done=true;clearTimeout(timer);
      if(err)reject(err);else resolve();
    };
    try {
      child=spawnProcess(binary,args,{
        shell:false,windowsHide:true,
        stdio:['ignore','ignore','pipe']
      });
    }catch(err){reject(err);return;}
    const timer=setTimeout(()=>{
      try{child.kill('SIGKILL');}catch{}
      complete(new Error('Downloader timed out.'));
    },timeoutMs);
    timer.unref?.();
    child.stderr?.on('data',data=>{
      if(errbuf.length<1500)errbuf+=String(data).slice(0,1500-errbuf.length);
    });
    child.once('error',err=>complete(new Error('yt-dlp binary unavailable: '+err.message)));
    child.once('close',code=>complete(code===0?null:
      new Error('yt-dlp failed ('+code+'): '+errbuf.replace(/[\r\n]+/g,' ').slice(0,120))));
  });
}
let running = 0;
async function downloadPublicMedia({
  command,url,binary=process.env.YTDLP_PATH || (process.platform==='win32'?'yt-dlp.exe':'yt-dlp'),
  run=runDownloader
}) {
  if (!DOWNLOAD_COMMANDS.has(command)) throw new Error('Unsupported downloader command.');
  const normalized=normalizeLink(url,command);
  if(running>=1)throw new Error('Downloader is busy; try again later.');
  running++;
  let dir;
  try{
    dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-download-'));
    await run(binary,downloadArgs(command,normalized),{cwd:dir});
    const names=await fs.readdir(dir);
    const eligible=names.filter(name=>/^result\.(mp4|webm|m4a|mp3|ogg|opus|mkv)$/i.test(name));
    if(eligible.length!==1 || names.some(name=>name.endsWith('.part')))
      throw new Error('No single downloadable audio/video file was produced.');
    const filename=eligible[0],full=path.join(dir,filename);
    const stat=await fs.lstat(full);
    if(!stat.isFile()||stat.size<1||stat.size>MAX_BYTES)
      throw new Error('Downloaded media exceeds 12 MB or is invalid.');
    const data=await fs.readFile(full);
    if(data.length>MAX_BYTES)throw new Error('Downloaded file too large.');
    const extension=path.extname(filename).toLowerCase();
    return {
      buffer:data,
      audio:AUDIO.has(command),
      mimetype:extension==='.mp3'?'audio/mpeg':extension==='.m4a'?'audio/mp4':
        extension==='.opus'||extension==='.ogg'?'audio/ogg':
        extension==='.webm'?'video/webm':extension==='.mkv'?'video/x-matroska':'video/mp4',
      name:filename,source:normalized
    };
  }finally{
    if(dir)await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});
    running--;
  }
}
async function handleDownload(ctx,download=downloadPublicMedia){
  const {cmd,reply,sock,chat,message,lang,economy,accountSender,owner}=ctx;
  if(!DOWNLOAD_COMMANDS.has(cmd.name))return false;
  const url=cmd.args[0];
  try{
    normalizeLink(url,cmd.name);
    if(economy&&!owner){
      const allowed=await economy.consume(accountSender);
      if(!allowed){await reply(lang==='en'?'Daily download quota exceeded.':'Limit download harian habis.');return true;}
    }
    const media=await download({command:cmd.name,url});
    if(media.audio){
      await sock.sendMessage(chat,{audio:media.buffer,mimetype:media.mimetype,
        fileName:media.name,ptt:false},{quoted:message});
    }else if(media.mimetype==='video/mp4'){
      await sock.sendMessage(chat,{video:media.buffer,mimetype:media.mimetype,
        caption:'Beauté. · '+media.source},{quoted:message});
    }else{
      await sock.sendMessage(chat,{document:media.buffer,mimetype:media.mimetype,
        fileName:media.name,caption:'Beauté. · '+media.source},{quoted:message});
    }
  }catch(err){
    await reply((lang==='en'?'Download unavailable: ':'Download gagal: ')+
      String(err.message).slice(0,170));
  }
  return true;
}
module.exports={DOWNLOAD_COMMANDS,normalizeLink,downloadArgs,runDownloader,
  downloadPublicMedia,handleDownload};
