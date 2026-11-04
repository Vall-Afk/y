'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {handleSaveAPI,extractBalance}=require('../src/features/saveapi-account');
test('reads balance from provider header without exposing credentials',()=>{
 assert.equal(extractBalance({remaining:'991',data:{}}),991);
 assert.equal(extractBalance({remaining:null,data:{credits_remaining:42.5}}),42.5);
});
test('blocks non-owners and group chats without making requests',async()=>{
 const replies=[];let calls=0;
 const query=async()=>{calls++;return {data:{credits:1}};};
 for(const ctx of [{owner:false,chat:'123@s.whatsapp.net'},{owner:true,chat:'123@g.us'}]){
  await handleSaveAPI({...ctx,cmd:{name:'saveapibalance'},reply:async s=>replies.push(s)},{query});
 }
 assert.equal(calls,0);assert.equal(replies.length,2);
});
test('reports owner balance and low credit warning',async()=>{
 const replies=[];
 await handleSaveAPI({owner:true,chat:'123@s.whatsapp.net',cmd:{name:'saveapibalance'},reply:async s=>replies.push(s)},{query:async()=>({remaining:'50',data:{}})});
 assert.match(replies[0],/50/);assert.match(replies[0],/PERINGATAN/);
});
test('usage only reports safe aggregate numbers',async()=>{
 const replies=[];
 await handleSaveAPI({owner:true,chat:'123@s.whatsapp.net',cmd:{name:'saveapiusage'},reply:async s=>replies.push(s)},{query:async()=>({remaining:'991',data:{total_requests:3,secret:'must-not-print'}})});
 assert.match(replies[0],/total_requests: 3/);assert.doesNotMatch(replies[0],/must-not-print/);
});
