'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {loadConfig}=require('../src/config');
const {createRouter}=require('../src/commands');
const {boundedFetch}=require('../src/features/network');
const number='6281111111111@s.whatsapp.net';
function setup(env={}){
  const config=loadConfig({OWNER_NUMBER:'6287721373781',...env});
  const calls=[],urls=[];
  const payloads={
    translation:{responseData:{translatedText:'Hello world'}},
    lyrics:[{id:100,trackName:'Example Song',artistName:'Some Artist'}],
    youtube:{items:[{id:{videoId:'abcdefghijk'},snippet:{
      title:'Helpful tutorial',channelTitle:'Official Channel'
    }}]}
  };
  const mockFetch=async url=>{
    urls.push(url);
    const u=new URL(url);
    const data=u.hostname==='api.mymemory.translated.net'?payloads.translation:
      u.hostname==='lrclib.net'?payloads.lyrics:payloads.youtube;
    return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
  };
  let clock=10000;
  const router=createRouter(config,{mode:'public',group:()=>({})},{warn(){}},
    {fetcher:mockFetch,now:()=>clock+=2200});
  const sock={user:{id:'6289999999999@s.whatsapp.net'},
    sendMessage:async(_to,payload)=>calls.push(payload)};
  return{calls,urls,sock,router,
    msg:text=>({key:{remoteJid:number},message:{conversation:text}})};
}
test('translation uses fixed approved host and explicit ID->EN language pair',async()=>{
  const h=setup();
  await h.router.handle(h.sock,h.msg('translate en Halo dunia'));
  assert.match(h.urls[0],/^https:\/\/api\.mymemory\.translated\.net\/get\?/);
  assert.match(h.urls[0],/langpair=id%7Cen/);
  assert.match(h.calls.at(-1).text,/Hello world/);
});
test('lyrics command links source rather than reproducing copyrighted lyrics',async()=>{
  const h=setup();
  await h.router.handle(h.sock,h.msg('lirik example song'));
  assert.match(h.urls[0],/^https:\/\/lrclib\.net\/api\/search/);
  assert.match(h.calls.at(-1).text,/lrclib\.net\/api\/get\/100/);
  assert.doesNotMatch(h.calls.at(-1).text,/full lyrics/i);
});
test('YouTube metadata search refuses missing owner key without API request',async()=>{
  const h=setup();
  await h.router.handle(h.sock,h.msg('ytsearch a video'));
  assert.equal(h.urls.length,0);
  assert.match(h.calls.at(-1).text,/YOUTUBE_API_KEY/);
});
test('YouTube metadata search uses official API and returns safe video link',async()=>{
  const h=setup({YOUTUBE_API_KEY:'THIS_IS_A_TEST_KEY_NOT_REAL'});
  await h.router.handle(h.sock,h.msg('ytsearch helpful tutorial'));
  assert.match(h.urls[0],/^https:\/\/www\.googleapis\.com\/youtube\/v3\/search/);
  assert.match(h.calls.at(-1).text,/https:\/\/youtu\.be\/abcdefghijk/);
  await h.router.handle(h.sock,h.msg('play helpful tutorial'));
  assert.match(h.calls.at(-1).text,/tidak mengunduh media/);
});
test('bounded fetching still denies private URLs and untrusted origins',async()=>{
  await assert.rejects(boundedFetch('http://127.0.0.1/healthz'),/diizinkan/);
  await assert.rejects(boundedFetch('https://evil.com/metadata'),/diizinkan/);
});
