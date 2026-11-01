'use strict';
const { jid, isGroup } = require('../util');

const GROUP_COMMANDS = new Set([
  'groupinfo','welcome','left','goodbye','antilink','antiwame','kick','add',
  'promote','demote','tagall','hidetag','linkgc','revoke','open','close','setnamegc','setdesc',
  'setwelcome','setleft','delsetwelcome','delsetleft'
]);
const ADMIN_COMMANDS = new Set([...GROUP_COMMANDS].filter(x => x !== 'groupinfo'));

function mentioned(message) {
  const m = message.message || {};
  const context = m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || {};
  const first = (context.mentionedJid || [])[0] || context.participant;
  return jid(first || '');
}
function targetFromArgs(message, cmd) {
  const fromMention = mentioned(message);
  if (fromMention) return fromMention;
  if (cmd.name === 'add') {
    const number = cmd.args[0]?.replace(/^\+/, '');
    if (/^[1-9]\d{7,14}$/.test(number || '')) return number + '@s.whatsapp.net';
  }
  return '';
}
function identityProtected(target, config, sock) {
  return target === config.ownerJid || target === jid(sock.user?.id) ||
    target === jid(sock.user?.lid);
}
function isAdminRole(role, ctx) { return ctx.owner || role.senderAdmin; }

async function handleGroup(ctx) {
  const { cmd, chat, sock, message, config, store, reply, roles } = ctx;
  if (!GROUP_COMMANDS.has(cmd.name)) return false;
  if (!isGroup(chat)) { await reply('Perintah ini khusus grup.'); return true; }
  const role = await roles();
  const participants = role.metadata?.participants || [];
  if (cmd.name === 'groupinfo') {
    const state = store.group(chat);
    await reply('Grup: ' + String(role.metadata?.subject || chat).slice(0, 100) +
      '\nAnggota: ' + participants.length +
      '\nWelcome: ' + (state.welcome ? 'on' : 'off') +
      '\nGoodbye: ' + (state.goodbye ? 'on' : 'off') +
      '\nAntilink: ' + (state.antilink ? 'on' : 'off') +
      '\nAntiwa.me: ' + (state.antiwame ? 'on' : 'off'));
    return true;
  }
  if (!isAdminRole(role, ctx)) { await reply('Khusus admin grup.'); return true; }
  const flag = cmd.args[0]?.toLowerCase();
  if (['welcome', 'left', 'goodbye', 'antilink', 'antiwame'].includes(cmd.name)) {
    if (!['on', 'off'].includes(flag)) { await reply('Gunakan on atau off.'); return true; }
    const key = ['left', 'goodbye'].includes(cmd.name) ? 'goodbye' : cmd.name;
    await store.setGroupFlag(chat, key, flag === 'on');
    await reply(key + ': ' + flag);
    return true;
  }
  if (['setwelcome','setleft','delsetwelcome','delsetleft'].includes(cmd.name)) {
    const field = cmd.name.endsWith('welcome') ? 'welcomeText' : 'goodbyeText';
    const deleting = cmd.name.startsWith('del');
    const body = deleting ? '' : cmd.args.join(' ').trim();
    if (!deleting && (!body || body.length > 300)) {
      await reply('Contoh: setwelcome Halo {user}, selamat datang di {group} (maksimal 300 karakter).');
      return true;
    }
    await store.setGroupText(chat, field, body);
    await reply(deleting ? 'Pesan otomatis dikembalikan ke default.' : 'Pesan otomatis berhasil disimpan. Aktifkan welcome on / left on.');
    return true;
  }
  if (cmd.name === 'tagall' || cmd.name === 'hidetag') {
    if (participants.length > 250) { await reply('Grup terlalu besar untuk tag massal (maksimal 250).'); return true; }
    const targets = [...new Set(participants.map(p => p.id).filter(Boolean))];
    const body = cmd.args.join(' ').slice(0, 500);
    const text = cmd.name === 'tagall'
      ? (body || 'Panggilan anggota') + '\n' + targets.map(t => '@' + t.split('@')[0]).join(' ')
      : (body || 'Pesan untuk semua anggota');
    await sock.sendMessage(chat, { text: text.slice(0, 3500), mentions: targets });
    return true;
  }
  if (!role.botAdmin) { await reply('Jadikan bot admin grup untuk menjalankan perintah ini.'); return true; }
  if (['kick', 'promote', 'demote', 'add'].includes(cmd.name)) {
    const target = targetFromArgs(message, cmd);
    if (!target || !target.includes('@')) { await reply('Tag pengguna atau (khusus add) masukkan nomor internasional.'); return true; }
    if (identityProtected(target, config, sock)) { await reply('Tidak dapat mengubah status owner atau bot.'); return true; }
    const action = { kick: 'remove', add: 'add', promote: 'promote', demote: 'demote' }[cmd.name];
    await sock.groupParticipantsUpdate(chat, [target], action);
    await reply('Permintaan ' + cmd.name + ' dikirim.');
    return true;
  }
  if (cmd.name === 'open' || cmd.name === 'close') {
    await sock.groupSettingUpdate(chat, cmd.name === 'open' ? 'not_announcement' : 'announcement');
    await reply('Grup berhasil di-' + cmd.name + '.');
    return true;
  }
  if (cmd.name === 'setnamegc' || cmd.name === 'setdesc') {
    const value = cmd.args.join(' ').trim();
    if (!value || value.length > (cmd.name === 'setnamegc' ? 100 : 500)) {
      await reply('Isi ' + cmd.name + ' dengan teks maksimal ' + (cmd.name === 'setnamegc' ? 100 : 500) + ' karakter.');
      return true;
    }
    if (cmd.name === 'setnamegc') await sock.groupUpdateSubject(chat, value);
    else await sock.groupUpdateDescription(chat, value);
    await reply('Informasi grup diperbarui.');
    return true;
  }
  if (cmd.name === 'linkgc') {
    const code = await sock.groupInviteCode(chat);
    await reply('Link undangan: https://chat.whatsapp.com/' + code);
    return true;
  }
  if (cmd.name === 'revoke') {
    const code = await sock.groupRevokeInvite(chat);
    await reply('Link lama dibatalkan. Link baru: https://chat.whatsapp.com/' + code);
    return true;
  }
  return false;
}
module.exports = { GROUP_COMMANDS, ADMIN_COMMANDS, handleGroup, mentioned, targetFromArgs };
