'use strict';
const { jid, isGroup, getText, getCommand, getSender, roleFromMeta, isInvite } = require('./util');
const { convertMedia } = require('./media');
const { GROUP_COMMANDS, handleGroup } = require('./features/groups');
const { TOOL_COMMANDS, handleTools } = require('./features/tools');
const { ECONOMY_COMMANDS, handleEconomy } = require('./features/economy');
const { GAME_COMMANDS, handleGames, GameHub } = require('./features/games');
const { NET_COMMANDS, handleNetwork } = require('./features/network');

function menu(config, section = 'menu') {
  const p = config.prefix;
  const parts = {
    umum: ['menu', 'ping', 'status', 'owner', 'waktu', 'runtime'],
    grup: ['groupinfo', 'welcome on|off', 'left on|off', 'antilink on|off', 'antiwame on|off',
      'tagall [pesan]', 'hidetag [pesan]', 'kick @user', 'add 62xxx', 'promote @user',
      'demote @user', 'open', 'close', 'linkgc', 'revoke', 'setnamegc <nama>', 'setdesc <deskripsi>'],
    media: ['sticker', 's', 'toimg'],
    tools: ['say <teks>', 'reverse <teks>', 'count <teks>', 'calc <rumus>',
      'pilih a | b | c', 'roll [maks]', 'coin', 'password [8-64]'],
    game: ['tictactoe @user', 'tttmove 1-9', 'delttt', 'tebakangka', 'jawab <angka>', 'nyerah'],
    ekonomi: ['daily', 'balance', 'limit', 'buylimit', 'transfer 62xxx <koin>',
      'topglobal', 'toplocal', 'cekpremium', 'listpremium'],
    internet: ['github owner/repo', 'gitclone owner/repo', 'wiki <topik>', 'cuaca <kota>'],
    owner: ['mode public|private', 'self', 'public', 'addpremium 62xxx <hari>', 'delpremium 62xxx']
  };
  const names = {
    umum: 'UMUM', grup: 'GRUP', media: 'MEDIA', tools: 'TOOLS',
    game: 'GAME', ekonomi: 'EKONOMI', internet: 'INTERNET', owner: 'OWNER'
  };
  const aliases = {
    menu: 'all', help: 'all', allmenu: 'all',
    menugroup: 'grup', menugrup: 'grup', menumedia: 'media',
    menutools: 'tools', menugame: 'game', menuekonomi: 'ekonomi',
    menudownload: 'internet', menuowner: 'owner'
  };
  const target = aliases[section] || section;
  const keys = target === 'all' ? Object.keys(parts) : [target];
  return '*' + config.name + ' — Full Features*\n' +
    'Owner: ' + config.ownerName + ' | IG: @' + config.ownerInstagram +
    '\n' + keys.filter(k => parts[k]).map(k =>
      '\n*' + names[k] + '*\n' + parts[k].map(x => p + x).join('\n')).join('\n') +
    '\n\nFitur API berbayar/RPG/legacy lain masih tahap migrasi.';
}
function waMeLink(text) { return /(?:https?:\/\/)?(?:wa\.me\/\d{7,15}|api\.whatsapp\.com\/send\?phone=\d{7,15})/i.test(text); }
function createRouter(config, store, logger, {
  now = () => Date.now(), convert = convertMedia, economy = null, games = new GameHub(now), fetcher = globalThis.fetch
} = {}) {
  const recent = new Map();
  async function handle(sock, message) {
    const chat = message?.key?.remoteJid;
    if (!chat || message.key.fromMe || chat === 'status@broadcast' || !message.message) return;
    const sender = getSender(message);
    const owner = [sender, message.key.participantPn, message.key.remoteJidAlt].some(p => jid(p) === config.ownerJid);
    const text = getText(message);
    if (!text || (store.mode === 'private' && !owner)) return;
    const group = isGroup(chat);
    const cmd = getCommand(text, config.prefix);
    const settings = group ? store.group(chat) : {};
    const linkViolation = (settings.antilink && isInvite(text)) || (settings.antiwame && waMeLink(text));
    if (!cmd && !linkViolation) return;
    const reply = (body) => sock.sendMessage(chat, { text: String(body).slice(0, 3800) }, { quoted: message });
    let rolePromise;
    const roles = async () => {
      if (!group) return { senderAdmin: false, botAdmin: false, metadata: null };
      if (!rolePromise) rolePromise = sock.groupMetadata(chat).then(metadata =>
        ({ ...roleFromMeta(metadata, sender, sock.user?.id), metadata }));
      return rolePromise;
    };
    const ctx = { config, store, logger, sock, message, sender, owner, text, cmd, chat, group, reply, roles, economy, games, fetcher };
    try {
      if (group && linkViolation) {
        const role = await roles();
        if (!owner && !role.senderAdmin && role.botAdmin) {
          await sock.sendMessage(chat, { delete: message.key });
          if (!cmd) return;
        }
      }
      if (!cmd) return;
      const prev = recent.get(sender) || 0;
      const current = now();
      if (!owner && current - prev < 1800) return;
      recent.set(sender, current);
      if (recent.size > 4000) recent.clear();
      if (['menu','help','allmenu','menugroup','menugrup','menumedia',
        'menutools','menugame','menuekonomi','menudownload','menuowner'].includes(cmd.name)) {
        return reply(menu(config, cmd.name));
      }
      if (cmd.name === 'ping') return reply('Pong! ' + config.name);
      if (cmd.name === 'status' || cmd.name === 'infobot') {
        return reply('Bot: ' + config.name + '\nMode: ' + store.mode +
          '\nUptime: ' + Math.floor(process.uptime()) + ' detik' +
          '\nOwner: ' + config.ownerName);
      }
      if (cmd.name === 'owner') return reply('Owner: ' + config.ownerName +
        '\nWhatsApp: https://wa.me/' + config.ownerNumber +
        '\nInstagram: https://instagram.com/' + config.ownerInstagram);
      if (['mode', 'self', 'public'].includes(cmd.name)) {
        if (!owner) return reply('Khusus owner.');
        const choice = cmd.name === 'self' ? 'private' : cmd.name === 'public' ? 'public' : cmd.args[0]?.toLowerCase();
        if (!['public', 'private'].includes(choice)) return reply('Contoh: ' + config.prefix + 'mode private');
        await store.setMode(choice);
        return reply('Mode berhasil diatur: ' + choice);
      }
      if (GROUP_COMMANDS.has(cmd.name) && await handleGroup(ctx)) return;
      if (TOOL_COMMANDS.has(cmd.name) && await handleTools(ctx)) return;
      if (ECONOMY_COMMANDS.has(cmd.name) && await handleEconomy(ctx)) return;
      if (GAME_COMMANDS.has(cmd.name) && await handleGames(ctx)) return;
      if (NET_COMMANDS.has(cmd.name) && await handleNetwork(ctx)) return;
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
      await reply('Perintah gagal: ' + String(err?.message || 'cek izin atau koneksi').slice(0, 140)).catch(() => {});
    }
  }
  return { handle };
}
module.exports = { createRouter, menu };
