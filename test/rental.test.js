'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {RentalRegistry}=require('../src/features/rental');
const {createRouter}=require('../src/commands');
const {loadConfig}=require('../src/config');
const group='12345678-12345678@g.us';
const owner='6287721373781@s.whatsapp.net',member='6281111111111@s.whatsapp.net';
async function fixture(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-sewa-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  let now=Date.UTC(2026,10,1);
  const rentals=new RentalRegistry(path.join(dir,'rentals.json'),()=>now);
  await rentals.init();
  return {rentals,dir,advance:ms=>{now+=ms}};
}
test('manual rental registry extends expiration atomically and survives restart',async t=>{
  const h=await fixture(t);
  assert.equal(h.rentals.get(group).active,false);
  const updates=await Promise.all([h.rentals.change(group,10),h.rentals.change(group,5)]);
  assert.equal(h.rentals.get(group).active,true);
  assert.equal(h.rentals.list().length,1);
  assert.equal(h.rentals.get(group).until,Date.UTC(2026,10,16));
  const loaded=new RentalRegistry(path.join(h.dir,'rentals.json'),()=>Date.UTC(2026,10,1));
  await loaded.init();
  assert.equal(loaded.get(group).until,Date.UTC(2026,10,16));
  h.advance(16*86400000);
  assert.equal(h.rentals.get(group).active,false);
  await h.rentals.change(group,0);
  assert.equal(h.rentals.list().length,0);
});
test('rental registry rejects invalid JIDs, days and corrupt JSON',async t=>{
  const h=await fixture(t);
  assert.throws(()=>h.rentals.change('bad',5),/Invalid/);
  assert.throws(()=>h.rentals.change(group,-1),/1–365/);
  await fs.writeFile(path.join(h.dir,'rentals.json'),'{oops');
  await assert.rejects(new RentalRegistry(path.join(h.dir,'rentals.json')).init(),/not overwritten/);
});
test('optional rent enforcement does not affect private chat, owner or status lookup',async t=>{
  const h=await fixture(t);
  const config=loadConfig({OWNER_NUMBER:'6287721373781',REQUIRE_SEWA:'true'});
  const calls=[],sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,payload)=>calls.push(payload)};
  const router=createRouter(config,{mode:'public',group:()=>({})},{warn(){}},
    {rentals:h.rentals,now:(()=>{let v=100;return()=>v+=2500;})()});
  const message=(sender,command,inGroup)=>({
    key:inGroup?{remoteJid:group,participant:sender}:{remoteJid:sender},
    message:{conversation:command}
  });
  await router.handle(sock,message(member,'ping',true));
  assert.match(calls.at(-1).text,/Sewa grup belum aktif/);
  await router.handle(sock,message(member,'checksewa',true));
  assert.match(calls.at(-1).text,/tidak terdaftar/);
  await router.handle(sock,message(owner,'ping',true));
  assert.match(calls.at(-1).text,/Pong!/);
  await router.handle(sock,message(member,'ping',false));
  assert.match(calls.at(-1).text,/Pong!/);
  await h.rentals.change(group,1);
  await router.handle(sock,message(member,'ping',true));
  assert.match(calls.at(-1).text,/Pong!/);
});
test('only main owner can grant rental via prefixless commands',async t=>{
  const h=await fixture(t);
  const config=loadConfig({OWNER_NUMBER:'6287721373781'});
  const calls=[],sock={user:{id:'6289999999999@s.whatsapp.net'},sendMessage:async(_to,payload)=>calls.push(payload)};
  const router=createRouter(config,{mode:'public',group:()=>({})},{warn(){}},
    {rentals:h.rentals,now:(()=>{let v=100;return()=>v+=2500;})()});
  const message=(sender,command)=>({key:{remoteJid:sender},message:{conversation:command}});
  await router.handle(sock,message(member,'addsewa '+group+' 30'));
  assert.equal(h.rentals.get(group).active,false);
  await router.handle(sock,message(owner,'addsewa '+group+' 30'));
  assert.equal(h.rentals.get(group).active,true);
  await router.handle(sock,message(owner,'listsewa'));
  assert.match(calls.at(-1).text,/12345678/);
  await router.handle(sock,message(owner,'delsewa '+group));
  assert.equal(h.rentals.get(group).active,false);
});
