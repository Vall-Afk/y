'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const http=require('node:http');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createDashboardHandler}=require('../src/dashboard');
const {OwnerPreferences}=require('../src/features/owner-automation');

function credentials(password='correct horse battery staple'){
  const salt=crypto.randomBytes(16).toString('hex');
  const hash=crypto.scryptSync(password,Buffer.from(salt,'hex'),64,{N:16384,r:8,p:1,maxmem:64*1024*1024}).toString('hex');
  return {password,passwordHash:'scrypt$'+salt+'$'+hash,sessionSecret:crypto.randomBytes(48).toString('base64url')};
}
async function fixture(options={}){
  const creds=credentials();
  const prefs={autoread:false,autobio:false,autorespond:false,anticall:false};
  const calls={reconnect:0,changes:[]};
  const handler=createDashboardHandler({
    ...creds,
    getStatus:async()=>({botName:'Beauté.',connected:true,uptimeSeconds:120,memory:{rssMb:80,heapMb:30,freeMb:1000},downloader:{success:4,failed:1,failures:0,lastAt:null,lastError:null},subbotStatus:'inactive',preferences:{...prefs}}),
    ownerPreferences:{get:()=>({...prefs}),set:async(key,value)=>{prefs[key]=value;}},
    reconnect:async()=>{calls.reconnect++;},
    onPreferenceChange:async(key,value)=>calls.changes.push([key,value]),
    ...options
  });
  const server=http.createServer(handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  async function request(path,method='GET',body,cookie){
    const headers={};
    if(method==='POST'){headers.origin=base;headers['sec-fetch-site']='same-origin';headers['content-type']='application/json';headers['cf-connecting-ip']='192.0.2.'+(server.address().port%254+1);}
    if(cookie)headers.cookie=cookie;
    return fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  }
  return {server,base,request,creds,prefs,calls,close:()=>new Promise(resolve=>server.close(resolve))};
}
function cookieFrom(response){
  const value=response.headers.get('set-cookie');
  assert.ok(value,'session cookie should be set');
  assert.match(value,/HttpOnly/);
  assert.match(value,/SameSite=Strict/);
  return value.split(';')[0];
}

test('dashboard root is a password gate with a French rose-window glass design',async()=>{
  const f=await fixture();
  try{
    const r=await f.request('/');
    const page=await r.text();
    assert.equal(r.status,200);
    assert.match(page,/Owner password/);
    assert.match(page,/rose-window/i);
    assert.match(page,/data:image\/svg\+xml/);
    assert.doesNotMatch(page,/WhatsApp: CONNECTED|80 MB/);
  }finally{await f.close();}
});

test('dashboard stays locked if password hash or session secret is missing',async()=>{
  const f=await fixture({passwordHash:'',sessionSecret:''});
  try{
    const r=await f.request('/');
    assert.equal(r.status,503);
    assert.match(await r.text(),/dashboard:setup/);
  }finally{await f.close();}
});

test('dashboard API denies unauthenticated status and preferences',async()=>{
  const f=await fixture();
  try{
    const status=await f.request('/api/status');
    assert.equal(status.status,401);
    const change=await f.request('/api/preferences','POST',{key:'autobio',enabled:true});
    assert.equal(change.status,401);
  }finally{await f.close();}
});

test('valid password creates an HttpOnly session and exposes only safe status data',async()=>{
  const f=await fixture();
  try{
    const login=await f.request('/api/login','POST',{password:f.creds.password});
    assert.equal(login.status,200);
    const cookie=cookieFrom(login);
    const r=await f.request('/api/status','GET',undefined,cookie);
    assert.equal(r.status,200);
    const data=await r.json();
    assert.equal(data.connected,true);
    assert.equal(data.memory.rssMb,80);
    assert.equal(data.downloader.success,4);
    assert.equal(data.preferences.autobio,false);
    assert.doesNotMatch(JSON.stringify(data),/password|secret|authDir|ownerJid|SAVEAPI_KEY/i);
  }finally{await f.close();}
});

test('authenticated owner can update allowlisted preferences and request reconnect',async()=>{
  const f=await fixture();
  try{
    const login=await f.request('/api/login','POST',{password:f.creds.password});
    const cookie=cookieFrom(login);
    const pref=await f.request('/api/preferences','POST',{key:'autobio',enabled:true},cookie);
    assert.equal(pref.status,200);
    assert.deepEqual(f.calls.changes,[['autobio',true]]);
    const bad=await f.request('/api/preferences','POST',{key:'ownerNumber',enabled:true},cookie);
    assert.equal(bad.status,400);
    const reconnect=await f.request('/api/reconnect','POST',{},cookie);
    assert.equal(reconnect.status,202);
    assert.equal(f.calls.reconnect,1);
  }finally{await f.close();}
});

test('logout invalidates session and clears cookie',async()=>{
  const f=await fixture();
  try{
    const login=await f.request('/api/login','POST',{password:f.creds.password});
    const cookie=cookieFrom(login);
    const logout=await f.request('/api/logout','POST',{},cookie);
    assert.equal(logout.status,200);
    assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
    const status=await f.request('/api/status','GET',undefined,cookie);
    assert.equal(status.status,401);
  }finally{await f.close();}
});

test('dashboard rejects cross-origin state-changing requests',async()=>{
  const f=await fixture();
  try{
    const r=await fetch(f.base+'/api/login',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:JSON.stringify({password:f.creds.password})});
    assert.equal(r.status,403);
  }finally{await f.close();}
});

test('login throttles repeated bad passwords',async()=>{
  const f=await fixture();
  try{
    let last;
    for(let i=0;i<5;i++)last=await f.request('/api/login','POST',{password:'wrong password'});
    assert.equal(last.status,401);
    const blocked=await f.request('/api/login','POST',{password:f.creds.password});
    assert.equal(blocked.status,429);
    assert.equal(blocked.headers.get('retry-after'),'900');
  }finally{await f.close();}
});

test('dashboard preference changes persist to disk and survive process restart',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-dashboard-prefs-'));
  const file=path.join(dir,'owner-automation.json');
  const ownerPreferences=new OwnerPreferences(file);
  await ownerPreferences.init();
  const f=await fixture({ownerPreferences});
  try{
    const login=await f.request('/api/login','POST',{password:f.creds.password});
    const cookie=cookieFrom(login);
    const pref=await f.request('/api/preferences','POST',{key:'autobio',enabled:true},cookie);
    assert.equal(pref.status,200);
    const saved=JSON.parse(await fs.readFile(file,'utf8'));
    assert.equal(saved.autobio,true);
    const restarted=new OwnerPreferences(file);
    await restarted.init();
    assert.equal(restarted.get().autobio,true);
    assert.equal(restarted.get().autoread,false);
  }finally{
    await f.close();
    await fs.rm(dir,{recursive:true,force:true});
  }
});
