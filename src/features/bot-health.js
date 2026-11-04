'use strict';
const os=require('node:os');
const HEALTH_COMMANDS=new Set(['bothealth']);
const state={downloadOk:0,downloadFailed:0,lastDownloadError:null,lastDownloadAt:null,failures:0,lastAlertAt:0};
function recordDownload(ok,error){
  state.lastDownloadAt=new Date().toISOString();
  if(ok){state.downloadOk++;state.failures=0;state.lastDownloadError=null;}
  else{state.downloadFailed++;state.failures++;state.lastDownloadError=String(error||'unknown').slice(0,120);}
}
function report({connected=false,subbot=null}={}){
 const mem=process.memoryUsage(),mb=n=>(n/1048576).toFixed(1)+' MB';
 return ['Beauté · HEALTH MONITOR','WhatsApp: '+(connected?'TERHUBUNG':'TERPUTUS'),
  'Uptime: '+Math.floor(process.uptime())+' detik','RAM RSS: '+mb(mem.rss),'Heap: '+mb(mem.heapUsed),
  'RAM sistem tersedia: '+mb(os.freemem()),'Downloader sukses/gagal: '+state.downloadOk+'/'+state.downloadFailed,
  'Kegagalan beruntun: '+state.failures,'Terakhir: '+(state.lastDownloadAt||'belum ada'),
  'Kesalahan terakhir: '+(state.lastDownloadError||'-'),
  'SaveAPI: '+(process.env.SAVEAPI_KEY?'dikonfigurasi':'tidak dikonfigurasi'),
  'Jadibot: '+(subbot?.slot?.status||'tidak aktif')].join('\n');
}
async function handleHealth(ctx){
 if(!HEALTH_COMMANDS.has(ctx.cmd.name))return false;
 if(!ctx.owner||ctx.group){await ctx.reply('bothealth hanya tersedia untuk owner melalui chat pribadi.');return true;}
 await ctx.reply(report({connected:ctx.connected?.()||false,subbot:ctx.subbot}));return true;
}
async function notifyRepeatedFailure(ctx){
 if(state.failures<3||!ctx.config?.ownerJid||!ctx.sock)return;
 if(Date.now()-state.lastAlertAt<30*60*1000)return;
 state.lastAlertAt=Date.now();
 try{await ctx.sock.sendMessage(ctx.config.ownerJid,{text:'Beauté · HEALTH ALERT: '+state.failures+' kegagalan downloader berturut-turut. Terakhir: '+state.lastDownloadError});}
 catch(e){ctx.logger?.warn?.({error:e.message},'Health alert failed');}
}
module.exports={HEALTH_COMMANDS,handleHealth,report,recordDownload,notifyRepeatedFailure,state};
