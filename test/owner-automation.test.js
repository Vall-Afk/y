'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {OwnerPreferences,rejectIncomingCalls,bioText}=require('../src/features/owner-automation');
const {createRouter}=require('../src/commands');
const {loadConfig}=require('../src/config');
const owner='6287721373781@s.whatsapp.net',user='6281111111111@s.whatsapp.net';
async function fixture(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-owner-settings-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'prefs.json'),prefs=new OwnerPreferences(file);
  await prefs.init();return{prefs,file};
}
test('owner automation is OFF by default and persisted fail-closed on corruption',async t=>{
  const {prefs,file}=await fixture(t);
  assert.deepEqual(prefs.get(),{autoread:false,autobio:false,autorespond:false,anticall:false});
  await prefs.set('autoread',true);
  const again=new OwnerPreferences(file);await again.init();
  assert.equal(again.get().autoread,true);
  assert.throws(()=>prefs.set('autoblok212',true),/Invalid/);
  await fs.writeFile(file,'{bad');
  await assert.rejects(new OwnerPreferences(file).init(),/refusing overwrite/);
});
test('main owner can configure automation only in DM; cannot enable country-code blocks',async t=>{
  const {prefs}=await fixture(t),sent=[],profile=[];
  const sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,body)=>sent.push(body),
    updateProfileStatus:async body=>profile.push(body)};
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781',BOT_NAME:'Beauté.'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {ownerPreferences:prefs,now:(()=>{let n=1;return()=>n+=2500;})()});
  const msg=(sender,command,inGroup=false)=>({key:inGroup?
    {remoteJid:'12345678@g.us',participant:sender}:{remoteJid:sender},
    message:{conversation:command}});
  await router.handle(sock,msg(user,'autoread on'));
  assert.equal(prefs.get().autoread,false);
  await router.handle(sock,msg(owner,'autoread on',true));
  assert.equal(prefs.get().autoread,false);
  await router.handle(sock,msg(owner,'autoread on'));
  assert.equal(prefs.get().autoread,true);
  await router.handle(sock,msg(owner,'autobio on'));
  assert.equal(profile.length,1);
  assert.match(profile[0],/Beauté/);
  await router.handle(sock,msg(owner,'autoblok212 on'));
  assert.match(sent.at(-1).text,/kode negara/);
  assert.equal(Object.hasOwn(prefs.get(),'autoblok212'),false);
});
test('auto-read and opt-in DM response are rate-limited and never reply in group',async t=>{
  const {prefs}=await fixture(t),sent=[],reads=[];
  await prefs.set('autoread',true);await prefs.set('autorespond',true);
  let time=1;
  const sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,body)=>sent.push(body),
    readMessages:async keys=>reads.push(keys)};
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {ownerPreferences:prefs,now:()=>time});
  const msg=(text,group=false)=>({key:group?
    {remoteJid:'12345678@g.us',participant:user}:{remoteJid:user},
    message:{conversation:text}});
  await router.handle(sock,msg('hello there'));
  assert.match(sent.at(-1).text,/menu/);
  await router.handle(sock,msg('hello again'));
  assert.equal(sent.length,1);
  time+=6*60*60*1000+1;
  await router.handle(sock,msg('another hello'));
  assert.equal(sent.length,2);
  await router.handle(sock,msg('hello group',true));
  assert.equal(sent.length,2);
  assert.equal(reads.length,4);
});
test('call rejection only happens when opted in and offered',async t=>{
  const {prefs}=await fixture(t),rejected=[];
  const sock={rejectCall:async(...args)=>rejected.push(args)};
  const calls=[{id:'call1',from:user,status:'offer'},{id:'call2',from:user,status:'accepted'}];
  assert.equal(await rejectIncomingCalls(sock,calls,prefs),0);
  await prefs.set('anticall',true);
  assert.equal(await rejectIncomingCalls(sock,calls,prefs),1);
  assert.deepEqual(rejected,[['call1',user]]);
});
test('setcmd/delcmd are group-admin exact-match aliases, not executable code',async()=>{
  const sent=[],responses={};const group='12345678@g.us',admin=user,member='6282222222222@s.whatsapp.net';
  const moderation={
    get:()=>({antispam:false,responses:{...responses}}),
    response:async(_chat,key,value)=>{if(value===null)delete responses[key];else responses[key]=value}
  };
  const sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,body)=>sent.push(body),
    groupMetadata:async()=>({participants:[
      {id:admin,admin:'admin'},{id:member,admin:null},
      {id:'6289999999999@s.whatsapp.net',admin:'admin'}]})};
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {moderation,now:(()=>{let n=1;return()=>n+=2000;})()});
  const msg=(sender,text)=>({key:{remoteJid:group,participant:sender},message:{conversation:text}});
  await router.handle(sock,msg(member,'setcmd hello | pwn'));
  assert.deepEqual(responses,{});
  await router.handle(sock,msg(admin,'setcmd ping | fake'));
  assert.deepEqual(responses,{});
  await router.handle(sock,msg(admin,'setcmd hello | Hai'));
  assert.equal(responses.hello,'Hai');
  await router.handle(sock,msg(member,'hello'));
  assert.equal(sent.at(-1).text,'Hai');
  await router.handle(sock,msg(admin,'delcmd hello'));
  assert.deepEqual(responses,{});
});
