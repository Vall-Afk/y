'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {AnonymousHub,phoneLink}=require('../src/features/anonymous');
const {loadConfig}=require('../src/config');
const {createRouter}=require('../src/commands');
const a='6281111111111@s.whatsapp.net',b='6282222222222@s.whatsapp.net',c='6283333333333@s.whatsapp.net';
test('anonymous user pairs without exposing numbers and can disconnect instantly',()=>{
  let time=2_000_000;
  const h=new AnonymousHub(()=>time);
  assert.equal(h.start(a).status,'waiting');
  assert.equal(h.start(b).status,'paired');
  assert.equal(h.partner(a),b);
  assert.equal(h.partner(b),a);
  assert.equal(h.stop(a).peer,b);
  assert.equal(h.partner(b),'');
});
test('anonymous session cannot expose contact without BOTH consents',()=>{
  const h=new AnonymousHub(()=>2_000_000);
  h.start(a);h.start(b);
  assert.equal(h.profile(a,a).status,'pending');
  assert.equal(h.profile(b,b).status,'mutual');
  assert.equal(h.profile(a,a).status,'pending','consent reset after exchange');
  assert.equal(phoneLink('12345@lid'),'');
  assert.equal(phoneLink(a),'https://wa.me/6281111111111');
  assert.equal(h.profile(c,c).status,'idle');
});
test('anonymous sessions expire, rate-limit relays and do not persist messages',()=>{
  let clock=5_000_000;
  const h=new AnonymousHub(()=>clock);
  h.start(a);h.start(b);
  assert.equal(h.allowMessage(a),true);
  clock+=100;
  assert.equal(h.allowMessage(a),false);
  clock+=2000;
  assert.equal(h.allowMessage(a),true);
  clock+=31*60*1000;
  assert.equal(h.partner(a),'');
  assert.equal(h.partner(b),'');
  assert.equal(h.waiting.size,0);
});
test('prefixless anonymous routing relays text only, and stop restores bot commands',async()=>{
  const sent=[];let clock=100000;
  const hub=new AnonymousHub(()=>clock);
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {anonymous:hub,now:()=>clock+=2400});
  const sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(chat,payload)=>sent.push({chat,payload})};
  const msg=(sender,text)=>({key:{remoteJid:sender},message:{conversation:text}});
  await router.handle(sock,msg(a,'start'));
  assert.match(sent.at(-1).payload.text,/Menunggu/);
  await router.handle(sock,msg(b,'start'));
  assert.equal(hub.partner(a),b);
  await router.handle(sock,msg(a,'halo anonim'));
  assert.equal(sent.at(-1).chat,b);
  assert.match(sent.at(-1).payload.text,/halo anonim/);
  await router.handle(sock,msg(a,'sendprofile'));
  assert.equal(hub.consent.has(a),true);
  assert.equal(hub.consent.has(b),false);
  await router.handle(sock,msg(b,'sendprofile'));
  assert.ok(sent.some(x=>x.chat===a&&x.payload.text?.includes('wa.me/')));
  await router.handle(sock,msg(a,'stop'));
  assert.equal(hub.partner(a),'');
  await router.handle(sock,msg(b,'ping'));
  assert.match(sent.at(-1).payload.text,/Pong/);
});
