'use strict';
const { jid, isGroup, getText, getCommand, getSender, roleFromMeta, isInvite } = require('./util');
const { convertMedia } = require('./media');
const { textSticker, memeSticker } = require('./features/sticker-tools');
const { GROUP_COMMANDS, handleGroup } = require('./features/groups');
const { TOOL_COMMANDS, handleTools } = require('./features/tools');
const { ECONOMY_COMMANDS, handleEconomy } = require('./features/economy');
const { GAME_COMMANDS, handleGames, GameHub } = require('./features/games');
const { NET_COMMANDS, handleNetwork } = require('./features/network');
const { RPG_COMMANDS, handleRpg, RpgService } = require('./features/rpg');
const { Away } = require('./features/afk');
const { CATALOG_COMMANDS, handleCatalog } = require('./features/catalog');
const { menu } = require('./menu');
const { tr } = require('./i18n');
const JADIBOT_COMMANDS = new Set(['jadibot','subbot','cekjadibot','statusjadibot','stopjadibot','listjadibot']);

const MENU_COMMANDS = new Set([
  'menu','help','allmenu','menugroup','menugrup','menumedia','menutools',
  'menugame','menurpg','menuekonomi','menudownload','menupremium','menuowner',
  'menustore','menutoko','menubahasa'
]);
const BASE_COMMANDS = new Set(['ping','status','infobot','owner','mode','self','public','afk',
  'sticker','s','toimg','ttp','smeme','bahasa','language','lang','listbahasa','languages','listlanguages']);
const ALL_COMMANDS = new Set([
  ...MENU_COMMANDS, ...BASE_COMMANDS, ...GROUP_COMMANDS, ...TOOL_COMMANDS,
  ...ECONOMY_COMMANDS, ...GAME_COMMANDS, ...RPG_COMMANDS, ...NET_COMMANDS,
  ...JADIBOT_COMMANDS, ...CATALOG_COMMANDS
]);

