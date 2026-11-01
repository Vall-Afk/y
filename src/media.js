'use strict';
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

function contentAndKey(message) {
  const m = message.message || {};
  if (m.imageMessage || m.stickerMessage) return message;
  const context = m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || {};
  if (!context.quotedMessage) return null;
  return {
    key: {
      id: context.stanzaId,
      remoteJid: message.key.remoteJid,
      participant: context.participant
    },
    message: context.quotedMessage
  };
}
async function convertMedia(sock, message, format, logger) {
  const target = contentAndKey(message);
  if (!target) throw new Error('Kirim gambar atau balas gambar/stiker dahulu.');
  const m = target.message || {};
  const item = format === 'sticker' ? m.imageMessage : m.stickerMessage;
  if (!item) throw new Error(format === 'sticker' ? 'Hanya gambar yang didukung untuk sticker.' : 'Balas pesan stiker untuk mengubahnya.');
  const bytes = Number(item.fileLength || 0);
  if (bytes > 5 * 1024 * 1024) throw new Error('Ukuran maksimal media 5 MB.');
  const buffer = await downloadMediaMessage(target, 'buffer', {}, {
    logger,
    reuploadRequest: sock.updateMediaMessage
  });
  if (!Buffer.isBuffer(buffer) || buffer.length > 5 * 1024 * 1024) throw new Error('Media terlalu besar atau tidak valid.');
  const image = sharp(buffer, { limitInputPixels: 25_000_000, animated: false });
  if (format === 'sticker') {
    return image.resize(512, 512, { fit: 'contain', background: '#00000000' }).webp({ quality: 80 }).toBuffer();
  }
  return image.png().toBuffer();
}
module.exports = { convertMedia, contentAndKey };
