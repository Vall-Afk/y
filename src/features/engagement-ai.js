'use strict';
// Consent-first engagement commands. No unsolicited DMs, no stored chat transcripts.
const COMMANDS=new Set(['roast','puji','tarot','ramalan','zodiak','cekhoax','simpulkan','drama','stikermeme','tanyavoice','menfess','report','antitoxic']);
const crypto=require('node:crypto');
const rates=new Map();
const consent=new Set();
function rate(key,ms=30000,now=Date.now()){const prev=rates.get(key)||0;if(now-prev<ms)return false;rates.set(key,now);if(rates.size>2000)rates.clear();return true;}
function card(seed){const cards=['Si Bodoh (The Fool)','Sang Penyihir (The Magician)','Sang Bintang (The Star)','Roda Keberuntungan (Wheel of Fortune)','Kekuatan (Strength)'];const hash=crypto.createHash('sha256').update(seed).digest();return cards[hash[0]%cards.length];}
function factCheckGuidance(text){if(!text||text.trim().length<12)return 'Balas pesan yang ingin diperiksa dengan .cekhoax. Klaim harus memiliki konteks.';return 'Beauté · Cek Hoax\nStatus: BELUM TERVERIFIKASI.\nKlaim: '+text.trim().slice(0,500)+'\nPeriksa sumber primer, tanggal, dan konteks. Tanpa pencarian bukti dan sitasi tepercaya, bot tidak dapat menyatakan fakta atau hoaks.';}
async function handle(ctx){
 if(!COMMANDS.has(ctx.cmd.name))return false;
 const name=ctx.cmd.name,args=ctx.cmd.args||[],sender=ctx.accountSender||ctx.sender||ctx.chat;
 if(name==='antitoxic'){if(!ctx.group)return ctx.reply('Khusus grup.');const role=await ctx.roles();if(!ctx.owner&&!role.senderAdmin)return ctx.reply('Hanya admin.');return ctx.reply('Anti-toxic AI belum aktif. Untuk moderasi nyata diperlukan model, audit, banding, dan batas tindakan. Gunakan fitur moderasi yang tersedia.');}
 if(name==='menfess'){if(args[0]==='izin'){consent.add(sender);return ctx.reply('Persetujuan menerima menfess dicatat selama proses bot aktif. Belum mengirim pesan.');}if(args[0]==='cabut'){consent.delete(sender);return ctx.reply('Persetujuan menfess dicabut.');}return ctx.reply('Menfess belum mengirim pesan. Pengiriman hanya boleh ke penerima yang opt-in, dengan rate limit, blokir, dan pelaporan penyalahgunaan.');}
 if(name==='report'){const msg=args.join(' ').trim();if(msg.length<12)return ctx.reply('Contoh: .report Downloader Instagram gagal saat menerima link reel publik.');if(!rate('report:'+sender,60000))return ctx.reply('Tunggu 1 menit sebelum laporan berikutnya.');return ctx.reply('Laporan disiapkan (belum dikirim ke GitHub):\nJudul: Bug Beauté\nDeskripsi: '+msg.slice(0,1000)+'\nCatatan: perlu konfirmasi owner dan GitHub App dengan izin Issues terbatas.');}
 if(name==='roast'||name==='puji'){if(args.some(x=>x.startsWith('@')))return ctx.reply('Roast/pujian untuk orang lain memerlukan persetujuan mereka. Gunakan .'+name+' saya.');if(args[0]!=='saya')return ctx.reply('Contoh: .'+name+' saya. Tidak membaca foto profil atau riwayat chat tanpa izin.');return ctx.reply(name==='roast'?'Roast ringan: Kamu begitu rajin mengetik command sampai keyboard ingin mengajukan cuti.':'Pujian: Kamu penasaran dan mau mencoba hal baru. Itu kebiasaan yang bagus.');}
 if(name==='tarot'||name==='ramalan'||name==='zodiak'){if(!rate('tarot:'+sender,10000))return ctx.reply('Tunggu 10 detik.');return ctx.reply('Hiburan saja, bukan prediksi nyata.\nKartu: '+card(sender+'|'+new Date().toISOString().slice(0,10))+'\nRamalan: Ada kesempatan untuk belajar hal baru. Nasibmu tetap bergantung pada keputusanmu, bukan server Node.js.');}
 if(name==='cekhoax'){const quoted=ctx.message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;const text=quoted?.conversation||quoted?.extendedTextMessage?.text||args.join(' ');return ctx.reply(factCheckGuidance(text));}
 if(name==='simpulkan'||name==='drama')return ctx.reply('Ringkasan grup belum aktif. Bot tidak menyimpan 50–100 pesan terakhir tanpa persetujuan anggota dan kebijakan retensi.');
 if(name==='stikermeme')return ctx.reply('AI image-to-sticker belum dikonfigurasi. Gunakan fitur stiker biasa; perlu penyedia gambar, batas biaya dan konversi media.');
 if(name==='tanyavoice')return ctx.reply('Transkripsi voice note belum dikonfigurasi. Perlu STT/TTS dengan izin pengguna dan penghapusan audio sementara.');
 return false;
}
module.exports={COMMANDS,handle,card,factCheckGuidance,rate};
