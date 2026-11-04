'use strict';
const { jid, isGroup, getText, getCommand, getSender, roleFromMeta, isInvite } = require('./util');
const { convertMedia } = require('./media');
const { SCIENCE_COMMANDS, handleScience } = require('./features/advanced-science');
const { ACADEMIC_COMMANDS, handleAcademic } = require('./features/academic');
const { AI_COMMANDS, handleAI } = require('./features/ai-google');
const { STATS_COMMANDS, handleStats } = require('./features/advanced-inference');
const { BROADCAST_COMMANDS, handleBroadcast } = require('./features/consent-broadcast');
const { STUDY_COMMANDS, handleStudy } = require('./features/study-tools');
const { UTIL_COMMANDS, handleUtility } = require('./features/developer-tools');
const { WEB_COMMANDS, handleWeb } = require('./features/web-extras');
const { textSticker, memeSticker } = require('./features/sticker-tools');
const { GROUP_COMMANDS, handleGroup } = require('./features/groups');
const { TOOL_COMMANDS, handleTools } = require('./features/tools');
const { ECONOMY_COMMANDS, handleEconomy } = require('./features/economy');
const { GAME_COMMANDS, handleGames, GameHub } = require('./features/games');
const { NET_COMMANDS, handleNetwork } = require('./features/network');
const { RPG_COMMANDS, handleRpg, RpgService } = require('./features/rpg');
const { Away } = require('./features/afk');
const { CATALOG_COMMANDS, handleCatalog } = require('./features/catalog');
const { menu, ALIASES } = require('./menu');
const { tr } = require('./i18n');
const { IMAGE_COMMANDS, handleImage } = require('./features/image-studio');
const { MEDIA_COMMANDS, handleTranscode } = require('./features/transcode');
const { STICKERWM_COMMANDS, handleStickerWm } = require('./features/stickerwm');
const { RENTAL_COMMANDS, handleRental } = require('./features/rental');
const { sendPayment } = require('./features/payment');
const { BACKUP_COMMANDS, handleBackup } = require('./features/backup');
const { ANON_COMMANDS, AnonymousHub, handleAnonymous, relayAnonymous } = require('./features/anonymous');
const { TEXTFX_COMMANDS, handleTextFx } = require('./features/textfx');
const { LIB_COMMANDS, handleLibrary } = require('./features/media-library');
const { DOWNLOAD_COMMANDS, handleDownload } = require('./features/downloaders');
const { SAVEAPI_COMMANDS, handleSaveAPI } = require('./features/saveapi-account');
const { LITURGIA_COMMANDS, handleLiturgia } = require('./features/liturgia');
const { HEALTH_COMMANDS, handleHealth } = require('./features/bot-health');
const { PROFILE_COMMANDS, handleProfile } = require('./features/profile');
const { LEGACY_UTILITY_COMMANDS, handleLegacyUtilities } = require('./features/legacy-utilities');
const { OWNER_AUTOMATION_COMMANDS, handleOwnerAutomation, autoRespondText } = require('./features/owner-automation');
const { MOD_COMMANDS, SpamDetector, inspectModeration, handleModeration } = require('./features/moderation');
const { COMMANDS: STATLAB_COMMANDS, handle: handleSTATLAB } = require('./features/statistics-lab');
const { COMMANDS: BIBLEPAR_COMMANDS, handle: handleBIBLEPAR } = require('./features/bible-parallel');
const { COMMANDS: SCHOLAR_COMMANDS, handle: handleSCHOLAR } = require('./features/liturgia-scholar');
const { COMMANDS: DOCAN_COMMANDS, handle: handleDOCAN } = require('./features/document-analyzer');
const { COMMANDS: RESILIENCE_COMMANDS, handle: handleRESILIENCE } = require('./features/resilience-manager');
const { COMMANDS: ANTIRAID_COMMANDS, handle: handleANTIRAID } = require('./features/smart-group-security');
const { COMMANDS: ENGAGEMENT_COMMANDS, handle: handleEngagement, observeGroup, inspectToxic } = require('./features/engagement-ai');
const JADIBOT_COMMANDS = new Set(['jadibot','subbot','cekjadibot','statusjadibot','stopjadibot','listjadibot']);

const MENU_COMMANDS = new Set(Object.keys(ALIASES));
const BASE_COMMANDS = new Set(['ping','status','infobot','owner','mode','self','public','afk',
  'sticker','s','toimg','ttp','smeme','react','setcmd','delcmd','source','script','sc','credits','thanks','donate','paymethod','dashboard','bahasa','language','lang','listbahasa','languages','listlanguages']);
