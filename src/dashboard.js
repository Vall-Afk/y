'use strict';
const crypto=require('node:crypto');
const SESSION_COOKIE='beaute_dashboard';
const SESSION_TTL=8*60*60*1000;
const LOGIN_WINDOW=15*60*1000;
const LOGIN_MAX=5;
const sessions=new Map();
const loginAttempts=new Map();
const PREF_KEYS=new Set(['autoread','autobio','autorespond','anticall']);
const SAFE_HEADERS={
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'X-Frame-Options':'DENY',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};
function send(res,status,body,type='application/json; charset=utf-8',extra={}){
  res.writeHead(status,{...SAFE_HEADERS,'Content-Type':type,...extra});
  res.end(body);
}
function json(res,status,value,extra){send(res,status,JSON.stringify(value), 'application/json; charset=utf-8',extra);}
function parseCookies(header=''){
  const out={};
  for(const part of header.split(';')){
    const i=part.indexOf('=');
    if(i<1)continue;
    const key=part.slice(0,i).trim();
    try{out[key]=decodeURIComponent(part.slice(i+1).trim());}catch{}
  }
  return out;
}
function parsePasswordHash(value){
  const m=/^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(String(value||''));
  return m?{salt:m[1],hash:m[2]}:null;
}
function derive(password,salt){
  return new Promise((resolve,reject)=>crypto.scrypt(password,Buffer.from(salt,'hex'),64,{N:16384,r:8,p:1,maxmem:64*1024*1024},(err,key)=>err?reject(err):resolve(key)));
}
async function verifyPassword(password,encoded){
  const parsed=parsePasswordHash(encoded);
  if(!parsed||typeof password!=='string'||Buffer.byteLength(password,'utf8')>256)return false;
  try{
    const actual=await derive(password,parsed.salt);
    return crypto.timingSafeEqual(actual,Buffer.from(parsed.hash,'hex'));
  }catch{return false;}
}
function sameOrigin(req){
  const origin=req.headers.origin;
  if(typeof origin!=='string')return false;
  try{
    const parsed=new URL(origin);
    const expected=String(req.headers['x-forwarded-host']||req.headers.host||'').toLowerCase();
    if(!expected||parsed.host.toLowerCase()!==expected)return false;
    if(parsed.protocol!=='https:'&&parsed.protocol!=='http:')return false;
    const site=req.headers['sec-fetch-site'];
    return !site||site==='same-origin'||site==='none';
  }catch{return false;}
}
function requestIp(req){
  const forwarded=String(req.headers['cf-connecting-ip']||'').trim();
  return forwarded&&forwarded.length<80?forwarded:(req.socket.remoteAddress||'unknown');
}
function readJson(req,max=4096){
  return new Promise((resolve,reject)=>{
    let body='',size=0,done=false;
    req.on('data',chunk=>{
      size+=chunk.length;
      if(size>max&&!done){done=true;reject(Object.assign(new Error('Request too large.'),{status:413}));req.destroy();return;}
      if(!done)body+=chunk.toString('utf8');
    });
    req.on('end',()=>{
      if(done)return;
      try{resolve(body?JSON.parse(body):{});}catch{reject(Object.assign(new Error('Invalid JSON.'),{status:400}));}
    });
    req.on('error',err=>{if(!done)reject(err);});
  });
}
function makeSessionCookie(req,token){
  const secure=req.socket.encrypted||String(req.headers['x-forwarded-proto']||'').split(',')[0].trim()==='https'||String(req.headers['cf-visitor']||'').includes('"scheme":"https"');
  return SESSION_COOKIE+'='+encodeURIComponent(token)+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+
    Math.floor(SESSION_TTL/1000)+(secure?'; Secure':'');
}
function clearSessionCookie(req){
  const secure=req.socket.encrypted||String(req.headers['x-forwarded-proto']||'').split(',')[0].trim()==='https'||String(req.headers['cf-visitor']||'').includes('"scheme":"https"');
  return SESSION_COOKIE+'=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+(secure?'; Secure':'');
}
function getSession(req){
  const token=parseCookies(req.headers.cookie||'')[SESSION_COOKIE];
  if(!token)return null;
  const session=sessions.get(token);
  if(!session)return null;
  if(Date.now()>session.expires){sessions.delete(token);return null;}
  session.expires=Date.now()+SESSION_TTL;
  return {token,session};
}
function roseBackground(){
  const parts=[];
  const cx=240,cy=240,r=206;
  parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480"><defs>');
  parts.push('<radialGradient id="g"><stop stop-color="#f7d9a2" stop-opacity=".8"/><stop offset=".25" stop-color="#8c365e"/><stop offset=".58" stop-color="#253f83"/><stop offset=".82" stop-color="#176c69"/><stop offset="1" stop-color="#140f28"/></radialGradient>');
  parts.push('<linearGradient id="gold" x2="1" y2="1"><stop stop-color="#f8dfa2"/><stop offset=".5" stop-color="#b88b48"/><stop offset="1" stop-color="#f5d99b"/></linearGradient>');
  parts.push('<clipPath id="clip"><circle cx="240" cy="240" r="198"/></clipPath></defs>');
  parts.push('<circle cx="240" cy="240" r="224" fill="#120e20" stroke="url(#gold)" stroke-width="8"/><circle cx="240" cy="240" r="210" fill="none" stroke="#e6c77e" stroke-width="3"/>');
  parts.push('<g clip-path="url(#clip)">');
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12;
    const x1=cx+Math.cos(a)*18,y1=cy+Math.sin(a)*18;
    const x2=cx+Math.cos(a)*198,y2=cy+Math.sin(a)*198;
    parts.push('<path d="M240 240 L'+x2.toFixed(1)+' '+y2.toFixed(1)+' L'+(cx+Math.cos(a+.12)*198).toFixed(1)+' '+(cy+Math.sin(a+.12)*198).toFixed(1)+' Z" fill="'+(['#8f244f','#173f7c','#15736b','#b15b34'][i%4])+'" fill-opacity=".68" stroke="#e4c47a" stroke-width="2"/>');
    parts.push('<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' Q'+(cx+Math.cos(a+.1)*118).toFixed(1)+' '+(cy+Math.sin(a+.1)*118).toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1)+'" fill="none" stroke="#f2d795" stroke-opacity=".8" stroke-width="2"/>');
  }
  for(let ring=0;ring<3;ring++){
    const rr=62+ring*47;
    parts.push('<circle cx="240" cy="240" r="'+rr+'" fill="none" stroke="#e8c77d" stroke-width="3"/>');
  }
  parts.push('<circle cx="240" cy="240" r="50" fill="url(#g)" stroke="#f1d18a" stroke-width="5"/><circle cx="240" cy="240" r="22" fill="#f5d79a" fill-opacity=".7"/>');
  parts.push('</g><circle cx="240" cy="240" r="198" fill="none" stroke="#f4d48d" stroke-width="5"/></svg>');
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(parts.join(''));
}
function renderDashboardPage(){
  const rose=roseBackground();
  return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#171326"><title>Beauté · Control Atelier</title><style>'+
  ':root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;background:#100d1b;color:#f8f3ed}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 50% 0,#38243c 0,transparent 55%),linear-gradient(135deg,#100d1b,#17152a 60%,#0b1422);overflow-x:hidden}body:before{content:"";position:fixed;inset:-12%;background-image:url("'+rose+'");background-repeat:no-repeat;background-position:85% 45%;background-size:min(82vw,820px);opacity:.17;filter:saturate(1.2);pointer-events:none}body:after{content:"";position:fixed;inset:0;background:linear-gradient(110deg,rgba(11,9,20,.93),rgba(14,12,27,.72) 48%,rgba(10,18,31,.82));pointer-events:none}.shell{position:relative;z-index:1;min-height:100vh;padding:clamp(18px,4vw,42px);display:grid;place-items:center}.glass{width:min(100%,980px);border:1px solid rgba(235,210,160,.28);background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.035));backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 30px 100px #05040caa,inset 0 1px rgba(255,255,255,.12);border-radius:28px;padding:clamp(22px,4vw,42px)}.login{max-width:470px}.brand{display:flex;align-items:center;gap:14px;margin-bottom:26px}.seal{width:54px;height:54px;border-radius:18px;display:grid;place-items:center;border:1px solid #e7c67d88;background:radial-gradient(circle,#8d3157,#172e5e 65%,#101729);font-size:25px;color:#ffe5a8;box-shadow:0 0 30px #b77c7b44}.brand strong{font-size:24px;letter-spacing:-.05em}.brand small{display:block;color:#d8c8ad;font-size:10px;letter-spacing:.2em;text-transform:uppercase;margin-top:4px}.eyebrow{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#e1c48c}.title{font-size:clamp(28px,5vw,43px);letter-spacing:-.05em;line-height:1.05;margin:10px 0 12px}.muted{color:#c8bdc8;line-height:1.65;font-size:13px}.field{display:grid;gap:8px;margin:24px 0 12px}.field label{font-size:11px;color:#e4d4bd;letter-spacing:.1em;text-transform:uppercase}.field input{width:100%;border:1px solid #d5bd9a55;border-radius:14px;background:#100d1bcc;color:#fff;padding:15px 16px;font-size:16px;outline:none}.field input:focus{border-color:#e8ca8b;box-shadow:0 0 0 3px #e8ca8b22}.btn{border:1px solid #e5c27d88;border-radius:13px;padding:12px 16px;background:linear-gradient(135deg,#8d3459,#344b7c);color:#fff;font-weight:700;cursor:pointer}.btn.secondary{background:#ffffff0c;border-color:#ffffff24}.btn.danger{background:#6d2938;border-color:#d98c8c66}.btn:disabled{opacity:.55;cursor:wait}.error{min-height:20px;color:#ffb5ae;font-size:12px;margin-top:10px}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:13px;margin:26px 0}.card{border:1px solid #e8d2a22b;background:linear-gradient(145deg,#ffffff12,#ffffff05);border-radius:18px;padding:17px;min-height:105px}.card small{display:block;color:#d0c2ae;font-size:10px;letter-spacing:.15em;text-transform:uppercase}.card strong{display:block;font-size:22px;margin-top:13px;overflow-wrap:anywhere}.section{margin-top:28px;border-top:1px solid #e8d2a233;padding-top:22px}.section h2{font-size:16px;margin:0 0 7px}.toggle{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:13px 0;border-bottom:1px solid #ffffff14}.toggle span{font-size:13px}.toggle input{accent-color:#d8ad68;width:19px;height:19px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.foot{margin-top:25px;color:#b8aeb9;font-size:10px;line-height:1.6}.hidden{display:none!important}@media(max-width:520px){.glass{border-radius:22px}.top .btn{width:100%}}'+
  '</style></head><body><main class="shell"><section id="login" class="glass login"><div class="brand"><div class="seal">✦</div><div><strong>Beauté.</strong><small>Control Atelier · Notre-Dame glass</small></div></div><div class="eyebrow">Private administration</div><h1 class="title">A quiet place to command.</h1><p class="muted">Dashboard ini dilindungi kata sandi. Hanya pemegang kredensial owner yang dapat melihat status internal dan mengubah pengaturan bot.</p><form id="loginForm"><div class="field"><label for="password">Owner password</label><input id="password" name="password" type="password" minlength="1" maxlength="256" autocomplete="current-password" required></div><button class="btn" id="loginButton" type="submit">Unlock dashboard</button><div class="error" id="loginError" role="alert"></div></form><div class="foot">Rose-window inspired stained glass · Paris / Lyon Gothic palette<br>Session expires after 8 hours of inactivity.</div></section>'+
  '<section id="dashboard" class="glass hidden"><div class="top"><div><div class="brand"><div class="seal">✦</div><div><strong>Beauté.</strong><small>Owner Control Atelier</small></div></div><div class="eyebrow">Live operations</div><h1 class="title">Welcome back, Vall.</h1><p class="muted">Private control surface · Updates on demand.</p></div><button class="btn secondary" id="logoutButton">Lock session</button></div>'+
  '<div class="grid"><div class="card"><small>WhatsApp connection</small><strong id="wa">—</strong></div><div class="card"><small>Process uptime</small><strong id="uptime">—</strong></div><div class="card"><small>RAM RSS</small><strong id="ram">—</strong></div><div class="card"><small>Downloader success / failed</small><strong id="downloads">—</strong></div><div class="card"><small>System free RAM</small><strong id="freeRam">—</strong></div><div class="card"><small>Jadibot</small><strong id="subbot">—</strong></div></div>'+
  '<div class="section"><h2>Owner automations</h2><p class="muted">Pengaturan ini tersimpan di data lokal Beauté. Perubahan tertentu berlaku saat WhatsApp terhubung.</p><div id="preferences"></div></div>'+
  '<div class="section"><h2>Operations</h2><p class="muted" id="lastDownload">Downloader: belum ada aktivitas.</p><div class="actions"><button class="btn" id="refreshButton">Refresh status</button><button class="btn secondary" id="reconnectButton">Reconnect WhatsApp</button></div><div class="error" id="actionMessage" role="status"></div></div>'+
  '<div class="foot">Authenticated owner session · No QR, session files, API keys, or raw credentials are exposed here.<br>Public visitors can see only this login screen.</div></section></main><script>'+
  '(function(){const $=id=>document.getElementById(id);const labels={autoread:"Auto-read messages",autobio:"Auto-bio status",autorespond:"Auto-reply to private messages",anticall:"Reject incoming calls"};let busy=false;async function api(path,method,body){const options={method:method||"GET",credentials:"same-origin",headers:{}};if(body!==undefined){options.headers["Content-Type"]="application/json";options.body=JSON.stringify(body);}const r=await fetch(path,options);let data={};try{data=await r.json();}catch{}if(!r.ok)throw new Error(data.error||("HTTP "+r.status));return data;}function showLogin(){ $("dashboard").classList.add("hidden");$("login").classList.remove("hidden");}function showDashboard(){ $("login").classList.add("hidden");$("dashboard").classList.remove("hidden");}function message(text,isError){$("actionMessage").textContent=text;$("actionMessage").style.color=isError?"#ffb5ae":"#b8e8c8";}function duration(n){n=Math.max(0,Number(n)||0);const d=Math.floor(n/86400),h=Math.floor(n%86400/3600),m=Math.floor(n%3600/60);return (d?d+"d ":"")+h+"h "+m+"m";}function renderPrefs(p){const root=$("preferences");root.replaceChildren();Object.keys(labels).forEach(key=>{const row=document.createElement("label");row.className="toggle";const name=document.createElement("span");name.textContent=labels[key];const input=document.createElement("input");input.type="checkbox";input.checked=p[key]===true;input.addEventListener("change",async()=>{input.disabled=true;try{await api("/api/preferences","POST",{key:key,enabled:input.checked});message(labels[key]+": "+(input.checked?"ON":"OFF"),false);}catch(e){input.checked=!input.checked;message(e.message,true);}finally{input.disabled=false;}});row.append(name,input);root.append(row);});}async function refresh(){const s=await api("/api/status");$("wa").textContent=s.connected?"CONNECTED":"DISCONNECTED";$("uptime").textContent=duration(s.uptimeSeconds);$("ram").textContent=s.memory.rssMb+" MB";$("freeRam").textContent=s.memory.freeMb+" MB";$("downloads").textContent=s.downloader.success+" / "+s.downloader.failed;$("subbot").textContent=s.subbotStatus||"inactive";$("lastDownload").textContent="Last downloader activity: "+(s.downloader.lastAt||"none")+(s.downloader.lastError?" · "+s.downloader.lastError:"");renderPrefs(s.preferences||{});showDashboard();}async function boot(){try{await refresh();}catch(e){if(e.message.indexOf("401")>=0||e.message.indexOf("Unauthorized")>=0)showLogin();else showLogin();}}$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(busy)return;busy=true;$("loginButton").disabled=true;$("loginError").textContent="";try{await api("/api/login","POST",{password:$("password").value});$("password").value="";await refresh();}catch(err){$("loginError").textContent=err.message;}finally{busy=false;$("loginButton").disabled=false;}});$("logoutButton").addEventListener("click",async()=>{try{await api("/api/logout","POST",{});}catch{}showLogin();});$("refreshButton").addEventListener("click",()=>refresh().then(()=>message("Status refreshed.",false)).catch(e=>message(e.message,true)));$("reconnectButton").addEventListener("click",async()=>{if(!confirm("Reconnect the main WhatsApp session now?"))return;try{await api("/api/reconnect","POST",{});message("Reconnect requested. Wait for WhatsApp to reconnect.",false);}catch(e){message(e.message,true);}});boot();})();'+
  '</script></body></html>';
}
function createDashboardHandler({passwordHash=process.env.DASHBOARD_PASSWORD_HASH,sessionSecret=process.env.DASHBOARD_SESSION_SECRET,getStatus,ownerPreferences,reconnect,onPreferenceChange,logger}={}){
  const configured=Boolean(parsePasswordHash(passwordHash)&&typeof sessionSecret==='string'&&Buffer.byteLength(sessionSecret)>=32);
  function auth(req){return getSession(req);}
  function locked(res){send(res,503,'Dashboard locked. Run npm run dashboard:setup and restart Beauté.','text/plain; charset=utf-8');}
  async function handler(req,res){
    try{
      const url=new URL(req.url||'/', 'http://localhost');
      if(req.method==='GET'&&url.pathname==='/'){
        if(!configured)return locked(res);
        send(res,200,renderDashboardPage(),'text/html; charset=utf-8');return;
      }
      if(!configured)return locked(res);
      if(req.method==='POST'&&!sameOrigin(req)){json(res,403,{error:'Cross-origin request rejected.'});return;}
      if(req.method==='POST'&&url.pathname==='/api/login'){
        const ip=requestIp(req),now=Date.now(),entry=loginAttempts.get(ip)||{count:0,reset:now+LOGIN_WINDOW};
        if(now>entry.reset){entry.count=0;entry.reset=now+LOGIN_WINDOW;}
        if(entry.count>=LOGIN_MAX){json(res,429,{error:'Too many login attempts. Try again in 15 minutes.'},{'Retry-After':'900'});return;}
        const body=await readJson(req);
        const password=typeof body.password==='string'?body.password:'';
        if(!await verifyPassword(password,passwordHash)){entry.count++;loginAttempts.set(ip,entry);json(res,401,{error:'Password incorrect.'});return;}
        loginAttempts.delete(ip);
        const token=crypto.randomBytes(32).toString('base64url');
        sessions.set(token,{created:now,expires:now+SESSION_TTL});
        while(sessions.size>8)sessions.delete(sessions.keys().next().value);
        json(res,200,{ok:true},{'Set-Cookie':makeSessionCookie(req,token)});return;
      }
      if(req.method==='POST'&&url.pathname==='/api/logout'){
        const current=auth(req);if(current)sessions.delete(current.token);
        json(res,200,{ok:true},{'Set-Cookie':clearSessionCookie(req)});return;
      }
      if(req.method==='GET'&&(url.pathname==='/api/status'||url.pathname==='/healthz')){
        if(!auth(req)){json(res,401,{error:'Unauthorized.'});return;}
        const status=await getStatus();
        if(url.pathname==='/healthz'){json(res,200,{alive:true,connected:status.connected===true});return;}
        json(res,200,status);return;
      }
      if(req.method==='POST'&&url.pathname==='/api/preferences'){
        if(!auth(req)){json(res,401,{error:'Unauthorized.'});return;}
        const body=await readJson(req);
        if(!PREF_KEYS.has(body.key)||typeof body.enabled!=='boolean'){json(res,400,{error:'Invalid preference.'});return;}
        if(!ownerPreferences){json(res,503,{error:'Owner preferences unavailable.'});return;}
        await ownerPreferences.set(body.key,body.enabled);
        if(onPreferenceChange)await onPreferenceChange(body.key,body.enabled);
        json(res,200,{ok:true,key:body.key,enabled:body.enabled});return;
      }
      if(req.method==='POST'&&url.pathname==='/api/reconnect'){
        if(!auth(req)){json(res,401,{error:'Unauthorized.'});return;}
        if(typeof reconnect!=='function'){json(res,503,{error:'Reconnect unavailable.'});return;}
        await reconnect();
        json(res,202,{ok:true,message:'Reconnect requested.'});return;
      }
      if(url.pathname.startsWith('/api/')){json(res,404,{error:'Not found.'});return;}
      send(res,404,'Not found.','text/plain; charset=utf-8');
    }catch(err){
      logger?.warn?.({error:String(err.message||err).slice(0,160)},'Dashboard request failed');
      if(!res.headersSent)json(res,err.status||500,{error:err.status?err.message:'Request failed.'});
      else res.destroy();
    }
  }
  handler.closeSessions=()=>sessions.clear();
  handler.isConfigured=configured;
  return handler;
}
module.exports={createDashboardHandler,renderDashboardPage,verifyPassword,parsePasswordHash,SESSION_TTL};
