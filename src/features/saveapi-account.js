'use strict';
// Owner-only SaveAPI account diagnostics. Never print API keys or raw provider responses.
const SAVEAPI_COMMANDS=new Set(['saveapibalance','saveapiusage']);
async function querySaveAPI(path,{request=fetch}={}){
  const key=process.env.SAVEAPI_KEY;
  if(!key)throw Error('SAVEAPI_KEY belum tersedia di .env.');
  const response=await request('https://api.saveapi.org/v1/'+path,{
    headers:{Authorization:'Bearer '+key,Accept:'application/json'},
    redirect:'error',signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)throw Error('SaveAPI HTTP '+response.status);
  const data=await response.json();
  return {data,remaining:response.headers?.get?.('X-Credits-Remaining')||null};
}
function extractBalance(result){
  const d=result.data||{};
  for(const candidate of [result.remaining,d.credits_remaining,d.creditsRemaining,d.credits,d.balance,d.data?.credits_remaining,d.data?.credits,d.data?.balance]){
    if(candidate!==undefined&&candidate!==null&&candidate!==''&&Number.isFinite(Number(candidate)))return Number(candidate);
  }
  return null;
}
async function handleSaveAPI(ctx,{query=querySaveAPI}={}){
  if(!SAVEAPI_COMMANDS.has(ctx.cmd.name))return false;
  if(!ctx.owner||ctx.chat?.endsWith('@g.us')){
    await ctx.reply('Perintah SaveAPI hanya untuk owner melalui chat pribadi.');
    return true;
  }
  try{
    const result=await query(ctx.cmd.name==='saveapiusage'?'usage':'me');
    const balance=extractBalance(result);
    const lines=['Beauté · SaveAPI',balance===null?'Saldo: tidak tersedia pada respons API.':'Sisa kredit: '+balance.toLocaleString('id-ID')];
    if(balance!==null&&balance<100)lines.push('PERINGATAN: kredit di bawah 100.');
    if(ctx.cmd.name==='saveapiusage'){
      // Only print explicitly recognized, non-sensitive aggregate fields.
      const d=result.data?.data||result.data||{};
      for(const field of ['total_requests','total_downloads','credits_used','requests','downloads']){
        if(typeof d[field]==='number'&&Number.isFinite(d[field]))lines.push(field+': '+d[field]);
      }
      lines.push('Detail penggunaan tersedia pada dashboard SaveAPI jika API tidak mengirim agregat.');
    }
    await ctx.reply(lines.join('\n'));
  }catch(e){await ctx.reply('Pemeriksaan SaveAPI gagal: '+String(e.message).slice(0,120));}
  return true;
}
module.exports={SAVEAPI_COMMANDS,querySaveAPI,extractBalance,handleSaveAPI};
