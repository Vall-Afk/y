'use strict';
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { contentAndKey } = require('../media');

function xmlSafe(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
}
function splitText(text, maxLength = 90) {
  if (typeof text !== 'string' || !text.trim() || text.length > maxLength)
    throw new Error('Teks harus 1–' + maxLength + ' karakter.');
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    // Reject overlong chunks to avoid massive SVG content or unreadable text.
    if ([...word].length > 27) throw new Error('Kata terlalu panjang.');
    if (line && [...(line + ' ' + word)].length > 20) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  if (lines.length > 5) throw new Error('Maksimal 5 baris teks.');
  return lines;
}
function svgTtp(text) {
  const lines = splitText(text, 85);
  const fontSize = Math.min(55, 260 / lines.length);
  const startY = 256 - (lines.length - 1) * (fontSize * 1.12) / 2;
  const content = lines.map((line, i) =>
    '<text x="256" y="' + (startY + i * fontSize * 1.12) +
    '" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" ' +
    'font-weight="bold" font-size="' + fontSize + '" fill="#ffffff" stroke="#000000" ' +
    'stroke-width="4" paint-order="stroke">' + xmlSafe(line) + '</text>').join('');
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">' +
    '<rect x="4" y="4" width="504" height="504" rx="100" fill="#5834b9"/>' +
    '<circle cx="400" cy="110" r="105" fill="#ed72ca" opacity=".6"/>' +
    '<circle cx="120" cy="430" r="155" fill="#3bb6ec" opacity=".45"/>' + content + '</svg>');
}
async function textSticker(text) {
  const result = await sharp(svgTtp(text), { limitInputPixels: 1_000_000 })
    .webp({ quality: 82, effort: 4 }).toBuffer();
  if (result.length > 800 * 1024) throw new Error('Stiker terlalu besar.');
  return result;
}
function memeTextSvg(top, bottom) {
  const captions = [
    ...(top?.trim() ? splitText(top.trim(), 85) : []).map((s, i) => ({ text: s, y: 50 + 44 * i })),
    ...(bottom?.trim() ? splitText(bottom.trim(), 85) : []).map((s, i, arr) =>
      ({ text: s, y: 485 - (arr.length - i - 1) * 44 }))
  ];
  if (captions.length > 8) throw new Error('Terlalu banyak baris.');
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">' +
    captions.map(({ text, y }) =>
      '<text x="256" y="' + y + '" font-size="38" font-family="Arial, sans-serif" font-weight="900" ' +
      'text-anchor="middle" fill="white" stroke="black" stroke-width="6" paint-order="stroke">' +
      xmlSafe(text.toUpperCase()) + '</text>').join('') +
    '</svg>');
}
async function memeSticker(sock, message, args, logger, download = downloadMediaMessage) {
  if (typeof args !== 'string' || args.length > 170) throw new Error('Teks meme maksimal 170 karakter.');
  const [top, ...rest] = args.split('|');
  const bottom = rest.join('|').trim();
  if (!top?.trim() && !bottom) throw new Error('Contoh: smeme ATAS | BAWAH (balas gambar).');
  const target = contentAndKey(message);
  if (!target?.message?.imageMessage) throw new Error('Balas gambar atau kirim gambar dengan caption smeme ATAS | BAWAH.');
  const declaredLength = Number(target.message.imageMessage.fileLength || 0);
  if (declaredLength > 5 * 1024 * 1024) throw new Error('Gambar maksimal 5 MB.');
  const buffer = await download(target, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
  if (!Buffer.isBuffer(buffer) || buffer.length > 5 * 1024 * 1024) throw new Error('Gambar terlalu besar.');
  const svg = memeTextSvg(top?.trim(), bottom);
  const result = await sharp(buffer, { limitInputPixels: 25_000_000, animated: false })
    .resize(512, 512, { fit: 'cover' })
    .composite([{ input: svg, gravity: 'centre' }])
    .webp({ quality: 80, effort: 4 }).toBuffer();
  if (result.length > 800 * 1024) throw new Error('Stiker terlalu besar.');
  return result;
}
module.exports = { textSticker, memeSticker, xmlSafe, splitText };
