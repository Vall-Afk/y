'use strict';
// Local replacements for legacy utilities. No external image scraping,
// untrusted URL fetching, account enumeration or automated group discovery.
const sharp=require('sharp');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createHash,randomInt}=require('node:crypto');
const {xmlSafe,svgTtp}=require('./sticker-tools');
const {imageInput}=require('./image-studio');
const {ffmpegBinary,runFfmpeg}=require('./transcode');
const LEGACY_UTILITY_COMMANDS=new Set([
  'attp','emojimix','nuliskiri','nuliskanan','foliokiri','foliokanan',
  'cecan','cogan','waifu','jeda','mediafire','pinterest','grupwa',
  'searchbyimage','nowa','getquoted'
]);
const PAPER=new Set(['nuliskiri','nuliskanan','foliokiri','foliokanan']);
const PORTRAIT=new Set(['cecan','cogan','waifu']);
const MAX_TEXT=180;
function paperSvg(text,style){
  if(!PAPER.has(style))throw new Error('Unknown notebook style.');
  if(typeof text!=='string'||!text.trim()||[...text].length>MAX_TEXT)
    throw new Error('Write 1–180 characters.');
  const words=text.replace(/\s+/g,' ').trim().split(' ');
  const lines=[];let line='';
  for(const word of words){
    if([...word].length>33)throw new Error('Word too long for notebook.');
    if(line&&[...(line+' '+word)].length>33){lines.push(line);line=word;}
    else line=line?line+' '+word:word;
  }
  if(line)lines.push(line);
  if(lines.length>8)throw new Error('Too many notebook lines.');
  const right=style.endsWith('kanan'),folio=style.startsWith('folio');
  const x=right?525:120,rotation=right?1.2:-1.2;
  const ruled=Array.from({length:16},(_,i)=>'<line x1="70" y1="'+(125+i*38)+
    '" x2="960" y2="'+(125+i*38)+'" stroke="#a4c6d8" stroke-width="1.6"/>').join('');
  const writing=lines.map((s,i)=>'<text x="'+x+'" y="'+(177+i*47)+
    '" font-size="35" font-family="Comic Sans MS, cursive" fill="#24476e">'+xmlSafe(s)+'</text>').join('');
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768">'+
    '<rect width="1024" height="768" fill="#c3a78a"/><rect x="40" y="24" width="944" height="720" rx="12" fill="'+
    (folio?'#fff9e8':'#fffef7')+'"/><line x1="'+(right?925:105)+
    '" y1="55" x2="'+(right?925:105)+'" y2="713" stroke="#e8a0a0" stroke-width="3"/>'+
    ruled+'<g transform="rotate('+rotation+' 512 384)">'+writing+'</g></svg>');
}
function emojiPair(text){
  const parts=text.split('+').map(x=>x.trim()).filter(Boolean);
  if(parts.length!==2||parts.some(x=>[...x].length>8||
    !/\p{Extended_Pictographic}/u.test(x)))throw new Error('Use emojimix 😀+😎');
  return parts;
}
function emojiSvg(pair){
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">'+
    '<rect width="512" height="512" rx="110" fill="#251845"/>'+
    '<circle cx="165" cy="230" r="135" fill="#f4ad4c"/>'+
    '<circle cx="345" cy="290" r="130" fill="#c886f7"/>'+
    '<text x="155" y="255" text-anchor="middle" font-size="140" font-family="sans-serif">'+
    xmlSafe(pair[0])+'</text><text x="340" y="330" text-anchor="middle" font-size="140" font-family="sans-serif">'+
    xmlSafe(pair[1])+'</text><text x="256" y="470" text-anchor="middle" font-size="25" fill="white" font-family="sans-serif">Beauté. MIX</text></svg>');
}
function portraitSvg(style,seed){
  if(!PORTRAIT.has(style))throw new Error('Unknown avatar style.');
  const palette={
    cecan:['#ffe7dd','#db5b88','#8b446d','#e8b6a3'],
    cogan:['#cce9f1','#397a9b','#283a66','#d5a17f'],
    waifu:['#e8dafa','#9b72e5','#5644b2','#f3c7ba']
  }[style];
  const accent=seed%3;
  const hair=palette[2],skin=palette[3],back=palette[0],coat=palette[1];
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768">'+
    '<rect width="768" height="768" rx="40" fill="'+back+'"/>'+
    '<circle cx="'+(120+seed%80)+'" cy="130" r="110" fill="'+coat+'" opacity=".18"/>'+
    '<circle cx="610" cy="560" r="190" fill="'+coat+'" opacity=".12"/>'+
    '<path d="M115 768 Q160 510 384 525 Q615 500 665 768Z" fill="'+coat+'"/>'+
    '<path d="M236 356 Q198 145 386 135 Q579 135 534 367 L550 545 Q492 590 385 580 Q265 590 219 545Z" fill="'+hair+'"/>'+
    '<ellipse cx="384" cy="371" rx="144" ry="176" fill="'+skin+'"/>'+
    '<path d="M240 316 Q250 165 384 164 Q525 160 528 310 Q440 265 382 236 Q330 306 240 316Z" fill="'+hair+'"/>'+
    '<ellipse cx="327" cy="369" rx="11" ry="16" fill="#322d3c"/>'+
    '<ellipse cx="441" cy="369" rx="11" ry="16" fill="#322d3c"/>'+
    '<path d="M358 450 Q384 '+(accent===0?467:480)+' 412 450" fill="none" stroke="#8b5154" stroke-width="7" stroke-linecap="round"/>'+
    '<path d="M315 535 Q384 584 454 535" fill="none" stroke="'+hair+'" stroke-width="17"/>'+
    '<text x="384" y="720" font-size="29" text-anchor="middle" fill="white" font-family="sans-serif">Beauté. original avatar</text></svg>');
}
function safeMediafire(input){
  let u;try{u=new URL(input)}catch{throw new Error('Use a MediaFire HTTPS file link.');}
  if(u.protocol!=='https:'||u.port||u.username||u.password||
    !['www.mediafire.com','mediafire.com'].includes(u.hostname.toLowerCase()))
    throw new Error('Only official MediaFire HTTPS links are accepted.');
  const m=/^\/file\/([A-Za-z0-9]{5,40})(?:\/[A-Za-z0-9_.()% -]{1,120})?(?:\/file)?\/?$/.exec(u.pathname);
  if(!m)throw new Error('Expected a single MediaFire /file/ link.');
  return 'https://www.mediafire.com/file/'+m[1]+'/file';
}
function quotedText(message){
  const ctx=message.message?.extendedTextMessage?.contextInfo||
    message.message?.imageMessage?.contextInfo||
    message.message?.videoMessage?.contextInfo||{};
  const quoted=ctx.quotedMessage;
  if(!quoted||!ctx.stanzaId)return'';
  return String(quoted.conversation||quoted.extendedTextMessage?.text||
    quoted.imageMessage?.caption||quoted.videoMessage?.caption||'').slice(0,1100);
}
function safeSearchUrl(service,term){
  const q=String(term||'').trim();
  if(!q||[...q].length>100)throw new Error('Search phrase must be 1–100 characters.');
  if(service==='pinterest')return 'https://www.pinterest.com/search/pins/?q='+encodeURIComponent(q);
  if(service==='grupwa')return 'https://www.google.com/search?q='+encodeURIComponent('komunitas WhatsApp '+q);
  throw new Error('Unknown search service.');
}
async function animatedTtp(text,{run=runFfmpeg,binary=ffmpegBinary()}={}){
  if(!text||[...text].length>85)throw new Error('Use attp <text> (max 85).');
  let dir;
  try{
    dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-attp-'));
    const input=path.join(dir,'input.png'),output=path.join(dir,'animated.webp');
    await fs.writeFile(input,await sharp(svgTtp(text)).png().toBuffer(),{mode:0o600});
    await run(binary,['-hide_banner','-loglevel','error','-nostdin','-y',
      '-loop','1','-i',input,'-t','2','-vf','fps=8,hue=h=2*PI*t',
      '-an','-c:v','libwebp_anim','-loop','0','-q:v','52','-threads','1',output]);
    const stat=await fs.stat(output);
    if(!stat.isFile()||stat.size<1||stat.size>900*1024)
      throw new Error('Animated sticker invalid or exceeds 900 KB.');
    return await fs.readFile(output);
  }finally{if(dir)await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});}
}
async function handleLegacyUtilities(ctx,options={}){
  const {cmd,reply,sock,chat,message,lang,logger}=ctx;
  if(!LEGACY_UTILITY_COMMANDS.has(cmd.name))return false;
  const text=cmd.args.join(' ').trim();
  try{
    if(cmd.name==='attp'){
      const buffer=await (options.animatedTtp||animatedTtp)(text);
      await sock.sendMessage(chat,{sticker:buffer},{quoted:message});
    }else if(cmd.name==='emojimix'){
      const sticker=await sharp(emojiSvg(emojiPair(text))).webp({quality:82}).toBuffer();
      await sock.sendMessage(chat,{sticker},{quoted:message});
    }else if(PAPER.has(cmd.name)){
      const buffer=await sharp(paperSvg(text,cmd.name)).png().toBuffer();
      await sock.sendMessage(chat,{image:buffer,caption:'✍️ Beauté. · '+cmd.name},{quoted:message});
    }else if(PORTRAIT.has(cmd.name)){
      const buffer=await sharp(portraitSvg(cmd.name,randomInt(1000000))).png().toBuffer();
      await sock.sendMessage(chat,{image:buffer,caption:'Original illustrated avatar · '+cmd.name},{quoted:message});
    }else if(cmd.name==='jeda'){
      const n=Number(cmd.args[0]);
      if(!Number.isInteger(n)||n<1||n>5)throw new Error('Use jeda 1–5 (seconds).');
      await (options.sleep||((ms)=>new Promise(r=>setTimeout(r,ms))))(n*1000);
      await reply('⏱️ '+n+' '+(lang==='en'?'seconds elapsed.':'detik berlalu.'));
    }else if(cmd.name==='mediafire'){
      await reply('MediaFire: '+safeMediafire(text)+
        '\n'+(lang==='en'?'Open in your browser. Automatic file downloads are not supported.':
          'Buka lewat browser. Pengunduhan file otomatis belum didukung.'));
    }else if(cmd.name==='pinterest'||cmd.name==='grupwa'){
      await reply(safeSearchUrl(cmd.name,text)+'\n'+
        (lang==='en'?'Search opens in your browser; the bot does not scrape or join groups.':
          'Pencarian dibuka di browser; bot tidak mengambil gambar atau masuk grup otomatis.'));
    }else if(cmd.name==='searchbyimage'){
      const data=await imageInput(sock,message,logger,options.download);
      await reply('SHA-256: '+createHash('sha256').update(data).digest('hex')+
        '\n'+(lang==='en'?'Local image fingerprint only. No photo is uploaded for internet reverse search.':
          'Sidik jari gambar lokal. Foto tidak diunggah untuk pencarian balik internet.'));
    }else if(cmd.name==='nowa'){
      const number=cmd.args[0]?.replace(/^\+/,'');
      if(!/^[1-9]\d{7,14}$/.test(number||''))throw new Error('Use nowa 628123456789');
      await reply('https://wa.me/'+number+'\n'+
        (lang==='en'?'This link does not verify whether the number is registered.':
          'Tautan ini tidak memeriksa apakah nomor terdaftar.'));
    }else if(cmd.name==='getquoted'){
      const quote=quotedText(message);
      await reply(quote|| (lang==='en'?'Reply to a text/caption message first.':
        'Balas pesan teks/caption terlebih dahulu.'));
    }
  }catch(err){
    await reply((lang==='en'?'Legacy utility: ':'Utilitas legacy: ')+String(err.message).slice(0,190));
  }
  return true;
}
module.exports={LEGACY_UTILITY_COMMANDS,PAPER,PORTRAIT,paperSvg,emojiPair,emojiSvg,
  portraitSvg,safeMediafire,quotedText,safeSearchUrl,animatedTtp,handleLegacyUtilities};
