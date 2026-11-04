'use strict';
const COMMANDS=new Set(['analisispdf','analisisdokumen']);
async function handle(ctx){if(!COMMANDS.has(ctx.cmd.name))return false;await ctx.reply('Beauté · Document Analyzer\nAnalisis lampiran PDF/PPT belum aktif. Modul ekstraksi berkas dan pembatasan ukuran belum dikonfigurasi. Tidak akan mengaku telah membaca dokumen yang belum diproses.');return true;}
module.exports={COMMANDS,handle};
