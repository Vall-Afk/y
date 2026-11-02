'use strict';
// Beauté public-post multi-media downloader. No cookies, credentials, shell, plugins or DRM bypass.
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const DOWNLOAD_COMMANDS=new Set(['tiktok','tiktoknowm','tiktokaudio','instagram','igphoto','igvideo','igreels','ytmp3','ytmp4','twitter','xdl']);
const AUDIO=new Set(['tiktokaudio','ytmp3']);
const MAX_BYTES=64*1024*1024, MAX_TOTAL_BYTES=160*1024*1024, MAX_ITEMS=20, MAX_RUNTIME=180000;
const MIME={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.mkv':'video/x-matroska','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ogg':'audio/ogg','.opus':'audio/ogg'};
const VIDEO_EXT=new Set(['.mp4','.webm','.mkv']), IMAGE_EXT=new Set(['.jpg','.jpeg','.png','.webp']), AUDIO_EXT=new Set(['.mp3','.m4a','.ogg','.opus']);
const HOSTS=new Set(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','tiktok.com','www.tiktok.com','vm.tiktok.com','vt.tiktok.com','instagram.com','www.instagram.com','x.com','www.x.com','twitter.com','www.twitter.com']);
const YT_ID=/^[A-Za-z0-9_-]{11}$/;
function normalizeLink(input,command){
  if(!DOWNLOAD_COMMANDS.has(command))throw Error('Unsupported downloader command.');
  if(typeof input!=='string'||input.length>500)throw Error('Invalid media link.');
  let u;try{u=new URL(input);}catch{throw Error('Use a full https:// URL.');}
  if(u.protocol!=='https:'||u.username||u.password||u.port||!HOSTS.has(u.hostname.toLowerCase()))throw Error('Unsupported or unsafe media URL.');
  const host=u.hostname.toLowerCase(), p=u.pathname;
  if(command.startsWith('yt')){
    if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host))throw Error('YouTube command needs a YouTube URL.');
    let id='';
    if(host==='youtu.be')id=/^\/([\w-]{11})\/?$/.exec(p)?.[1]||'';
    else if(p==='/watch')id=u.searchParams.get('v')||'';
    else id=/^\/(?:shorts|live)\/([\w-]{11})\/?$/.exec(p)?.[1]||'';
    if(!YT_ID.test(id))throw Error('Single YouTube video URL required.');
    return 'https://www.youtube.com/watch?v='+id;
  }
  if(command.startsWith('ig')||command==='instagram'){
    if(!['instagram.com','www.instagram.com'].includes(host))throw Error('Instagram command needs an Instagram URL.');
    const m=/^\/(p|reel|tv)\/([\w-]{5,40})\/?$/.exec(p);
    if(!m)throw Error('Only public Instagram posts/reels are supported.');
    return 'https://www.instagram.com/'+m[1]+'/'+m[2]+'/';
  }
  if(command==='twitter'||command==='xdl'){
    if(!['x.com','www.x.com','twitter.com','www.twitter.com'].includes(host))throw Error('X command needs an X/Twitter URL.');
    const m=/^\/(?:[A-Za-z0-9_]{1,15}|i)\/status\/(\d{10,25})\/?$/.exec(p);
    if(!m)throw Error('Only single public X posts are supported.');
    return 'https://x.com/i/status/'+m[1];
  }
  if(!['tiktok.com','www.tiktok.com','vm.tiktok.com','vt.tiktok.com'].includes(host))throw Error('TikTok command needs a TikTok URL.');
  if(host==='vm.tiktok.com'||host==='vt.tiktok.com'){
    const m=/^\/([A-Za-z0-9_-]{5,30})\/?$/.exec(p);
    if(!m)throw Error('Invalid TikTok short link.');
    return 'https://'+host+'/'+m[1]+'/';
  }
  const m=/^\/@([A-Za-z0-9._]{2,32})\/(video|photo)\/(\d{10,24})\/?$/.exec(p);
  if(!m)throw Error('Only public TikTok video/photo posts are supported.');
  return 'https://www.tiktok.com/@'+m[1]+'/'+m[2]+'/'+m[3];
}
function downloadArgs(command,url){
  if(!DOWNLOAD_COMMANDS.has(command))throw Error('Unsupported downloader command.');
  const args=['--ignore-config','--no-plugin-dirs','--no-remote-components','--ies','default,-generic','--no-cache-dir','--no-warnings','--no-progress','--no-playlist',
    '--match-filters','!is_live & duration <=? 600','--no-write-subs','--no-write-thumbnail','--no-write-info-json','--no-mtime','--no-exec',
    '--no-overwrites','--max-filesize','64M','--playlist-end',String(MAX_ITEMS),
    '--socket-timeout','10','--retries','1','--fragment-retries','1','-o','result.%(autonumber)03d.%(ext)s'];
  // A source post can contain many entries; do not enable account or feed downloads.
  if(!command.startsWith('yt'))args.splice(args.indexOf('--no-playlist'),1);
  if(AUDIO.has(command))args.push('-x','--audio-format','mp3','--audio-quality','5');
  else args.push('-f','bv*+ba/b','--merge-output-format','mp4');
  args.push('--',url);
  return args;
}
function runDownloader(binary,args,{spawnProcess=spawn,timeoutMs=MAX_RUNTIME,cwd}={}){
  return new Promise((resolve,reject)=>{
    let child,done=false,timer,errbuf='';
    const finish=err=>{if(done)return;done=true;clearTimeout(timer);err?reject(err):resolve();};
    try{child=spawnProcess(binary,args,{shell:false,windowsHide:true,cwd,stdio:['ignore','ignore','pipe']});}catch(e){reject(e);return;}
    timer=setTimeout(()=>{try{child.kill('SIGKILL');}catch{}finish(Error('Downloader timed out.'));},timeoutMs);
    timer.unref?.();
    child.stderr?.on('data',d=>{if(errbuf.length<1200)errbuf+=String(d).slice(0,1200-errbuf.length);});
    child.once('error',e=>finish(Error('yt-dlp unavailable: '+e.message)));
    child.once('close',code=>finish(code===0?null:Error('yt-dlp failed ('+code+'): '+errbuf.replace(/[\r\n]+/g,' ').slice(0,120))));
  });
}
function isSupported(name){return /^result\.\d{3}\.(jpg|jpeg|png|webp|mp4|webm|mkv|mp3|m4a|ogg|opus)$/i.test(name);}
const natural=(a,b)=>a.localeCompare(b,'en',{numeric:true});
let running=0;
async function downloadPublicMedia({command,url,binary=process.env.YTDLP_PATH||(process.platform==='win32'?'yt-dlp.exe':'yt-dlp'),run=runDownloader}){
  const source=normalizeLink(url,command);
  if(running>=1)throw Error('Downloader busy; try again later.');
  running++;let dir;
  try{
    dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-download-'));
    await run(binary,downloadArgs(command,source),{cwd:dir});
    const names=(await fs.readdir(dir)).sort(natural);
    if(names.some(n=>/\.(part|ytdl|tmp)$/i.test(n)))throw Error('Incomplete download.');
    const picked=names.filter(isSupported);
    if(picked.length===0||picked.length>MAX_ITEMS)throw Error('No media or media count exceeds 20.');
    const items=[];let total=0;
    for(const name of picked){
      const ext=path.extname(name).toLowerCase();
      if(AUDIO.has(command)?!AUDIO_EXT.has(ext):command.startsWith('yt')?!VIDEO_EXT.has(ext):false)continue;
      const file=path.join(dir,name),stat=await fs.lstat(file);
      if(!stat.isFile()||stat.size<1||stat.size>MAX_BYTES)throw Error('Media exceeds 64 MB or is invalid.');
      total+=stat.size;
      if(total>MAX_TOTAL_BYTES)throw Error('Post exceeds 160 MB total.');
      const buffer=await fs.readFile(file);
      items.push({buffer,mimetype:MIME[ext],name,audio:AUDIO_EXT.has(ext),image:IMAGE_EXT.has(ext),source});
    }
    if(!items.length)throw Error('No compatible media found.');
    return {items,source};
  }finally{if(dir)await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});running--;}
}
function cdnAllowed(u){
  if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
  const allow=(process.env.SAVEAPI_CDN_HOSTS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  return allow.includes(u.hostname.toLowerCase()); // Exact host match; never allow arbitrary provider-supplied URLs.
}
async function downloadViaSaveAPI({command,url,request=fetch}){
  const source=normalizeLink(url,command),key=process.env.SAVEAPI_KEY;
  if(!key)throw Error('SAVEAPI_KEY is not configured.');
  const endpoint=new URL('https://api.saveapi.org/v1/download');endpoint.searchParams.set('url',source);
  const response=await request(endpoint,{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(25000),redirect:'error'});
  if(!response.ok)throw Error('SaveAPI request failed ('+response.status+').');
  const payload=await response.json();if(!payload||payload.success!==true)throw Error('SaveAPI returned no successful result.');
  const audio=AUDIO.has(command), raw=[...(Array.isArray(payload.medias)?payload.medias:[]),...(payload.music?[payload.music]:[])];
  const found=raw.filter(m=>m&&typeof m.url==='string'&&(audio?m.type==='audio':['image','photo','video'].includes(m.type)));
  const unique=[...new Map(found.map(m=>[m.url,m])).values()];
  if(!unique.length||unique.length>MAX_ITEMS)throw Error('SaveAPI returned no supported media or too many items.');
  const items=[];let total=0;
  for(const [i,m] of unique.entries()){
    let u;try{u=new URL(m.url);}catch{throw Error('Invalid SaveAPI media URL.');}
    if(!cdnAllowed(u))throw Error('SaveAPI CDN host is not explicitly allowed.');
    const r=await request(u,{signal:AbortSignal.timeout(30000),redirect:'error'});
    if(!r.ok||!r.body)throw Error('SaveAPI media unavailable.');
    const type=(r.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    const known=Object.entries(MIME).find(([ext,mime])=>mime===type&&(
      audio?AUDIO_EXT.has(ext):IMAGE_EXT.has(ext)||VIDEO_EXT.has(ext)));
    if(!known)throw Error('SaveAPI returned an unsupported media type.');
    const declared=Number(r.headers.get('content-length')||0);
    if(declared>MAX_BYTES||declared+total>MAX_TOTAL_BYTES)throw Error('SaveAPI media too large.');
    const chunks=[];let size=0;
    for await(const chunk of r.body){size+=chunk.length;if(size>MAX_BYTES||total+size>MAX_TOTAL_BYTES)throw Error('SaveAPI media too large.');chunks.push(chunk);}
    if(!size)throw Error('SaveAPI media empty.');
    total+=size;
    const ext=known[0];
    items.push({buffer:Buffer.concat(chunks),mimetype:type,name:'result.'+String(i+1).padStart(3,'0')+ext,audio:AUDIO_EXT.has(ext),image:IMAGE_EXT.has(ext),source});
  }
  return {items,source};
}
async function handleDownload(ctx,download=downloadPublicMedia){
  const {cmd,reply,sock,chat,message,lang,economy,accountSender,owner}=ctx;
  if(!DOWNLOAD_COMMANDS.has(cmd.name))return false;
  const url=cmd.args[0];
  try{
    normalizeLink(url,cmd.name);
    if(economy&&!owner){
      const ok=await economy.consume(accountSender,chat);
      if(!ok){await reply(lang==='en'?'Daily download quota exceeded.':'Limit download harian habis.');return true;}
    }
    let result;
    try{result=await download({command:cmd.name,url});}
    catch(primary){
      if(download!==downloadPublicMedia||!process.env.SAVEAPI_KEY||!process.env.SAVEAPI_CDN_HOSTS)throw primary;
      try{result=await downloadViaSaveAPI({command:cmd.name,url});}
      catch(fallback){throw Error('yt-dlp: '+primary.message+'; SaveAPI: '+fallback.message);}
    }
    const items=Array.isArray(result?.items)?result.items:[result];
    if(!items.length||items.length>MAX_ITEMS)throw Error('Invalid media item count.');
    for(let i=0;i<items.length;i++){
      const m=items[i];if(!Buffer.isBuffer(m.buffer)||!m.buffer.length||m.buffer.length>MAX_BYTES)throw Error('Invalid media buffer.');
      const caption='Beauté · '+(i+1)+'/'+items.length+' · '+(result.source||m.source||'');
      if(m.audio)await sock.sendMessage(chat,{audio:m.buffer,mimetype:m.mimetype,fileName:m.name,ptt:false},{quoted:message});
      else if(m.image||m.mimetype?.startsWith('image/'))await sock.sendMessage(chat,{image:m.buffer,mimetype:m.mimetype,caption},{quoted:message});
      else if(m.mimetype==='video/mp4')await sock.sendMessage(chat,{video:m.buffer,mimetype:m.mimetype,caption},{quoted:message});
      else await sock.sendMessage(chat,{document:m.buffer,mimetype:m.mimetype,fileName:m.name,caption},{quoted:message});
    }
  }catch(err){await reply((lang==='en'?'Download unavailable: ':'Download gagal: ')+String(err.message).slice(0,170));}
  return true;
}
module.exports={DOWNLOAD_COMMANDS,normalizeLink,downloadArgs,runDownloader,downloadPublicMedia,downloadViaSaveAPI,handleDownload};
