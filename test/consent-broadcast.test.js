'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {handleBroadcast}=require('../src/features/consent-broadcast');
async function run(name,chat,owner=false,args=[],sock={sendMessage:async()=>{}}){let text='';await handleBroadcast({cmd:{name,args},chat,owner,group:false,sock,reply:async s=>{text=s;}});return text;}
test('opt-in and opt-out control broadcasts',async()=>{const chat='628123456789@s.whatsapp.net';assert.match(await run('bcjoin',chat),/aktif/);assert.match(await run('bcstatus',chat),/berlangganan/);assert.match(await run('bcleave',chat),/Berhenti/);assert.match(await run('bcstatus',chat),/tidak berlangganan/);});
test('non-owner cannot broadcast',async()=>assert.match(await run('broadcast','628123456789@s.whatsapp.net',false,['hi']),/Hanya owner/));
test('unsafe legacy impersonation is not enabled',async()=>assert.match(await run('fitnah','628123456789@s.whatsapp.net'),/tidak diaktifkan/));