const ALL_COMMANDS = new Set([
  ...MENU_COMMANDS, ...BASE_COMMANDS, ...GROUP_COMMANDS, ...TOOL_COMMANDS, ...SCIENCE_COMMANDS, ...ACADEMIC_COMMANDS, ...AI_COMMANDS, ...STATS_COMMANDS, ...BROADCAST_COMMANDS, ...STUDY_COMMANDS, ...UTIL_COMMANDS, ...WEB_COMMANDS,
  ...ECONOMY_COMMANDS, ...GAME_COMMANDS, ...RPG_COMMANDS, ...NET_COMMANDS,
  ...JADIBOT_COMMANDS, ...CATALOG_COMMANDS, ...MOD_COMMANDS, ...IMAGE_COMMANDS,
  ...MEDIA_COMMANDS, ...STICKERWM_COMMANDS, ...RENTAL_COMMANDS, ...BACKUP_COMMANDS, ...ANON_COMMANDS, ...TEXTFX_COMMANDS, ...LIB_COMMANDS, ...DOWNLOAD_COMMANDS, ...SAVEAPI_COMMANDS, ...LITURGIA_COMMANDS, ...STATLAB_COMMANDS, ...BIBLEPAR_COMMANDS, ...SCHOLAR_COMMANDS, ...DOCAN_COMMANDS, ...RESILIENCE_COMMANDS, ...ANTIRAID_COMMANDS, ...HEALTH_COMMANDS, ...ENGAGEMENT_COMMANDS, ...PROFILE_COMMANDS, ...LEGACY_UTILITY_COMMANDS, ...OWNER_AUTOMATION_COMMANDS
]);

