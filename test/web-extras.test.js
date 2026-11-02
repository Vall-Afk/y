'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {handleWeb,parseFeed}=require('../src/features/web-extras');
async function run(name,args,data){let out='';const fetcher=async()=>({ok:true,text:async()=>JSON.stringify(data)});await handleWeb({cmd:{name,args},reply:async s=>out=s,fetcher});return out;}
test('BMKG latest quake displays magnitude',async()=>assert.match(await run('gempa',[],{Infogempa:{gempa:{Tanggal:'01 Nov',Jam:'10:00',Magnitude:'5.2',Wilayah:'Sumatera',Kedalaman:'10 km',Potensi:'Tidak tsunami'}}}),/5.2/));
test('npm package displays version',async()=>assert.match(await run('npm',['express'],{name:'express',version:'5.0.0',description:'web framework'}),/5.0.0/));
test('DNS record parsing',async()=>assert.match(await run('dns',['example.com'],{Answer:[{data:'93.184.215.14'}]}),/93.184.215.14/));
test('RSS title and link parsing',()=>assert.deepEqual(parseFeed('<rss><item><title>Berita</title><link>https://example.org/a</link></item></rss>'),['Berita\nhttps://example.org/a']));
