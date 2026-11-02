'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {handleStudy}=require('../src/features/study-tools');
async function run(name,args){let out='';await handleStudy({cmd:{name,args},reply:async x=>{out=x;}});return out;}
test('zscore is standardized',async()=>assert.match(await run('zscore',['75','60','10']),/Z = 1.5/));
test('confidence interval normal approximation',async()=>assert.match(await run('ci95',['100','10','100']),/98.04, 101.96/));
test('Sharpe excess return',async()=>assert.match(await run('sharpe',['0.12','0.04','0.2']),/0.4/));
test('bond with zero coupon has Macaulay duration equal maturity',async()=>assert.match(await run('obligasi',['100','0','0.1','5']),/5 tahun/));
test('quiz displays educational answer',async()=>assert.match(await run('kuisstat',['1']),/p-value/));
