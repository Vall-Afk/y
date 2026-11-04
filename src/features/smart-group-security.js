'use strict';
const COMMANDS=new Set(['antiraid']);
const settings=new Map(),windows=new Map();
function inspect(group,sender,time=Date.now()){if(!settings.get(group))return false;const key=group+'|'+sender,old=windows.get(key)||[],recent=old.filter(t=>time-t<10000);recent.push(time);windows.set(key,recent);if(windows.size>3000)windows.clear();return recent.length>=8;}
async function handle(ctx){if(!COMMANDS.has(ctx.cmd.name))return false;if(!ctx.group){await ctx.reply('Hanya tersedia di grup.');return true;}const role=await ctx.roles();if(!ctx.owner&&!role.senderAdmin){await ctx.reply('Hanya admin grup.');return true;}const arg=ctx.cmd.args[0];if(arg==='on'||arg==='off'){settings.set(ctx.chat,arg==='on');await ctx.reply('Anti-raid '+arg+'. Mode deteksi saja; belum menghapus pesan atau mengeluarkan anggota.');}else await ctx.reply('Anti-raid: '+(settings.get(ctx.chat)?'ON':'OFF')+' (deteksi saja). Gunakan .antiraid on|off. Pengaturan belum persisten setelah restart.');return true;}
module.exports={COMMANDS,handle,inspect,settings};
