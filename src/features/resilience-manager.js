'use strict';
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const {report}=require('./bot-health');
const COMMANDS=new Set(['diagnose','repair','updatecheck','backupjadwal']);
const run=promisify(execFile);
async function handle(ctx){if(!COMMANDS.has(ctx.cmd.name))return false;if(!ctx.owner||ctx.group){await ctx.reply('Perintah khusus owner melalui chat pribadi.');return true;}const name=ctx.cmd.name;if(name==='diagnose'){await ctx.reply(report({connected:ctx.connected?.()||false,subbot:ctx.subbot})+'\nSelf-healing: mode diagnostik, restart otomatis belum diaktifkan.');return true;}if(name==='repair'){await ctx.reply('Repair otomatis dinonaktifkan demi keamanan. Periksa .diagnose dan log sebelum restart manual.');return true;}if(name==='backupjadwal'){await ctx.reply('Penjadwalan backup belum diaktifkan. Gunakan fitur backup yang sudah tersedia; jangan kirim berkas autentikasi ke chat.');return true;}try{const {stdout}=await run('git',['rev-parse','--short','HEAD'],{timeout:4000,maxBuffer:1024*32});await ctx.reply('Beauté · Update Manager\nCommit lokal: '+stdout.trim()+'\nPerbandingan dengan remote belum dijalankan. Gunakan git fetch secara manual sebelum update.');}catch{await ctx.reply('Git lokal tidak tersedia atau repository belum dikonfigurasi.');}return true;}
module.exports={COMMANDS,handle};
