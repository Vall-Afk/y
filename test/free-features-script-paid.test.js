'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {SubBotManager}=require('../src/subbot');const {tr}=require('../src/i18n');
test('jadibot eligibility does not require premium',()=>{const manager=Object.create(SubBotManager.prototype);manager.config={ownerJid:'628111111111@s.whatsapp.net'};manager.economy={get:()=>({premium:false,premiumUntil:0})};assert.equal(manager.eligible('628222222222@s.whatsapp.net'),true);assert.equal(manager.expiry('628222222222@s.whatsapp.net'),Infinity);});
test('script prompts show owner purchase instruction without source URL',()=>{for(const lang of ['id','en']){const message=tr(lang,'scriptLink');assert.match(message,/owner/);assert.doesNotMatch(message,/github\.com|https?:\/\//);}});
