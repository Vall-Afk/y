'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const port=Number(process.env.BEAUTE_PANEL_PORT||8787);
const host=process.env.BEAUTE_PANEL_HOST||'127.0.0.1';
const secret=process.env.BEAUTE_PANEL_TOKEN||crypto.randomBytes(24).toString('hex');
let child=null,stopping=false,started=0,restarts=0,timer=null;
const logs=[];
function log(chunk){for(const line of String(chunk).replace(/\x1b\[[0-9;]*m/g,'').split(/\r?\n/)){if(line){logs.push(line.slice(0,1200));if(logs.length>250)logs.shift();}}}
function start(){if(child)return;stopping=false;const p=spawn(process.execPath,['--env-file=.env','src/index.js'],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe'],windowsHide:true});child=p;started=Date.now();log('[panel] Bot starting');p.stdout.on('data',log);p.stderr.on('data',log);p.on('error',e=>log('[panel] '+e.message));p.on('close',(code)=>{if(child!==p)return;child=null;started=0;log('[panel] Bot exited: '+code);if(!stopping){restarts++;timer=setTimeout(()=>{timer=null;start();},10000);}});}
function stop(){stopping=true;if(timer){clearTimeout(timer);timer=null;}if(child){child.kill();}}
function auth(req){const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');const a=crypto.createHash('sha256').update(supplied).digest();const b=crypto.createHash('sha256').update(secret).digest();return crypto.timingSafeEqual(a,b);}
function send(res,status,obj){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj));}
const page=fs.readFileSync(path.join(__dirname,'index.html'));
http.createServer((req,res)=>{
if(req.url==='/'&&req.method==='GET'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-frame-options':'DENY','content-security-policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'"});return res.end(page);}
if(!auth(req))return send(res,401,{error:'Unauthorized'});
if(req.url==='/api/status'&&req.method==='GET')return send(res,200,{running:!!child,pid:child?.pid||null,uptime:started?Math.floor((Date.now()-started)/1000):0,restarts,logs});
if(req.method==='POST'&&['/api/start','/api/stop','/api/restart'].includes(req.url)){
 const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==req.headers.host)return send(res,403,{error:'Origin denied'});}catch{return send(res,403,{error:'Origin denied'});}}
 if(req.url==='/api/start')start();if(req.url==='/api/stop')stop();if(req.url==='/api/restart'){stop();const wait=()=>child?setTimeout(wait,200):start();wait();}
 return send(res,200,{ok:true});
}
send(res,404,{error:'Not found'});
}).listen(port,host,()=>{console.log('Beauté. Local Panel: http://'+host+':'+port);console.log('Admin token: '+secret);console.log('Keep token private.');});
process.on('SIGINT',()=>{stop();process.exit(0)});
process.on('SIGTERM',()=>{stop();process.exit(0)});
