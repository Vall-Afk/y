'use strict';
// Consent-based broadcast. Subscriptions are ephemeral and reset at restart.
const BROADCAST_COMMANDS=new Set(['bcjoin','bcleave','bcstatus','broadcast','bcimg','bcstik','bcvn','bcvideo','bcsewa','menfess','casino','delcasino','fitnah','fakehidetag']);
const subscribers=new Set();let lastBroadcast=0;
async function handleBroadcast({cmd,reply,owner,group,chat,sock}){if(!BROADCAST_COMMANDS.has(cmd.name))return false;
if(['casino','delcasino','fitnah','fakehidetag'].includes(cmd.name)){await reply('Perintah lama ini tidak diaktifkan: gunakan permainan tanpa taruhan atau pesan yang tidak menyamar sebagai pengguna lain.');return true;}
if(cmd.name==='menfess'){await reply('Menfess anonim belum tersedia: diperlukan persetujuan penerima dan mekanisme pelaporan sebelum pengiriman.');return true;}
if(group){await reply('Pengelolaan siaran hanya melalui chat pribadi.');return true;}
if(cmd.name==='bcjoin'){if(!/^\d+@s\.whatsapp\.net$/.test(chat)){await reply('Nomor penerima tidak didukung.');return true;}subscribers.add(chat);await reply('Berlangganan pesan bot aktif. Ketik bcleave kapan pun.');return true;}
if(cmd.name==='bcleave'){subscribers.delete(chat);await reply('Berhenti berlangganan.');return true;}
if(cmd.name==='bcstatus'){await reply(owner?'Penerima opt-in aktif: '+subscribers.size:'Status: '+(subscribers.has(chat)?'berlangganan':'tidak berlangganan'));return true;}
if(!owner){await reply('Hanya owner yang boleh mengirim siaran.');return true;}
if(cmd.name!=='broadcast'){await reply(cmd.name+' hanya mendukung teks melalui broadcast saat ini; media tidak diteruskan tanpa validasi dan persetujuan tambahan.');return true;}
const message=cmd.args.join(' ').trim();if(message.length<1||message.length>900){await reply('broadcast PESAN (maksimum 900 karakter)');return true;}
if(Date.now()-lastBroadcast<3600000){await reply('Maksimal satu broadcast per jam.');return true;}
lastBroadcast=Date.now();let sent=0,failed=0;for(const target of [...subscribers].slice(0,50)){try{await sock.sendMessage(target,{text:'📣 Pengumuman Beauté.\n'+message+'\n\nKetik bcleave untuk berhenti.'});sent++;}catch{failed++;}}
await reply('Broadcast selesai. Berhasil: '+sent+'; gagal: '+failed+'; penerima: opt-in saja.');return true;}
module.exports={BROADCAST_COMMANDS,handleBroadcast};
