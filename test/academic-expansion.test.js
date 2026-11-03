'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {adventStart,easter,scriptureQuery,numeral}=require('../src/features/academic');
const {stats,regression}=require('../src/features/advanced-science');
test('Advent starts on Sunday between Nov 27 and Dec 3',()=>{for(let y=2020;y<=2040;y++){const d=adventStart(y);assert.equal(d.getUTCDay(),0);assert.ok(d.getUTCMonth()===10&&d.getUTCDate()>=27||d.getUTCMonth()===11&&d.getUTCDate()<=3);}});
test('Roman references and Bible book',()=>{assert.equal(numeral('XVI'),16);assert.deepEqual(scriptureQuery('Ioannes III:XVI'),{book:'Ioannes',chapter:3,verse:16});});
test('Easter 2027',()=>assert.equal(easter(2027).toISOString().slice(0,10),'2027-03-28'));
test('sample statistics and OLS',()=>{assert.equal(stats([1,2,3]).mean,2);const r=regression([[1,2],[2,4],[3,6]]);assert.equal(r.slope,2);assert.equal(r.r,1);});
