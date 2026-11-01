'use strict';
const http = require('node:http');
const { spawn } = require('node:child_process');
const { randomBytes, timingSafeEqual } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const tokenFile = path.join(root, '.beaute-panel-token');
if (!fs.existsSync(tokenFile)) fs.writeFileSync(tokenFile, randomBytes(32).toString('hex') + '\n', {mode:0o600});
const token = fs.readFileSync(tokenFile,'utf8').trim();
const port = Number(process.env.PANEL_PORT || 8787);
const host = '127.0.0.1'; // never expose admin endpoints publicly
let child=null, since=null, restarts=0, intentional=false, timer=null;
const logs=[];
function log(s){for(const line of String(s).split(/\r?\n/)){if(line){logs.push(line.slice(0,1200));if(logs.length>250)logs.shift();}}}
function launch(){
 if(child)return false;
 intentional=false;
 const proc=spawn('npm',['start'],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe'],shell:false});
 child=proc;since=Date.now();log('[panel] starting bot');
 proc.stdout.on('data',d=>log(d.toString()));
 proc.stderr.on('data',d=>log(d.toString()));
 proc.on('error',e=>log('[panel] spawn error: '+e.message));
 proc.on('close',(code,signal)=>{
  if(child!==proc)return;
  child=null;since=null;log('[panel] exited '+code+' '+signal);
  if(!intentional){restarts++;timer=setTimeout(()=>{timer=null;launch();},5000);}
 });
 return true;
}
function stop(){
 intentional=true;
 if(timer){clearTimeout(timer);timer=null;}
 if(child){const proc=child;proc.kill('SIGTERM');setTimeout(()=>{if(child===proc)proc.kill('SIGKILL');},7000).unref();}
}
function auth(req){
 const h=req.headers.authorization||'';
 const supplied=h.startsWith('Bearer ')?h.slice(7):'';
 const a=Buffer.from(supplied),b=Buffer.from(token);
 return a.length===b.length&&timingSafeEqual(a,b);
}
function send(res,status,obj){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj));}
const html=`<!doctype html><html lang="id"><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>Beauté. Hosting</title><style>body{background:#101522;color:#f5f3ff;font:16px system-ui;max-width:720px;margin:40px auto;padding:16px}section{background:#202638;border-radius:16px;padding:20px;margin:12px 0}button,input{font:inherit;padding:12px;border-radius:10px;border:0;margin:4px}button{background:#b795f2;color:#181026}input{max-width:95%}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:360px;overflow:auto;font-size:12px}small{color:#bbc}</style><h1>🌹 Beauté. Hosting</h1><section><input id="token" type="password" placeholder="Token panel" autocomplete="off"><button onclick="connect()">Masuk</button><small>Token disimpan hanya di memori halaman, bukan localStorage.</small></section><section><h2 id="status">Belum terhubung</h2><p id="info"></p><button onclick="act('start')">▶ Start</button><button onclick="act('restart')">↻ Restart</button><button onclick="act('stop')">■ Stop</button></section><section><h3>Log bot</h3><pre id="logs">—</pre></section><script>let secret='';const el=id=>document.getElementById(id);function connect(){secret=el('token').value;el('token').value='';refresh()}async function request(path,method='GET'){const r=await fetch(path,{method,headers:{Authorization:'Bearer '+secret}});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}async function refresh(){if(!secret)return;try{const d=await request('/api/status');el('status').textContent=d.running?'🟢 Bot berjalan':'⚪ Bot berhenti';el('info').textContent='PID: '+(d.pid||'-')+' | Uptime: '+Math.floor(d.uptimeSeconds/60)+' menit | Restart: '+d.restarts;el('logs').textContent=d.logs.join('\\n')}catch(e){el('status').textContent='Akses gagal: '+e.message}}async function act(name){if(!secret)return alert('Masukkan token dahulu');try{await request('/api/'+name,'POST');await refresh()}catch(e){alert(e.message)}}setInterval(refresh,3000)</script></html>`;
const server=http.createServer((req,res)=>{
 if(req.url==='/'&&req.method==='GET'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});return res.end(html);}
 if(!auth(req))return send(res,401,{error:'unauthorized'});
 if(req.url==='/api/status'&&req.method==='GET')return send(res,200,{running:!!child,pid:child?.pid||null,uptimeSeconds:since?Math.floor((Date.now()-since)/1000):0,restarts,logs});
 if(req.method==='POST'){
  if(req.url==='/api/start'){if(timer){clearTimeout(timer);timer=null;}return send(res,200,{started:launch()});}
  if(req.url==='/api/stop'){stop();return send(res,200,{ok:true});}
  if(req.url==='/api/restart'){stop();const wait=()=>{if(child)return setTimeout(wait,250);launch();};wait();return send(res,200,{ok:true});}
 }
 send(res,404,{error:'not found'});
});
server.listen(port,host,()=>console.log('Beauté panel: http://'+host+':'+port+' | token: '+tokenFile));
process.on('SIGINT',()=>{stop();server.close();});
process.on('SIGTERM',()=>{stop();server.close();});
