'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('sharp');
const CAPTION='*Sewa Beauté.*\nMingguan: Rp10.000\nBulanan: Rp30.000\nKonfirmasi pembayaran: ketik owner.';
async function sendPayment(ctx){const svg=await fs.readFile(path.join(__dirname,'../../assets/paymethod.svg'));const image=await sharp(svg).png().toBuffer();await ctx.sock.sendMessage(ctx.chat,{image,caption:CAPTION},{quoted:ctx.message});return true;}
module.exports={CAPTION,sendPayment};
