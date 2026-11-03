'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {Readable}=require('node:stream');
const {normalizeLink,downloadArgs,downloadPublicMedia,downloadViaGalleryDL,downloadViaSaveAPI,handleDownload}=require('../src/features/downloaders');
const IG='https://www.instagram.com/p/AbCdEf123/';
const TT='https://www.tiktok.com/@creator/photo/1234567890123456789';
const X='https://x.com/example/status/1234567890123456789';
test('normalizes TikTok photo and Instagram/X posts',()=>{
  assert.equal(normalizeLink(TT+'?tracking=1','tiktok'),TT);
  assert.equal(normalizeLink(IG+'?utm=1','igphoto'),IG);
  assert.equal(normalizeLink(X+'?s=20','xdl'),'https://x.com/i/status/1234567890123456789');
  assert.throws(()=>normalizeLink('https://evil.com/post','instagram'),/unsafe/);
});
test('yt-dlp arguments allow multiple media without credentials',()=>{
  const a=downloadArgs('instagram',IG);
  assert.ok(a.includes('--playlist-end'));
  assert.ok(a.includes('--playlist-end'));
  assert.ok(a.includes('64M'));
  assert.ok(a.includes('result.%(autonumber)03d.%(ext)s'));
  assert.ok(!a.includes('--cookies'));
  assert.ok(!a.includes('--no-playlist'));
  assert.ok(downloadArgs('ytmp4','https://www.youtube.com/watch?v=abcdefghijk').includes('--no-playlist'));
});
test('returns every mixed slide in order and cleans temporary files',async()=>{
  let dir;
  const result=await downloadPublicMedia({command:'instagram',url:IG,run:async(_bin,_args,opts)=>{
    dir=opts.cwd;
    await fs.writeFile(path.join(dir,'result.010.jpg'),Buffer.from('ten'));
    await fs.writeFile(path.join(dir,'result.002.mp4'),Buffer.from('two'));
    await fs.writeFile(path.join(dir,'result.001.webp'),Buffer.from('one'));
  }});
  assert.deepEqual(result.items.map(x=>x.buffer.toString()),['one','two','ten']);
  assert.deepEqual(result.items.map(x=>x.mimetype),['image/webp','video/mp4','image/jpeg']);
  assert.equal(await fs.stat(dir).catch(()=>null),null);
});
test('rejects symlinks, unrelated extensions and oversized media',async(t)=>{
  let dir;
  let symlinkUnavailable=false;
  const symlinkAttempt=downloadPublicMedia({command:'tiktok',url:TT,run:async(_b,_a,o)=>{
    dir=o.cwd;
    try { await fs.symlink(__filename,path.join(dir,'result.001.jpg')); }
    catch (err) {
      if (process.platform==='win32' && ['EPERM','EACCES','ENOTSUP'].includes(err.code)) {
        symlinkUnavailable=true;
        return;
      }
      throw err;
    }
  }});
  await assert.rejects(symlinkAttempt,err=>{
    assert.match(String(err.message),symlinkUnavailable ? /No media/i : /invalid/i);
    return true;
  });
  if (symlinkUnavailable) t.diagnostic('Windows denied symlink creation; security rejection tested on symlink-capable platforms.');
  assert.equal(await fs.stat(dir).catch(()=>null),null);
  await assert.rejects(downloadPublicMedia({command:'tiktok',url:TT,run:async(_b,_a,o)=>{
    dir=o.cwd;await fs.writeFile(path.join(dir,'result.001.exe'),Buffer.from('x'));
  }}),/No media/);
  assert.equal(await fs.stat(dir).catch(()=>null),null);
  await assert.rejects(downloadPublicMedia({command:'tiktok',url:TT,run:async(_b,_a,o)=>{
    dir=o.cwd;await fs.writeFile(path.join(dir,'result.001.jpg'),Buffer.alloc(64*1024*1024+1));
  }}),/64 MB/);
  assert.equal(await fs.stat(dir).catch(()=>null),null);
});
test('sends all WhatsApp carousel attachments in order',async()=>{
  const sent=[],ctx={cmd:{name:'igphoto',args:[IG]},reply:async x=>sent.push({text:x}),owner:true,
    sock:{sendMessage:async(_chat,msg)=>sent.push(msg)},chat:'123@s.whatsapp.net',message:{}};
  await handleDownload(ctx,async()=>({source:IG,items:[
    {buffer:Buffer.from('a'),mimetype:'image/jpeg',image:true},
    {buffer:Buffer.from('b'),mimetype:'video/mp4'},
    {buffer:Buffer.from('c'),mimetype:'image/png',image:true}
  ]}));
  assert.deepEqual(sent.map(s=>s.image?'image':s.video?'video':'other'),['image','video','image']);
  assert.match(sent[2].caption,/3\/3/);
});
test('SaveAPI returns all slides but rejects non-allowlisted CDN hosts',async()=>{
  const oldKey=process.env.SAVEAPI_KEY,oldHosts=process.env.SAVEAPI_CDN_HOSTS;
  process.env.SAVEAPI_KEY='unit-test';process.env.SAVEAPI_CDN_HOSTS='cdn.example.net';
  const request=async url=>{
    if(String(url).includes('api.saveapi.org'))return {ok:true,json:async()=>({success:true,medias:[
      {type:'image',url:'https://cdn.example.net/1.jpg'},
      {type:'image',url:'https://cdn.example.net/2.png'}
    ]})};
    return {ok:true,headers:new Map([['content-type',String(url).endsWith('png')?'image/png':'image/jpeg'],['content-length','1']]),body:Readable.from([Buffer.from('x')])};
  };
  try{
    const result=await downloadViaSaveAPI({command:'instagram',url:IG,request});
    assert.equal(result.items.length,2);
    process.env.SAVEAPI_CDN_HOSTS='';
    await assert.rejects(downloadViaSaveAPI({command:'instagram',url:IG,request}),/not explicitly allowed/);
  }finally{
    if(oldKey===undefined)delete process.env.SAVEAPI_KEY;else process.env.SAVEAPI_KEY=oldKey;
    if(oldHosts===undefined)delete process.env.SAVEAPI_CDN_HOSTS;else process.env.SAVEAPI_CDN_HOSTS=oldHosts;
  }
});

test('gallery-dl optional backend collects photo items and cleans temporary directory',async()=>{
  let cwd,argv;
  const out=await downloadViaGalleryDL({command:'tiktok',url:TT,run:async(_binary,args,opts)=>{
    argv=args;cwd=opts.cwd;
    await fs.writeFile(path.join(cwd,'02.jpg'),Buffer.from('slide2'));
    await fs.writeFile(path.join(cwd,'01.webp'),Buffer.from('slide1'));
  }});
  assert.ok(argv.includes('--config-ignore'));
  assert.ok(argv.includes('--range'));
  assert.deepEqual(out.items.map(x=>x.buffer.toString()),['slide1','slide2']);
  assert.equal(await fs.stat(cwd).catch(()=>null),null);
});