function waMeLink(text) { return /(?:https?:\/\/)?(?:wa\.me\/\d{7,15}|api\.whatsapp\.com\/send\?phone=\d{7,15})/i.test(text); }
function createRouter(config, store, logger, {
  now = () => Date.now(), convert = convertMedia, economy = null, games = new GameHub(now), rpg = null, afk = new Away(now), subbot = null, catalog = null, fetcher = globalThis.fetch
} = {}) {
  const recent = new Map();
  async function handle(sock, message) {
    const chat = message?.key?.remoteJid;
    if (!chat || message.key.fromMe || chat === 'status@broadcast' || !message.message) return;
    const sender = getSender(message);
    const phoneAlias = [message.key.participantPn, message.key.remoteJidAlt]
      .map(jid).find(p => p.endsWith('@s.whatsapp.net'));
    const accountSender = phoneAlias || sender;
    const lang = store.language?.(accountSender) || 'id';
    const t = (key, vars) => tr(lang, key, vars);
    const owner = [sender, message.key.participantPn, message.key.remoteJidAlt].some(p => jid(p) === config.ownerJid);
    const text = getText(message);
    if (!text || (store.mode === 'private' && !owner)) return;
    const group = isGroup(chat);
    const cmd = getCommand(text, config.prefix, ALL_COMMANDS);
    const settings = group ? store.group(chat) : {};
    const linkViolation = (settings.antilink && isInvite(text)) || (settings.antiwame && waMeLink(text));
    if (cmd?.name !== 'afk') {
      const notice = afk.activity(sender, message, lang);
      if (notice) await sock.sendMessage(chat, { text: notice }).catch(() => {});
    }
    if (!cmd && !linkViolation) return;
    const reply = (body) => sock.sendMessage(chat, { text: String(body).slice(0, 3800) }, { quoted: message });
    let rolePromise;
    const roles = async () => {
      if (!group) return { senderAdmin: false, botAdmin: false, metadata: null };
      if (!rolePromise) rolePromise = sock.groupMetadata(chat).then(metadata =>
        ({ ...roleFromMeta(metadata, sender, sock.user?.id), metadata }));
      return rolePromise;
    };
    const ctx = { config, store, logger, sock, message, sender, accountSender, owner, text, cmd, chat, group, reply, roles, economy, games, rpg, afk, subbot, catalog, fetcher, lang, t };
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
      if (['bahasa','language','lang','listbahasa','languages','listlanguages'].includes(cmd.name)) {
        if (['listbahasa','languages','listlanguages'].includes(cmd.name))
          return reply(t('languageList'));
        const requested = cmd.args[0]?.toLowerCase();
        if (!['id', 'en'].includes(requested)) return reply(t('languageUsage'));
        if (!store.setLanguage) return reply(t('languageUsage'));
        await store.setLanguage(accountSender, requested);
        return reply(tr(requested, 'languageSaved', {language: requested === 'en' ? 'English' : 'Bahasa Indonesia'}));
      }
      if (MENU_COMMANDS.has(cmd.name)) {
        const temporary = ['id','en'].includes(cmd.args[0]?.toLowerCase()) ? cmd.args[0].toLowerCase() : lang;
        const info = economy?.get?.(accountSender) || {};
        return reply(menu(config, cmd.name, {
          lang: temporary, owner, premium: owner || info.premium === true,
          balance: info.balance
        }));
      }
      if (cmd.name === 'ping') return reply('Pong! ' + config.name);
      if (cmd.name === 'status' || cmd.name === 'infobot') {
        return reply(t('status', { name: config.name, mode: store.mode,
          uptime: Math.floor(process.uptime()), owner: config.ownerName }));
      }
      if (cmd.name === 'owner') return reply('Owner: ' + config.ownerName +
        '\nWhatsApp: https://wa.me/' + config.ownerNumber +
        '\nInstagram: https://instagram.com/' + config.ownerInstagram);
      if (['mode', 'self', 'public'].includes(cmd.name)) {
        if (!owner) return reply(t('ownerOnly'));
        const choice = cmd.name === 'self' ? 'private' : cmd.name === 'public' ? 'public' : cmd.args[0]?.toLowerCase();
        if (!['public', 'private'].includes(choice)) return reply(t('modeUsage'));
        await store.setMode(choice);
        return reply(t('ownerMode', {mode: choice}));
      }
      if (JADIBOT_COMMANDS.has(cmd.name)) {
        if (!subbot) return reply(t('noSubbot'));
        if (group) return reply(t('subbotPrivate'));
        if (['cekjadibot','statusjadibot','listjadibot'].includes(cmd.name))
          return reply(subbot.describe(accountSender, owner));
        if (cmd.name === 'stopjadibot') return reply(await subbot.stop(accountSender, owner));
        const method = cmd.args[0]?.toLowerCase() === 'qr' ? 'qr' : 'pairing';
        return reply(await subbot.start(accountSender, method === 'qr' ? undefined : cmd.args[0], sock.user?.id, method));
      }
      if (cmd.name === 'afk') return reply(afk.set(sender, cmd.args.join(' '), lang));
      if (GROUP_COMMANDS.has(cmd.name) && await handleGroup(ctx)) return;
      if (CATALOG_COMMANDS.has(cmd.name) && await handleCatalog(ctx)) return;
      if (TOOL_COMMANDS.has(cmd.name) && await handleTools(ctx)) return;
      if (ECONOMY_COMMANDS.has(cmd.name) && await handleEconomy(ctx)) return;
      if (GAME_COMMANDS.has(cmd.name) && await handleGames(ctx)) return;
      if (RPG_COMMANDS.has(cmd.name) && await handleRpg(ctx)) return;
      if (NET_COMMANDS.has(cmd.name) && await handleNetwork(ctx)) return;
      if (cmd.name === 'ttp') {
        const sticker = await textSticker(cmd.args.join(' '));
        await sock.sendMessage(chat, { sticker }, { quoted: message });
        return;
      }
      if (cmd.name === 'smeme') {
        const sticker = await memeSticker(sock, message, cmd.args.join(' '), logger);
        await sock.sendMessage(chat, { sticker }, { quoted: message });
        return;
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
      await reply(t('processingError', {error: String(err?.message || 'connection/permission').slice(0, 140)})).catch(() => {});
    }
  }
  return { handle };
}
module.exports = { createRouter, menu, ALL_COMMANDS };
