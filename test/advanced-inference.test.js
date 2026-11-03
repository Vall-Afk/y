'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {handleStats}=require('../src/features/advanced-inference');
async function run(name,args){let out='';await handleStats({cmd:{name,args},reply:async s=>out=s});return out;}
test('Bayes posterior',async()=>assert.match(await run('bayes',['0.5','0.8','0.2']),/0.8/));
test('covariance of aligned vectors',async()=>assert.match(await run('covariance',['1,2,3','|','2,4,6']),/= 2/));
test('t test outputs degrees of freedom',async()=>assert.match(await run('ujit',['2,3,4,5','|','3']),/df=3/));
test('chi square statistic',async()=>assert.match(await run('chisquare',['10,20','|','10,20']),/= 0.000000/));
