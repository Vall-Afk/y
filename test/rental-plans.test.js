'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {RentalRegistry,rentalExpiry,expireRentals,PRICES}=require('../src/features/rental');
const start=Date.UTC(2026,10,2,1,51); // 2 Nov 08:51 WIB
test('month rental expires 2 Dec 00:00 WIB exactly',()=>{assert.equal(new Date(rentalExpiry(start,'bulan')).toISOString(),'2026-12-01T17:00:00.000Z');assert.equal(PRICES.bulan,30000);});
test('weekly rental expires 9 Nov 00:00 WIB',()=>{assert.equal(new Date(rentalExpiry(start,'minggu')).toISOString(),'2026-11-08T17:00:00.000Z');assert.equal(PRICES.minggu,10000);});
test('expired rental leaves group, clears state, and retries after failure',async t=>{let now=start;const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rental-plan-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const rentals=new RentalRegistry(path.join(dir,'rentals.json'),()=>now);await rentals.init();const id='12345678-12345678@g.us';await rentals.setPlan(id,'bulan');now=rentalExpiry(start,'bulan');let attempts=0;const socket={groupLeave:async target=>{assert.equal(target,id);if(++attempts===1)throw Error('offline');}};await expireRentals({rentals,socket});assert.equal(rentals.expired().length,1);await expireRentals({rentals,socket});assert.equal(rentals.expired().length,0);assert.equal(attempts,2);});
