'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {handleUtility,urlCheck}=require('../src/features/developer-tools');
async function run(name,args){let out='';await handleUtility({cmd:{name,args},reply:async s=>out=s});return out;}
test('SHA256 known digest',async()=>assert.equal(await run('sha256',['abc']),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
test('base64 round trip',async()=>assert.equal(await run('base64dec',['aGFsbw==']),'halo'));
test('JSON pretty formatting',async()=>assert.match(await run('jsonfmt',['{"a":1}']),/"a": 1/));
test('URL safety heuristic never fetches URL',()=>assert.match(urlCheck('http://example.org'),/tidak terenkripsi/));
test('URL rejects dangerous scheme',()=>assert.throws(()=>urlCheck('file:///etc/passwd'),/HTTP/));
