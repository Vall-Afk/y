'use strict';

function jid(jidValue) {
  return typeof jidValue === 'string' ? jidValue.replace(/:\d+(?=@)/, '') : '';
}
function isGroup(chat) { return typeof chat === 'string' && chat.endsWith('@g.us'); }
function getText(message) {
  let m = message && message.message;
  for (let i = 0; i < 4 && m; i++) {
    if (m.ephemeralMessage) m = m.ephemeralMessage.message;
    else if (m.viewOnceMessage) m = m.viewOnceMessage.message;
    else if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
    else if (m.documentWithCaptionMessage) m = m.documentWithCaptionMessage.message;
    else break;
  }
  return String((m && (m.conversation || m.extendedTextMessage?.text ||
    m.imageMessage?.caption || m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId)) || '').trim();
}
function getCommand(text, prefix, knownCommands) {
  if (typeof text !== 'string' || text.length > 4000) return null;
  const trimmed = text.trim();
  const prefixed = trimmed.startsWith(prefix);
  // Bare commands are opt-in and matched by exact FIRST keyword only.
  // Ordinary WhatsApp messages must not be interpreted as bot commands.
  if (!prefixed && !(knownCommands instanceof Set)) return null;
  const body = (prefixed ? trimmed.slice(prefix.length) : trimmed).trim();
  const parts = body.split(/\s+/).filter(Boolean);
  if (!parts.length || !/^(?:[a-z][a-z0-9_-]{0,31}|[0-9][a-z0-9_-]{1,31})$/i.test(parts[0]) ||
      !/[a-z]/i.test(parts[0])) return null;
  const name = parts[0].toLowerCase();
  if (!prefixed && !knownCommands.has(name)) return null;
  return { name, args: parts.slice(1), prefixed };
}
function getSender(message) {
  return jid(message?.key?.participant || message?.key?.remoteJid || '');
}
function roleFromMeta(meta, sender, botJid) {
  const participants = Array.isArray(meta?.participants) ? meta.participants : [];
  const isAdmin = value => Boolean(participants.find(p =>
    [p.id, p.phoneNumber, p.lid].some(id => jid(id) === value) &&
    (p.admin === 'admin' || p.admin === 'superadmin')));
  return { senderAdmin: isAdmin(jid(sender)), botAdmin: isAdmin(jid(botJid)) };
}
function isInvite(text) { return /(?:https?:\/\/)?chat\.whatsapp\.com\/[a-z0-9]{15,}/i.test(text); }
module.exports = { jid, isGroup, getText, getCommand, getSender, roleFromMeta, isInvite };
