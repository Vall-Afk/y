'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {handleHealth,recordDownload,report,state}=require('../src/features/bot-health');
test('bothealth requires owner in private chat',async()=>{
 let calls=[];
 const ctx={cmd:{name:'bothealth'},owner:false,group:false,reply:async s=>calls.push(s)};
 await handleHealth(ctx);
 assert.match(calls[0],/owner/);
 calls=[];
 await handleHealth({...ctx,owner:true,group:true,reply:async s=>calls.push(s)});
 assert.match(calls[0],/owner/);
});
test('bothealth reports runtime and downloader counts without API key',async()=>{
 const before=state.downloadOk;
 recordDownload(true);
 let result='';
 await handleHealth({cmd:{name:'bothealth'},owner:true,group:false,connected:()=>true,reply:async s=>{result=s;}});
 assert.match(result,/TERHUBUNG/);
 assert.match(result,/RAM RSS/);
 assert.match(result,/Downloader sukses/);
 assert.equal(state.downloadOk,before+1);
 assert.doesNotMatch(report(),/Bearer /);
});
