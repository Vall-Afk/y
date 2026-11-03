'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {ModerationStore,SpamDetector,runGroupSchedules,wibMinute} = require('../src/features/moderation');
const {loadConfig} = require('../src/config');
const {createRouter}=require('../src/commands');
const main='6287721373781@s.whatsapp.net', admin='6281111111111@s.whatsapp.net';
const member='6282222222222@s.whatsapp.net', target='6283333333333@s.whatsapp.net';
const chat='23232323@g.us';
async function harness(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-mod-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const moderation=new ModerationStore(path.join(dir,'moderation.json'));
  await moderation.init();
  const calls=[], actions=[];
  const sock={
    user:{id:'6289999999999@s.whatsapp.net'},
    groupMetadata:async()=>({subject:'Moderated',participants:[
      {id:admin,admin:'admin'},{id:member,admin:null},
      {id:target,admin:null},{id:'6289999999999@s.whatsapp.net',admin:'admin'}]}),
    groupSettingUpdate:async(...args)=>actions.push(args),
    sendMessage:async(_to,payload)=>calls.push(payload)
  };
  let time=10000000;
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {moderation,now:()=>time+=2200,spamDetector:new SpamDetector(()=>1000)});
  function msg(from,text,tag=null){
    return {key:{remoteJid:chat,participant:from,id:'m'+calls.length},
      message:{extendedTextMessage:{text,contextInfo:tag?{mentionedJid:[tag]}:{}}}};
  }
  return {moderation,calls,actions,sock,router,msg,dir};
}
test('moderation rules and custom replies persist safely',async t=>{
  const h=await harness(t);
  await h.moderation.setRules(chat,'Be nice, no spam.');
  await h.moderation.response(chat,'prices','Burgers from 20k.');
  await h.moderation.warn(chat,target,1);
  const reload=new ModerationStore(path.join(h.dir,'moderation.json'));
  await reload.init();
  assert.equal(reload.get(chat).warnings[target],1);
  assert.equal(reload.get(chat).responses.prices,'Burgers from 20k.');
  assert.equal(reload.get(chat).rules,'Be nice, no spam.');
  assert.throws(()=>h.moderation.response(chat,'invalid key','text'),/Key/);
  assert.throws(()=>h.moderation.setRules(chat,'x'.repeat(801)),/800/);
  await fs.writeFile(path.join(h.dir,'moderation.json'),'broken');
  await assert.rejects(new ModerationStore(path.join(h.dir,'moderation.json')).init(),/refusing overwrite/);
});
test('ordinary users can read rules and replies but cannot alter moderation config',async t=>{
  const h=await harness(t);
  await h.router.handle(h.sock,h.msg(member,'setrules secret'));
  assert.equal(h.moderation.get(chat).rules,'');
  assert.match(h.calls.at(-1).text,/admin/i);
  await h.router.handle(h.sock,h.msg(admin,'setrules Respect everyone.'));
  await h.router.handle(h.sock,h.msg(member,'rules'));
  assert.equal(h.calls.at(-1).text,'Respect everyone.');
  await h.router.handle(h.sock,h.msg(admin,'addresponse hours | 09:00-18:00'));
  await h.router.handle(h.sock,h.msg(member,'hours'));
  assert.equal(h.calls.at(-1).text,'09:00-18:00');
  await h.router.handle(h.sock,h.msg(member,'delresponse hours'));
  assert.equal(h.moderation.get(chat).responses.hours,'09:00-18:00');
  await h.router.handle(h.sock,h.msg(admin,'delresponse hours'));
  assert.deepEqual(h.moderation.get(chat).responses,{});
});
test('warnings require group admin, target mention, protect owner and persist',async t=>{
  const h=await harness(t);
  await h.router.handle(h.sock,h.msg(member,'warn @x',target));
  assert.equal(h.moderation.get(chat).warnings[target],undefined);
  await h.router.handle(h.sock,h.msg(admin,'warn @target',target));
  assert.equal(h.moderation.get(chat).warnings[target],1);
  await h.router.handle(h.sock,h.msg(member,'listwarn @target',target));
  assert.match(h.calls.at(-1).text,/1\/20/);
  await h.router.handle(h.sock,h.msg(admin,'unwarn @target',target));
  assert.equal(h.moderation.get(chat).warnings[target],undefined);
  await h.router.handle(h.sock,h.msg(admin,'warn @main',main));
  assert.equal(h.moderation.get(chat).warnings[main],undefined);
});
test('antispam is disabled by default and deletes only repeated non-admin posts when enabled',async t=>{
  const h=await harness(t);
  const time=(()=>{let now=1;return ()=>now+=100;})();
  const spamDetector=new SpamDetector(time);
  h.router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {moderation:h.moderation, now:(()=>{let x=1;return ()=>x+=2200;})(), spamDetector});
  for(let i=0;i<7;i++) await h.router.handle(h.sock,h.msg(member,'ordinary hello '+i));
  assert.equal(h.calls.filter(x=>x.delete).length,0);
  await h.router.handle(h.sock,h.msg(admin,'antispam on'));
  for(let i=0;i<6;i++) await h.router.handle(h.sock,h.msg(member,'ordinary hello '+i));
  assert.equal(h.calls.filter(x=>x.delete).length,1);
  for(let i=0;i<7;i++) await h.router.handle(h.sock,h.msg(admin,'ordinary hello '+i));
  assert.equal(h.calls.filter(x=>x.delete).length,1);
});
test('time scheduling runs once per day at WIB time and skips non-admin bot',async t=>{
  const h=await harness(t);
  assert.deepEqual(wibMinute(new Date('2026-11-01T01:30:00Z')),
    {day:'2026-11-01',time:'08:30'});
  await h.moderation.schedule(chat,'open','08:30');
  const count=await runGroupSchedules({moderation:h.moderation,socket:h.sock,
    now:()=>new Date('2026-11-01T01:30:10Z'),logger:{warn(){}}});
  assert.equal(count,1);
  assert.deepEqual(h.actions,[ [chat,'not_announcement'] ]);
  assert.equal(await runGroupSchedules({moderation:h.moderation,socket:h.sock,
    now:()=>new Date('2026-11-01T01:30:25Z')}),0);
  const noAdmin={...h.sock,groupMetadata:async()=>({participants:[]})};
  await h.moderation.schedule(chat,'close','09:00');
  assert.equal(await runGroupSchedules({moderation:h.moderation,socket:noAdmin,
    now:()=>new Date('2026-11-01T02:00:01Z')}),0);
});
test('schedule commands accept HH:MM and persist; no retroactive schedule execution',async t=>{
  const h=await harness(t);
  await h.router.handle(h.sock,h.msg(admin,'setclose 22:00'));
  assert.equal(h.moderation.get(chat).closeAt,'22:00');
  await h.router.handle(h.sock,h.msg(admin,'listschedule'));
  assert.match(h.calls.at(-1).text,/Close: 22:00/);
  await h.router.handle(h.sock,h.msg(admin,'changesetclose 24:00'));
  assert.equal(h.moderation.get(chat).closeAt,'22:00');
  await h.router.handle(h.sock,h.msg(admin,'delsetclose'));
  assert.equal(h.moderation.get(chat).closeAt,'');
  assert.equal(await runGroupSchedules({moderation:h.moderation,socket:h.sock,
    now:()=>new Date('2026-11-01T15:00:00Z')}),0);
});
