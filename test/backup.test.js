'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {BackupService,FILES}=require('../src/features/backup');
const {createRouter}=require('../src/commands');
const {loadConfig}=require('../src/config');
const owner='6287721373781@s.whatsapp.net',other='6281111111111@s.whatsapp.net';
async function fixture(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-backup-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  await fs.mkdir(path.join(dir,'auth'),{recursive:true});
  await fs.mkdir(path.join(dir,'jadibot','auth'),{recursive:true});
  await fs.writeFile(path.join(dir,'auth','creds.json'),'{"supersecret":"do not leak"}');
  await fs.writeFile(path.join(dir,'jadibot','auth','creds.json'),'{"subsecret":"do not leak"}');
  await fs.writeFile(path.join(dir,'.env'),'API_KEY=HIDDEN');
  await fs.writeFile(path.join(dir,'settings.json'),'{"mode":"public","groups":{}}');
  await fs.writeFile(path.join(dir,'economy.json'),'{"users":{"628100@s.whatsapp.net":{"balance":123}}}');
  await fs.mkdir(path.join(dir,'jadibot'),{recursive:true});
  await fs.writeFile(path.join(dir,'jadibot','settings.json'),'{"mode":"public","groups":{}}');
  return {dir,backup:new BackupService(dir,()=>new Date('2026-11-01T12:00:00Z'))};
}
test('owner backup only reads fixed allowlisted JSON and excludes credentials and environment',async t=>{
  const h=await fixture(t);
  const {bytes,fileName}=await h.backup.snapshot();
  const text=bytes.toString('utf8');
  assert.equal(fileName,'beaute-backup-2026-11-01.json');
  assert.ok(text.includes('628100@s.whatsapp.net'));
  assert.ok(!text.includes('supersecret'));
  assert.ok(!text.includes('subsecret'));
  assert.ok(!text.includes('HIDDEN'));
  const json=JSON.parse(text);
  assert.equal(json.schemaVersion,1);
  assert.ok(Object.hasOwn(json.files,'settings'));
  assert.ok(Object.hasOwn(json.files,'jadibotSettings'));
  assert.equal(Object.values(FILES).some(x=>x.includes('auth')),false);
});
test('backup aborts on corrupt JSON and excessive data without overwriting files',async t=>{
  const h=await fixture(t);
  await fs.writeFile(path.join(h.dir,'moderation.json'),'{broken');
  await assert.rejects(h.backup.snapshot(),/corrupt JSON/);
  await fs.writeFile(path.join(h.dir,'moderation.json'),'{}');
  await fs.writeFile(path.join(h.dir,'rentals.json'),'x'.repeat(4*1024*1024));
  await assert.rejects(h.backup.snapshot(),/oversized/);
});
test('backup cannot be requested by regular users, group messages or Jadibot',async t=>{
  const h=await fixture(t),sent=[];
  const config=loadConfig({OWNER_NUMBER:'6287721373781'});
  const socket={user:{id:'6289999999999@s.whatsapp.net'},sendMessage:async(_c,body)=>sent.push(body)};
  const router=createRouter(config,{mode:'public',group:()=>({})},{warn(){}},
    {backup:h.backup,now:(()=>{let n=1;return()=>n+=2200;})()});
  const msg=(from,text,group)=>({
    key:group?{remoteJid:'12345678@g.us',participant:from}:{remoteJid:from},
    message:{conversation:text}
  });
  await router.handle(socket,msg(other,'backup',false));
  assert.match(sent.at(-1).text,/owner/);
  await router.handle(socket,msg(owner,'backup',true));
  assert.match(sent.at(-1).text,/owner/);
  await router.handle(socket,msg(owner,'backup',false));
  assert.equal(sent.at(-1).mimetype,'application/json');
  assert.ok(Buffer.isBuffer(sent.at(-1).document));
  const childRouter=createRouter(config,{mode:'public',group:()=>({})},{warn(){}},
    {now:(()=>{let n=1;return()=>n+=2200;})()});
  await childRouter.handle(socket,msg(owner,'backup',false));
  assert.match(sent.at(-1).text,/main bot/);
});
