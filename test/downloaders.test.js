'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {EventEmitter}=require('node:events');
const {normalizeLink,downloadArgs,downloadPublicMedia,handleDownload,runDownloader}=
  require('../src/features/downloaders');
test('downloaders validate public media URLs and strip tracking queries',()=>{
  assert.equal(normalizeLink('https://youtu.be/abcdefghijk?t=42','ytmp3'),
    'https://www.youtube.com/watch?v=abcdefghijk');
  assert.equal(normalizeLink('https://www.youtube.com/shorts/abcdefghijk','ytmp4'),
    'https://www.youtube.com/watch?v=abcdefghijk');
  assert.equal(normalizeLink('https://www.tiktok.com/@creator/video/1234567890123456789?is_from_webapp=1','tiktok'),
    'https://www.tiktok.com/@creator/video/1234567890123456789');
  assert.equal(normalizeLink('https://www.instagram.com/reel/AbCdEfG12/?igsh=123','instagram'),
    'https://www.instagram.com/reel/AbCdEfG12/');
  for(const bad of [
    'http://www.youtube.com/watch?v=abcdefghijk',
    'https://localhost/watch?v=abcdefghijk',
    'https://www.youtube.com.evil.com/watch?v=abcdefghijk',
    'https://user:password@www.youtube.com/watch?v=abcdefghijk',
    'https://www.youtube.com:12345/watch?v=abcdefghijk',
    'https://www.youtube.com/playlist?list=abc123',
    'https://www.instagram.com/private_profile/',
    'https://www.tiktok.com/@creator/live',
    'file:///etc/passwd'
  ]) assert.throws(()=>normalizeLink(bad,'ytmp4'),/YouTube|unsafe|https|video|URL/);
  assert.throws(()=>normalizeLink('https://www.tiktok.com/@creator/video/1234567890123456789','ytmp3'),/YouTube/);
});
test('command args constrain size duration, avoid playlist/auth/config, and do not invoke shell',async()=>{
  const args=downloadArgs('ytmp3','https://www.youtube.com/watch?v=abcdefghijk');
  assert.ok(args.includes('--ignore-config'));
  assert.ok(args.includes('--no-plugin-dirs'));
  assert.ok(args.includes('--no-remote-components'));
  assert.ok(args.includes('--max-downloads'));
  assert.ok(args.includes('default,-generic'));
  assert.ok(args.includes('--no-playlist'));
  assert.ok(args.includes('--max-filesize'));
  assert.ok(args.includes('64M'));
  assert.ok(args.includes('--match-filters'));
  assert.ok(args.includes('--no-exec'));
  assert.ok(args.includes('--audio-format'));
  assert.ok(!args.includes('--cookies'));
  const calls=[];
  await runDownloader('binary',args,{timeoutMs:500,cwd:'/tmp/workspace',spawnProcess:(_binary,argv,options)=>{
    calls.push({argv,options});
    const child=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{};
    queueMicrotask(()=>child.emit('close',0));
    return child;
  }});
  assert.equal(calls[0].options.shell,false);
  assert.equal(calls[0].options.cwd,'/tmp/workspace');
});
test('download outputs a bounded file from sandboxed temporary directory',async()=>{
  let dir,argv;
  const result=await downloadPublicMedia({
    command:'ytmp4',url:'https://youtu.be/abcdefghijk',
    binary:'mock-binary',
    run:async(_bin,args,options)=>{
      dir=options.cwd;argv=args;
      assert.ok(dir.includes('beaute-download-'));
      assert.ok(args.includes('result.%(autonumber)03d.%(ext)s'));
      await fs.writeFile(path.join(dir,'result.001.mp4'),Buffer.from('fake-mp4-data'));
    }
  });
  assert.equal(result.items[0].buffer.toString(),'fake-mp4-data');
  assert.equal(result.items[0].mimetype,'video/mp4');
  assert.equal(await fs.stat(dir).catch(()=>null),null,'temporary directory removed');
  assert.equal(argv.at(-1),'https://www.youtube.com/watch?v=abcdefghijk');
});
test('download errors clean temp files and reject suspicious output symlinks',async()=>{
  let dir;
  await assert.rejects(downloadPublicMedia({
    command:'tiktok',url:'https://www.tiktok.com/@creator/video/1234567890123456789',
    run:async(_binary,_args,opts)=>{
      dir=opts.cwd;
      await fs.writeFile(path.join(dir,'result.001.mp4'),Buffer.alloc(64*1024*1024+1));
    }
  }),/64 MB/);
  assert.equal(await fs.stat(dir).catch(()=>null),null);
  await assert.rejects(downloadPublicMedia({
    command:'ytmp3',url:'https://youtu.be/abcdefghijk',
    run:async(_binary,_args,opts)=>{
      dir=opts.cwd;
      await fs.writeFile(path.join(dir,'result.001.exe'),Buffer.from('bad'));
    }
  }),/No media/);
  assert.equal(await fs.stat(dir).catch(()=>null),null);
});
test('handler rejects unsafe links before calling downloader or charging API quota',async()=>{
  const sent=[];let consumed=0,called=0;
  const context={
    cmd:{name:'ytmp4',args:['http://localhost/secret']},
    lang:'en',owner:false,accountSender:'6281111111111@s.whatsapp.net',
    economy:{consume:async()=>{consumed++;return true}},
    reply:async x=>sent.push({text:x}),
    sock:{sendMessage:async(_chat,body)=>sent.push(body)},
    chat:'6281111111111@s.whatsapp.net',message:{}
  };
  await handleDownload(context,async()=>{called++;throw Error('unexpected')});
  assert.equal(consumed,0);assert.equal(called,0);
  assert.match(sent.at(-1).text,/Download unavailable/);
});

test('X downloader accepts public post URLs and rejects unrelated hosts',()=>{
  assert.equal(normalizeLink('https://x.com/example/status/1234567890123456789?s=20','xdl'),
    'https://x.com/i/status/1234567890123456789');
  assert.equal(normalizeLink('https://twitter.com/example/status/1234567890123456789','twitter'),
    'https://x.com/i/status/1234567890123456789');
  assert.throws(()=>normalizeLink('https://example.com/example/status/1234567890123456789','xdl'));
  assert.throws(()=>normalizeLink('https://x.com/example/likes','xdl'));
  assert.ok(downloadArgs('xdl','https://x.com/i/status/1234567890123456789').includes('--no-playlist'));
});
