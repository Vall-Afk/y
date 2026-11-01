'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {Economy}=require('../src/features/economy');
const {RpgService}=require('../src/features/rpg');
const {createRouter}=require('../src/commands');
const {loadConfig}=require('../src/config');
const user='6281111111111@s.whatsapp.net',group='12345678@g.us';
async function fixture(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-glimit-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  let now=Date.UTC(2026,10,1);
  const economy=new Economy(path.join(dir,'economy.json'),()=>now);
  await economy.init();
  return{economy,advance:ms=>{now+=ms},file:path.join(dir,'economy.json')};
}
test('group limit purchase charges virtual coins once and persists across restart',async t=>{
  const {economy,file}=await fixture(t);
  await economy.transact(db=>{db.users[user]={balance:600,dailyAt:0,quotaDay:'',used:0,extra:0,premiumUntil:0}});
  assert.equal(await economy.buyGroupLimit(user,group),true);
  assert.equal(economy.get(user).balance,350);
  assert.equal(economy.groupQuota(group),10);
  const again=new Economy(file,()=>Date.UTC(2026,10,1));
  await again.init();
  assert.equal(again.groupQuota(group),10);
  assert.equal(await again.buyGroupLimit(user,group),true);
  assert.equal(again.get(user).balance,100);
  assert.equal(await again.buyGroupLimit(user,group),false);
});
test('group bonus is used only after personal daily quota and resets daily',async t=>{
  const {economy,advance}=await fixture(t);
  await economy.transact(db=>{db.users[user]={balance:300,dailyAt:0,quotaDay:'',used:0,extra:0,premiumUntil:0}});
  await economy.buyGroupLimit(user,group);
  for(let i=0;i<20;i++)assert.equal(await economy.consume(user,group),true);
  assert.equal(economy.groupQuota(group),10);
  for(let i=0;i<10;i++)assert.equal(await economy.consume(user,group),true);
  assert.equal(economy.groupQuota(group),0);
  assert.equal(await economy.consume(user,group),false);
  advance(86400000);
  assert.equal(economy.groupQuota(group),10);
  assert.equal(await economy.consume(user,group),true);
  assert.equal(economy.groupQuota(group),10,'personal quota replenishes first');
});
test('legacy economy JSON without groups is migrated without resetting users',async t=>{
  const {file}=await fixture(t);
  await fs.writeFile(file,JSON.stringify({users:{[user]:{
    balance:100,dailyAt:0,quotaDay:'',used:0,extra:0,premiumUntil:0
  }}}));
  const restored=new Economy(file);await restored.init();
  assert.equal(restored.get(user).balance,100);
  assert.equal(restored.groupQuota(group),0);
});
test('RPG chemical item can be bought and sold with legacy alias',async t=>{
  const {economy}=await fixture(t);
  await economy.transact(db=>{db.users[user]={balance:1000,dailyAt:0,quotaDay:'',used:0,extra:0,premiumUntil:0}});
  const rpg=new RpgService(economy,()=>1);
  await rpg.join(user);
  assert.match(await rpg.trade(user,'buy','bahankimia',2),/Membeli 2 chemical/);
  assert.equal(rpg.snapshot(user).items.chemical,2);
  assert.match(await rpg.trade(user,'sell','chemical',1),/Menjual 1 chemical/);
  assert.equal(rpg.snapshot(user).items.chemical,1);
  const sent=[],sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,body)=>sent.push(body)};
  const router=createRouter(loadConfig({OWNER_NUMBER:'6287721373781'}),
    {mode:'public',group:()=>({})},{warn(){}},
    {economy,rpg,now:(()=>{let n=1;return()=>n+=2000;})()});
  await router.handle(sock,{key:{remoteJid:user},message:{conversation:'jualbahankimia 1'}});
  assert.equal(rpg.snapshot(user).items.chemical,0);
  assert.match(sent.at(-1).text,/chemical/);
});
