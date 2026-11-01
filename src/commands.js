'use strict';
const { jid, isGroup, getText, getCommand, getSender, roleFromMeta, isInvite } = require('./util');
const { convertMedia } = require('./media');

function createRouter(config, store, logger, { now = () => Date.now(), convert = convertMedia } = {}) {
  const recent = new Map();
  async function reply(sock, message, text) {
    await sock.sendMessage(message.key.remoteJid, { text }, { quoted: message });
  }
  function isOwner(sender) { return jid(sender) === config.ownerJid; }
  async function roles(sock, chat, sender) {
    if (!isGroup(chat)) return { senderAdmin: false, botAdmin: false, metadata: null };
    const meta = await sock.groupMetadata(chat);
    return { ...roleFromMeta(meta, sender, sock.user?.id), metadata: meta };
  }
  async function handle(sock, message) {
    const chat = message?.key?.remoteJid;
    if (!chat || message.key.fromMe || chat === 'status@broadcast' || !message.message) return;
    const sender = getSender(message);
    const owner = isOwner(sender);
    const text = getText(message);
    if (!text || (store.mode === 'private' && !owner)) return;
    const group = isGroup(chat);
    const cmd = getCommand(text, config.prefix);
    if (!cmd && !(group && store.group(chat).antilink && isInvite(text))) return;
    const last = recent.get(sender) || 0;
    if (!owner && now() - last < 1800) return;
    recent.set(sender, now());
    if (recent.size > 4000) recent.clear();
    try {
      let role = { senderAdmin: false, botAdmin: false, metadata: null };
      const adminCmd = ['welcome', 'antilink', 'kick', 'groupinfo'].includes(cmd?.name);
      if (group && (adminCmd || (store.group(chat).antilink && isInvite(text)))) {
        role = await roles(sock, chat, sender);
      }
      if (group && store.group(chat).antilink && isInvite(text) &&
          !owner && !role.senderAdmin && role.botAdmin) {
        await sock.sendMessage(chat, { delete: message.key });
        if (!cmd) return;
      }
      if (!cmd) return;
      const flag = cmd.args[0]?.toLowerCase();
      if (['menu', 'help'].includes(cmd.name)) {
        return reply(sock, message,
          '*' + config.name + '*\n' +
          config.prefix + 'menu / ping / status / owner\n' +
          config.prefix + 'sticker (gambar/balas gambar)\n' +
          config.prefix + 'toimg (balas stiker)\n' +
          config.prefix + 'groupinfo (di grup)\n\n' +
          '*Admin grup:* ' + config.prefix + 'welcome on|off, ' + config.prefix + 'antilink on|off, ' + config.prefix + 'kick @anggota\n' +
          '*Owner:* ' + config.prefix + 'mode public|private');
      }
      if (cmd.name === 'ping') return reply(sock, message, 'Pong! ' + config.name);
      if (cmd.name === 'status') {
        return reply(sock, message, 'Bot: ' + config.name +
          '\nMode: ' + store.mode + '\nUptime: ' + Math.floor(process.uptime()) + ' detik');
      }
      if (cmd.name === 'owner') return reply(sock, message, 'Owner: ' + config.ownerName + '\nWhatsApp: https://wa.me/' + config.ownerNumber + '\nInstagram: https://instagram.com/' + config.ownerInstagram);
      if (cmd.name === 'mode') {
        if (!owner) return reply(sock, message, 'Khusus owner.');
        if (!['public', 'private'].includes(flag)) return reply(sock, message, 'Contoh: ' + config.prefix + 'mode private');
        await store.setMode(flag);
        return reply(sock, message, 'Mode berhasil diatur: ' + flag);
      }
      if (['welcome', 'antilink', 'kick', 'groupinfo'].includes(cmd.name)) {
        if (!group) return reply(sock, message, 'Perintah ini hanya untuk grup.');
        if (cmd.name === 'groupinfo') {
          return reply(sock, message, 'Grup: ' + String(role.metadata?.subject || chat).slice(0, 150) +
            '\nAnggota: ' + (role.metadata?.participants?.length || 0) +
            '\nWelcome: ' + (store.group(chat).welcome ? 'on' : 'off') +
            '\nAntilink: ' + (store.group(chat).antilink ? 'on' : 'off'));
        }
        if (!owner && !role.senderAdmin) return reply(sock, message, 'Khusus admin grup.');
        if (cmd.name !== 'kick') {
          if (!['on', 'off'].includes(flag)) return reply(sock, message, 'Gunakan on atau off.');
          await store.setGroupFlag(chat, cmd.name, flag === 'on');
          return reply(sock, message, cmd.name + ': ' + flag);
        }
        if (!role.botAdmin) return reply(sock, message, 'Jadikan bot admin grup terlebih dahulu.');
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = jid(mentioned[0] || '');
        if (!target.endsWith('@s.whatsapp.net')) return reply(sock, message, 'Tag pengguna: ' + config.prefix + 'kick @anggota');
        if (target === config.ownerJid || target === jid(sock.user?.id)) return reply(sock, message, 'Tidak bisa mengeluarkan owner atau bot.');
        await sock.groupParticipantsUpdate(chat, [target], 'remove');
        return reply(sock, message, 'Permintaan kick dikirim.');
      }
      if (cmd.name === 'sticker' || cmd.name === 's') {
        const output = await convert(sock, message, 'sticker', logger);
        await sock.sendMessage(chat, { sticker: output }, { quoted: message });
        return;
      }
      if (cmd.name === 'toimg') {
        const output = await convert(sock, message, 'image', logger);
        await sock.sendMessage(chat, { image: output, caption: 'Selesai.' }, { quoted: message });
      }
    } catch (err) {
      logger.warn({ error: err?.message || 'unknown', command: cmd?.name }, 'Command failed');
      await reply(sock, message, 'Perintah gagal. Periksa izin, media, atau koneksi lalu coba lagi.').catch(() => {});
    }
  }
  return { handle };
}
module.exports = { createRouter };