function waMeLink(text) { return /(?:https?:\/\/)?(?:wa\.me\/\d{7,15}|api\.whatsapp\.com\/send\?phone=\d{7,15})/i.test(text); }
function createRouter(config, store, logger, {
  now = () => Date.now(), convert = convertMedia, economy = null, games = new GameHub(now), rpg = null, afk = new Away(now), subbot = null, catalog = null, moderation = null, rentals = null, backup = null, anonymous = new AnonymousHub(now), library = null, ownerPreferences = null, connected = () => false, spamDetector = new SpamDetector(now), fetcher = globalThis.fetch
} = {}) {
  const recent = new Map();
  const autoReplyRecent = new Map();
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
    if (ownerPreferences?.get().autoread && typeof sock.readMessages === 'function') {
      await sock.readMessages([message.key]).catch(err =>
        logger.warn?.({error:err.message},'Auto-read failed'));
    }
    const voiceOnly = Boolean(message.message?.audioMessage);
    const text = getText(message) || (voiceOnly ? config.prefix + 'tanyavoice' : '');
    if (!text || (store.mode === 'private' && !owner)) return;
    const group = isGroup(chat);
    const cmd = getCommand(text, config.prefix, ALL_COMMANDS);
    if (isGroup(chat) && !cmd) observeGroup(chat, accountSender, text);
    const settings = group ? store.group(chat) : {};
    const linkViolation = (settings.antilink && isInvite(text)) || (settings.antiwame && waMeLink(text));
    if (cmd?.name !== 'afk') {
      const notice = afk.activity(sender, message, lang);
      if (notice) await sock.sendMessage(chat, { text: notice }).catch(() => {});
    }
    if (!group && anonymous && !ANON_COMMANDS.has(cmd?.name) && anonymous.partner(chat)) {
      const anonymousReply = body => sock.sendMessage(chat,{text:body},{quoted:message});
      await relayAnonymous({anonymous,chat,text,sock,lang,reply:anonymousReply});
      return;
    }
    if (!group && !owner && !cmd && chat.endsWith('@s.whatsapp.net') &&
        ownerPreferences?.get().autorespond) {
      const time=now();
      if(!autoReplyRecent.has(chat)||time-autoReplyRecent.get(chat)>=6*60*60*1000) {
        autoReplyRecent.set(chat,time);
        if(autoReplyRecent.size>3000)autoReplyRecent.clear();
        await sock.sendMessage(chat,{text:autoRespondText(lang,config.name)}).catch(err=>
          logger.warn?.({error:err.message},'Auto-response failed'));
      }
    }
    if (!cmd && !linkViolation && (!group || !moderation ||
      !(moderation.get(chat).antispam || Object.keys(moderation.get(chat).responses).length))) return;
    const reply = (body) => sock.sendMessage(chat, { text: String(body).slice(0, 3800) }, { quoted: message });
    const replyCatalog = async (body) => {
      const lines = String(body).split('\n');
      const chunks = [];
      let current = '';
      for (const line of lines) {
        const next = current ? current + '\n' + line : line;
        if (next.length > 3400 && current) {
          chunks.push(current);
          current = line;
        } else current = next;
      }
      if (current) chunks.push(current);
      for (let i = 0; i < chunks.length; i++) {
        await sock.sendMessage(chat, { text: chunks.length > 1
          ? '*Beauté • Katalog (' + (i + 1) + '/' + chunks.length + ')*\n' + chunks[i]
          : chunks[i] }, { quoted: message });
      }
    };
    let rolePromise;
    const roles = async () => {
      if (!group) return { senderAdmin: false, botAdmin: false, metadata: null };
      if (!rolePromise) rolePromise = sock.groupMetadata(chat).then(metadata =>
        ({ ...roleFromMeta(metadata, sender, sock.user?.id), metadata }));
      return rolePromise;
    };
    const ctx = { config, store, logger, sock, message, sender, accountSender, owner, text, cmd, chat, group, reply, roles, economy, games, rpg, afk, subbot, catalog, moderation, rentals, backup, anonymous, library, ownerPreferences, connected, fetcher, lang, t };
    try {
      if (group && linkViolation) {
        const role = await roles();
        if (!owner && !role.senderAdmin && role.botAdmin) {
          await sock.sendMessage(chat, { delete: message.key });
          if (!cmd) return;
        }
      }
      if (await inspectModeration(ctx, spamDetector)) return;
      if (group && !cmd && await inspectToxic(ctx)) return;
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
        return replyCatalog(menu(config, cmd.name, {
          lang: temporary, owner, premium: owner || info.premium === true,
          balance: info.balance, commandGroups: [{ id: 'registry', title: 'REGISTERED', commands: Array.from(ALL_COMMANDS) }]
        }));
      }
      if (cmd.name === 'ping') return reply('Pong! ' + config.name);
      if (cmd.name === 'status' || cmd.name === 'infobot') {
        return reply(t('status', { name: config.name, mode: store.mode,
          uptime: Math.floor(process.uptime()), owner: config.ownerName }));
      }
      if (['source','script','sc'].includes(cmd.name)) {
        return reply(t('scriptLink'));
      }
      if (['credits','thanks'].includes(cmd.name)) {
        return reply(t('credits', {name: config.ownerName, instagram: config.ownerInstagram}));
      }
      if (cmd.name === 'donate') return reply(
        (lang === 'en' ? 'For donation information, contact the owner: ' :
          'Untuk informasi donasi, hubungi owner: ') +
          'https://wa.me/' + config.ownerNumber +
          '\n' + (lang === 'en' ? 'No payment account is configured.' :
            'Belum ada rekening pembayaran yang dikonfigurasi.')
      );
      if (cmd.name === 'dashboard') {
        if (!owner || group) return reply(lang === 'en' ?
          'Owner dashboard is only available in a private chat.' :
          'Dashboard owner hanya bisa dibuka lewat chat pribadi.');
        return reply('✦ ' + config.name + ' Dashboard' +
          '\nMode: ' + store.mode +
          '\nUptime: ' + Math.floor(process.uptime()) + 's' +
          '\nUsers: ' + Object.keys(economy?.state?.users || {}).length +
          '\nJadibot: ' + (subbot?.slot?.status || 'offline') +
          '\nCommands loaded: ' + ALL_COMMANDS.size);
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
      if (MOD_COMMANDS.has(cmd.name) && await handleModeration(ctx)) return;
      if (cmd.name === 'paymethod') { await sendPayment(ctx); return; }
      if (RENTAL_COMMANDS.has(cmd.name) && await handleRental(ctx)) return;
      if (BACKUP_COMMANDS.has(cmd.name) && await handleBackup(ctx)) return;
      if (ANON_COMMANDS.has(cmd.name) && await handleAnonymous(ctx)) return;
      if (TEXTFX_COMMANDS.has(cmd.name) && await handleTextFx(ctx)) return;
      if (LIB_COMMANDS.has(cmd.name) && await handleLibrary(ctx)) return;
      if (SAVEAPI_COMMANDS.has(cmd.name) && await handleSaveAPI(ctx)) return;
      if (LITURGIA_COMMANDS.has(cmd.name) && await handleLiturgia(ctx)) return;
      if (HEALTH_COMMANDS.has(cmd.name) && await handleHealth(ctx)) return;
      if (ENGAGEMENT_COMMANDS.has(cmd.name) && await handleEngagement(ctx)) return;
      if (STATLAB_COMMANDS.has(cmd.name) && await handleSTATLAB(ctx)) return;
      if (BIBLEPAR_COMMANDS.has(cmd.name) && await handleBIBLEPAR(ctx)) return;
      if (SCHOLAR_COMMANDS.has(cmd.name) && await handleSCHOLAR(ctx)) return;
      if (DOCAN_COMMANDS.has(cmd.name) && await handleDOCAN(ctx)) return;
      if (RESILIENCE_COMMANDS.has(cmd.name) && await handleRESILIENCE(ctx)) return;
      if (ANTIRAID_COMMANDS.has(cmd.name) && await handleANTIRAID(ctx)) return;
      if (DOWNLOAD_COMMANDS.has(cmd.name) && await handleDownload(ctx)) return;
      if (PROFILE_COMMANDS.has(cmd.name) && await handleProfile(ctx)) return;
      if (OWNER_AUTOMATION_COMMANDS.has(cmd.name) && await handleOwnerAutomation(ctx)) return;
      if (['setcmd','delcmd'].includes(cmd.name)) {
        const key=(cmd.args[0]||'').toLowerCase();
        if (ALL_COMMANDS.has(key)) return reply(lang==='en'?
          'Cannot override a built-in command.':'Tidak bisa mengganti command bawaan.');
        const alias=cmd.name==='setcmd'?'addresponse':'delresponse';
        return handleModeration({...ctx,cmd:{...cmd,name:alias}});
      }
      if (LEGACY_UTILITY_COMMANDS.has(cmd.name) && await handleLegacyUtilities(ctx)) return;
      if (WEB_COMMANDS.has(cmd.name) && await handleWeb(ctx)) return;
      if (UTIL_COMMANDS.has(cmd.name) && await handleUtility(ctx)) return;
      if (STUDY_COMMANDS.has(cmd.name) && await handleStudy(ctx)) return;
      if (BROADCAST_COMMANDS.has(cmd.name) && await handleBroadcast(ctx)) return;
      if (STATS_COMMANDS.has(cmd.name) && await handleStats(ctx)) return;
      if (AI_COMMANDS.has(cmd.name) && await handleAI(ctx)) return;
      if (ACADEMIC_COMMANDS.has(cmd.name) && await handleAcademic(ctx)) return;
      if (SCIENCE_COMMANDS.has(cmd.name) && await handleScience(ctx)) return;
      if (TOOL_COMMANDS.has(cmd.name) && await handleTools(ctx)) return;
      if (ECONOMY_COMMANDS.has(cmd.name) && await handleEconomy(ctx)) return;
      if (GAME_COMMANDS.has(cmd.name) && await handleGames(ctx)) return;
      if (RPG_COMMANDS.has(cmd.name) && await handleRpg(ctx)) return;
      if (NET_COMMANDS.has(cmd.name) && await handleNetwork(ctx)) return;
      if (IMAGE_COMMANDS.has(cmd.name) && await handleImage(ctx)) return;
      if (MEDIA_COMMANDS.has(cmd.name) && await handleTranscode(ctx)) return;
      if (STICKERWM_COMMANDS.has(cmd.name) && await handleStickerWm(ctx)) return;
      if (cmd.name === 'react') {
        const emoji = cmd.args[0] || '';
        if (!emoji || [...emoji].length > 12 ||
            !/^[\p{Extended_Pictographic}\p{Emoji_Modifier}\u200d\ufe0f]+$/u.test(emoji)) {
          return reply(lang === 'en' ? 'Reply to a message with: react ❤️' : 'Balas pesan dengan: react ❤️');
        }
        const context = message.message?.extendedTextMessage?.contextInfo ||
          message.message?.imageMessage?.contextInfo || {};
        if (!context.stanzaId || typeof context.stanzaId !== 'string' ||
            context.stanzaId.length > 100) {
          return reply(lang === 'en' ? 'Reply to a message first.' : 'Balas pesan terlebih dahulu.');
        }
        const key = {remoteJid:chat, id:context.stanzaId,
          fromMe: jid(context.participant || '') === jid(sock.user?.id)};
        if (group && context.participant) key.participant = context.participant;
        await sock.sendMessage(chat, {react:{text:emoji,key}});
        return;
      }
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
