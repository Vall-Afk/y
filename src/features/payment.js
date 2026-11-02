'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('sharp');
const QRCode=require('qrcode');
// QRIS payload decoded from the merchant's own supplied QR image; never replace with another merchant.
const QRIS='00020101021126610014COM.GO-JEK.WWW01189360091434969281110210G4969281110303UMI51440014ID.CO.QRIS.WWW0215ID10265061650120303UMI5204481453033605802ID5922Vall, Pulsa & Internet6012DELI SERDANG61052036162070703A01630454B5';
const CAPTION='*METODE PEMBAYARAN SEWA BEAUTÉ.*\n\n• Mingguan (7 hari): *Rp10.000*\n• Bulanan (1 bulan kalender): *Rp30.000*\n\nScan QRIS dan pastikan penerima *Vall, Pulsa & Internet*.\nSetelah membayar, kirim bukti kepada owner dengan mengetik *owner*. Aktivasi dilakukan setelah pembayaran diverifikasi.';
async function paymentImage(){
  const svg=await fs.readFile(path.join(__dirname,'../../assets/paymethod.svg'));
  const qr=await QRCode.toBuffer(QRIS,{type:'png',errorCorrectionLevel:'M',width:492,margin:3});
  return sharp(svg).composite([{input:qr,left:154,top:338}]).png().toBuffer();
}
async function sendPayment(ctx){const image=await paymentImage();await ctx.sock.sendMessage(ctx.chat,{image,caption:CAPTION},{quoted:ctx.message});return true;}
module.exports={CAPTION,QRIS,paymentImage,sendPayment};
