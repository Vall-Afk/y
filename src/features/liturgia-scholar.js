'use strict';
const COMMANDS=new Set(['liturgisejarah','liturgiascholar']);
const topics={
 christusrex:{id:'Kristus Raja',en:'Christ the King',la:'Domini Nostri Iesu Christi Regis',note:'Pesta Kristus Raja ditetapkan oleh Paus Pius XI melalui ensiklik Quas primas (1925). Dalam kalender 1962 dirayakan Minggu terakhir Oktober; dalam kalender modern pada Minggu sebelum Adven I. Perbedaan nama dan tanggal tidak berarti kedua kalender identik.'},
 advent:{id:'Adven',en:'Advent',la:'Adventus',note:'Masa persiapan menyambut Natal dan kedatangan Kristus. Rincian rubrik, tingkatan hari, dan bacaan berbeda antara penggunaan Misale 1962 dan kalender modern.'},
 pascha:{id:'Paskah',en:'Easter',la:'Pascha',note:'Puncak tahun liturgi, merayakan Kebangkitan Tuhan. Tanggal bergerak menurut komputus Gregorian dalam kalender Roma; perayaan Pekan Suci memiliki tata perayaan yang berbeda antar-edisi Misale.'}
};
async function handle(ctx){if(!COMMANDS.has(ctx.cmd.name))return false;const key=(ctx.cmd.args[0]||'').toLowerCase(),topic=topics[key];await ctx.reply(topic?['Beauté · Liturgia Scholar','Indonesia: '+topic.id,'English: '+topic.en,'Latina: '+topic.la,topic.note,'Catatan: ringkasan historis, bukan teks rubrik resmi.'].join('\n'):'Topik tersedia: christusrex, advent, pascha. Ensiklopedia penuh dan rujukan primer masih dalam pengembangan.');return true;}
module.exports={COMMANDS,handle,topics};
