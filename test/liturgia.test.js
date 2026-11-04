'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {feasts,calculate,parseDate,handleLiturgia}=require('../src/features/liturgia');
test('2026 movable feasts and distinct Christ the King dates',()=>{
 const f=feasts(2026);
 assert.equal(f.easter.toISOString().slice(0,10),'2026-04-05');
 assert.equal(f.ash.toISOString().slice(0,10),'2026-02-18');
 assert.equal(f.pentecost.toISOString().slice(0,10),'2026-05-24');
 assert.equal(f.advent.toISOString().slice(0,10),'2026-11-29');
 assert.equal(f.christModern.toISOString().slice(0,10),'2026-11-22');
 assert.equal(f.christ1962.toISOString().slice(0,10),'2026-10-25');
});
test('three languages and both calendar systems',()=>{
 assert.match(calculate(parseDate('2026-11-22'),'modern','la').name,/Universorum Regis/);
 assert.match(calculate(parseDate('2026-10-25'),'1962','en').name,/Christ the King/);
 assert.match(calculate(parseDate('2026-10-25'),'1962','id').name,/Kristus Raja/);
});
test('invalid date rejected',()=>assert.throws(()=>parseDate('2026-02-30'),/valid/));
test('comparison returns both calendars',async()=>{
 let response='';
 await handleLiturgia({cmd:{name:'liturgi',args:['bandingkan','2026-10-25','latin']},reply:async s=>{response=s;}});
 assert.match(response,/1962/);assert.match(response,/modern/);
});
