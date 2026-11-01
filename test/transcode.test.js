'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {EventEmitter}=require('node:events');
const {mediaTarget,mediaKind,encodeOptions,runFfmpeg,transcode,boundedDownload,handleTranscode}=
  require('../src/features/transcode');
const message=(body,quoted)=>({
  key:{remoteJid:'6281111111111@s.whatsapp.net'},
  message:quoted?{extendedTextMessage:{text:'tomp3',contextInfo:{
    stanzaId:'audio123',participant:'6282222222222@s.whatsapp.net',quotedMessage:body
  }}}:body
});
test('media converter recognizes quoted content and rejects unsupported types',()=>{
  const audio=message({audioMessage:{fileLength:100}});
  assert.deepEqual(mediaKind(mediaTarget(audio)),['audio','mp3']);
  const video=message({videoMessage:{fileLength:100}},true);
  assert.deepEqual(mediaKind(mediaTarget(video)),['video','mp4']);
  assert.equal(mediaTarget(message({conversation:'hello'})),null);
  assert.throws(()=>encodeOptions('tomp3','sticker','in','out'),/needs audio/);
  assert.throws(()=>encodeOptions('tovideo','audio','in','out'),/static image/);
});
test('FFmpeg arguments contain bounded duration, use a fixed codec and no shell',()=>{
  const a=encodeOptions('tomp3','audio','safe.aac','safe.mp3');
  assert.deepEqual(a.slice(0,5),['-hide_banner','-loglevel','error','-nostdin','-y']);
  assert.ok(a.includes('30'));
  assert.ok(a.includes('libmp3lame'));
  const b=encodeOptions('tovn','audio','voice.ogg','voice.ogg');
  assert.ok(b.includes('libopus'));
  const c=encodeOptions('tovideo','sticker','sticker.webp','video.mp4');
  assert.ok(c.includes('libx264'));
  assert.ok(c.includes('3'));
  const d=encodeOptions('tosticker','video','video.mp4','sticker.webp');
  assert.ok(d.includes('libwebp_anim'));
  assert.ok(d.includes('5'));
});
test('download refuses oversized claims before invoking media downloader',async()=>{
  let called=false;
  await assert.rejects(boundedDownload({},message({audioMessage:{fileLength:14*1024*1024}}),{},
    async()=>{called=true;return Buffer.from('x');}),/12 MB/);
  assert.equal(called,false);
  await assert.rejects(boundedDownload({},message({audioMessage:{}}),{},
    async()=>Buffer.alloc(0)),/invalid/);
});
test('FFmpeg launcher uses shell:false and handles failure/success',async()=>{
  const calls=[];
  const spawnProcess=(_binary,args,options)=>{
    calls.push({args,options});
    const child=new EventEmitter();
    child.stderr=new EventEmitter();
    child.kill=()=>true;
    queueMicrotask(()=>child.emit('close',0));
    return child;
  };
  await runFfmpeg('/usr/bin/ffmpeg',['-test'],{spawnProcess,timeoutMs:300});
  assert.equal(calls[0].options.shell,false);
  await assert.rejects(runFfmpeg('invalid',['-i','x'],{
    spawnProcess:()=>{const c=new EventEmitter();c.stderr=new EventEmitter();c.kill=()=>true;
      queueMicrotask(()=>c.emit('error',new Error('ENOENT')));return c;},timeoutMs:300
  }),/not available/);
});
test('converter cleans local temp directory and returns mock output only',async()=>{
  let inputPath,outputPath,seenArgs;
  const msg=message({audioMessage:{fileLength:10}});
  const data=await transcode({
    command:'tomp3',media:{sock:{},message:msg},logger:{warn(){}},binary:'fake',
    download:async()=>Buffer.from('mock-media'),
    run:async(_binary,args)=>{
      seenArgs=args;inputPath=args[args.indexOf('-i')+1];outputPath=args.at(-1);
      assert.equal((await fs.readFile(inputPath)).toString(),'mock-media');
      await fs.writeFile(outputPath,Buffer.from('MOCK-MP3'));
    }
  });
  assert.equal(data.toString(),'MOCK-MP3');
  assert.ok(seenArgs.includes('libmp3lame'));
  assert.equal(await fs.stat(path.dirname(inputPath)).catch(()=>null),null);
});
test('converter routes mock output as WhatsApp audio without leaking files',async()=>{
  const sent=[];
  const ctx={cmd:{name:'toaudio'},sock:{sendMessage:async(c,b)=>sent.push(b)},
    message:message({audioMessage:{fileLength:20}}),chat:'6281111111111@s.whatsapp.net',
    logger:{warn(){}},lang:'en',reply:async x=>sent.push({text:x})};
  await handleTranscode(ctx,{binary:'test-binary',download:async()=>Buffer.from('audio-data'),
    run:async(_binary,args)=>fs.writeFile(args.at(-1),Buffer.from('fake-mp3'))});
  assert.equal(sent.at(-1).mimetype,'audio/mpeg');
  assert.equal(sent.at(-1).ptt,false);
  assert.ok(Buffer.isBuffer(sent.at(-1).audio));
});
