'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {COMMANDS,handle,card,factCheckGuidance,rate}=require('../src/features/engagement-ai');
test('all requested engagement commands are registered',()=>{for(const n of ['roast','puji','cekhoax','tarot','ramalan','zodiak','tanyavoice','simpulkan','drama','stikermeme','antitoxic','report','menfess'])assert.ok(COMMANDS.has(n),n);});
test('tarot selection is deterministic per seed',()=>assert.equal(card('same'),card('same')));
test('fact check does not invent verdict',()=>assert.match(factCheckGuidance('Sebuah klaim tanpa sumber'),/BELUM TERVERIFIKASI/));
test('roast does not target a third party without consent',async()=>{let result='';await handle({cmd:{name:'roast',args:['@user']},accountSender:'x',reply:async s=>{result=s;}});assert.match(result,/persetujuan/);});
test('menfess never sends unsolicited direct message',async()=>{let result='',sent=0;await handle({cmd:{name:'menfess',args:['628123456789','|','pesan']},accountSender:'x',sock:{sendMessage:async()=>sent++},reply:async s=>{result=s;}});assert.equal(sent,0);assert.match(result,/belum mengirim/);});
test('report does not publish unreviewed issue',async()=>{let result='';await handle({cmd:{name:'report',args:['Downloader','Instagram','gagal','saat','menerima','reel']},accountSender:'test-report',reply:async s=>{result=s;}});assert.match(result,/belum dikirim/);});
test('rate limiting blocks repeated calls',()=>{assert.equal(rate('unit-test',100,1000),true);assert.equal(rate('unit-test',100,1050),false);assert.equal(rate('unit-test',100,1100),true);});

test('group history is opt-in, bounded, and erasable',()=>{
 const {observeGroup,groupOptIn,groupHistory}=require('../src/features/engagement-ai');
 const chat='summary-test@g.us';observeGroup(chat,'x','before consent');assert.equal(groupHistory.has(chat),false);
 groupOptIn.add(chat);for(let i=0;i<105;i++)observeGroup(chat,'x','message '+i);
 assert.equal(groupHistory.get(chat).length,100);groupOptIn.delete(chat);groupHistory.delete(chat);
});
test('stikermeme generates an actual WhatsApp sticker via local renderer',async()=>{
 let sent=null;
 await handle({cmd:{name:'stikermeme',args:['Halo','Beauté']},chat:'a@s.whatsapp.net',message:{key:{id:'a'}},sock:{sendMessage:async(_chat,body)=>{sent=body;}},reply:async()=>{}});
 assert.ok(Buffer.isBuffer(sent.sticker));assert.ok(sent.sticker.length>0);
});
test('fact-check search displays sources but does not assert verdict',async()=>{
 const oldKey=process.env.GOOGLE_CSE_API_KEY,oldId=process.env.GOOGLE_CSE_ID;
 process.env.GOOGLE_CSE_API_KEY='test';process.env.GOOGLE_CSE_ID='test';
 try{let reply='';await handle({cmd:{name:'cekhoax',args:['Klaim','ini','butuh','pemeriksaan']},reply:async s=>{reply=s;},fetcher:async()=>({ok:true,json:async()=>({items:[{title:'Official source',link:'https://example.org/facts'}]})})});assert.match(reply,/BELUM TERVERIFIKASI/);assert.match(reply,/example.org/);}finally{if(oldKey===undefined)delete process.env.GOOGLE_CSE_API_KEY;else process.env.GOOGLE_CSE_API_KEY=oldKey;if(oldId===undefined)delete process.env.GOOGLE_CSE_ID;else process.env.GOOGLE_CSE_ID=oldId;}
});
