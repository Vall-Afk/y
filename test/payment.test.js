'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {ALL_COMMANDS}=require('../src/commands');
const {CAPTION,QRIS,paymentImage,sendPayment}=require('../src/features/payment');
test('paymethod command is registered with correct prices and merchant',()=>{assert.ok(ALL_COMMANDS.has('paymethod'));assert.match(CAPTION,/Rp10.000/);assert.match(CAPTION,/Rp30.000/);assert.match(CAPTION,/Vall, Pulsa & Internet/);assert.match(QRIS,/Vall, Pulsa & Internet/);});
test('payment poster renders and is sent as image with caption',async()=>{const image=await paymentImage();assert.ok(Buffer.isBuffer(image));assert.equal(image.subarray(1,4).toString(),'PNG');let sent;await sendPayment({chat:'123@s.whatsapp.net',message:{key:{id:'msg'}},sock:{sendMessage:async(...args)=>{sent=args;}}});assert.ok(Buffer.isBuffer(sent[1].image));assert.match(sent[1].caption,/Rp30.000/);});
