'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {MediaLibrary,handleLibrary}=require('../src/features/media-library');
const {loadConfig}=require('../src/config');
const {createRouter}=require('../src/commands');
const chat='12345678@g.us',admin='6281111111111@s.whatsapp.net';
const member='6282222222222@s.whatsapp.net';
async function fixture(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-saved-media-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const library=new MediaLibrary(path.join(dir,'saved-media'));
  await library.init();
  return{library,dir};
}
test('group library stores/retrieves binary data and persists safe metadata',async t=>{
  const h=await fixture(t);
  const image=Buffer.from('fake-image-content');
  assert.equal(await h.library.put(chat,'image','logo',image,'image/png'),true);
  assert.equal(await h.library.put(chat,'image','logo',image,'image/png'),false);
  assert.deepEqual((await h.library.fetch(chat,'image','logo')).data,image);
  assert.equal(h.library.entries(chat,'image').length,1);
  const restored=new MediaLibrary(path.join(h.dir,'saved-media'));
  await restored.init();
  assert.equal(restored.entries(chat,'image')[0].key,'logo');
  assert.equal((await restored.fetch(chat,'image','logo')).mime,'image/png');
  assert.equal(await h.library.remove(chat,'image','logo'),true);
  assert.equal(await h.library.fetch(chat,'image','logo'),null);
});
test('group library rejects malicious keys, oversized buffers and corrupt metadata',async t=>{
  const h=await fixture(t);
  await assert.rejects(h.library.put(chat,'image','../../evil',Buffer.from('x'),'image/jpeg'),/invalid/);
  await assert.rejects(h.library.put(chat,'video','video',Buffer.alloc(9*1024*1024),'video/mp4'),/invalid/);
  assert.throws(()=>h.library.folder('../../evil@g.us'),/group/);
  await fs.writeFile(path.join(h.dir,'saved-media','index.json'),'{broken');
  await assert.rejects(new MediaLibrary(path.join(h.dir,'saved-media')).init(),/risking data loss/);
});
test('media library limits each group category to 15 entries',async t=>{
  const h=await fixture(t);
  for(let i=0;i<15;i++)await h.library.put(chat,'sticker','s'+i,Buffer.from('abc'),'image/webp');
  await assert.rejects(h.library.put(chat,'sticker','extra',Buffer.from('abc'),'image/webp'),/15 saved/);
  assert.equal(h.library.entries(chat,'sticker').length,15);
});
test('group member cannot store media, but can read saved items',async t=>{
  const h=await fixture(t);
  const messages=[],image=Buffer.from('mock-img');
  const socket={
    user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,body)=>messages.push(body),
    groupMetadata:async()=>({subject:'Test Media',participants:[
      {id:admin,admin:'admin'},{id:member,admin:null},
      {id:'6289999999999@s.whatsapp.net',admin:'admin'}]})
  };
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {library:h.library,now:(()=>{let t=1;return()=>t+=2300;})()});
  const make=(sender,text)=>({key:{remoteJid:chat,participant:sender},
    message:{extendedTextMessage:{text,contextInfo:{
      stanzaId:'imga',participant:admin,quotedMessage:{imageMessage:{fileLength:image.length,mimetype:'image/jpeg'}}
    }}}});
  await router.handle(socket,make(member,'addimg avatar'));
  assert.equal(h.library.entries(chat,'image').length,0);
  assert.match(messages.at(-1).text,/admin/);
  // Use handler directly to inject a trusted fake download, avoiding real WhatsApp.
  await handleLibrary({
    cmd:{name:'addimg',args:['avatar']},group:true,chat,owner:true,
    roles:async()=>({senderAdmin:true}),library:h.library,sock:socket,
    message:make(admin,'addimg avatar'),reply:async x=>messages.push({text:x}),
    logger:{warn(){}},lang:'id'
  },async()=>image);
  assert.equal(h.library.entries(chat,'image').length,1);
  await router.handle(socket,make(member,'getimg avatar'));
  assert.deepEqual(messages.at(-1).image,image);
  await router.handle(socket,make(member,'delimg avatar'));
  assert.equal(h.library.entries(chat,'image').length,1);
  await router.handle(socket,make(admin,'delimg avatar'));
  assert.equal(h.library.entries(chat,'image').length,0);
});
