'use strict';
const { jid, isGroup } = require('../util');

const GROUP_COMMANDS = new Set([
  'groupinfo','welcome','left','goodbye','antilink','antiwame','kick','add',
  'promote','demote','tagall','hidetag','linkgc','revoke','open','close','setnamegc','setdesc',
  'setwelcome','setleft','changewelcome','changeleft','delsetwelcome','delsetleft',
  'setproses','setdone','changeproses','changedone','delsetproses','delsetdone','proses','done'
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
  const { cmd, chat, sock, message, config, store, reply, roles, t } = ctx;
  if (!GROUP_COMMANDS.has(cmd.name)) return false;
  if (!isGroup(chat)) { await reply(t('groupOnly')); return true; }
  const role = await roles();
  const participants = role.metadata?.participants || [];
  if (cmd.name === 'groupinfo') {
    const state = store.group(chat);
    await reply(t('groupName') + ': ' + String(role.metadata?.subject || chat).slice(0, 100) +
      '\n' + t('groupMembers') + ': ' + participants.length +
      '\nWelcome: ' + (state.welcome ? 'on' : 'off') +
      '\nGoodbye: ' + (state.goodbye ? 'on' : 'off') +
      '\nAntilink: ' + (state.antilink ? 'on' : 'off') +
      '\nAntiwa.me: ' + (state.antiwame ? 'on' : 'off'));
    return true;
  }
  if (!isAdminRole(role, ctx)) { await reply(t('groupAdminOnly')); return true; }
  const flag = cmd.args[0]?.toLowerCase();
  if (['welcome', 'left', 'goodbye', 'antilink', 'antiwame'].includes(cmd.name)) {
    if (!['on', 'off'].includes(flag)) { await reply(t('onOff')); return true; }
    const key = ['left', 'goodbye'].includes(cmd.name) ? 'goodbye' : cmd.name;
    await store.setGroupFlag(chat, key, flag === 'on');
    await reply(key + ': ' + flag);
    return true;
  }
  if (['setwelcome','setleft','changewelcome','changeleft','delsetwelcome','delsetleft'].includes(cmd.name)) {
    const field = cmd.name.endsWith('welcome') ? 'welcomeText' : 'goodbyeText';
    const deleting = cmd.name.startsWith('del');
    const body = deleting ? '' : cmd.args.join(' ').trim();
    if (!deleting && (!body || body.length > 300)) {
      await reply(t('invalidGroupText'));
      return true;
    }
    await store.setGroupText(chat, field, body);
    await reply(t(deleting ? 'groupTextReset' : 'groupTextSaved'));
    return true;
  }
  if (['setproses','setdone','changeproses','changedone','delsetproses','delsetdone'].includes(cmd.name)) {
    const field = cmd.name.includes('proses') ? 'processText' : 'doneText';
    const clear = cmd.name.startsWith('del');
    const value = clear ? '' : cmd.args.join(' ').trim();
    if (!clear && (!value || value.length > 300)) {
      await reply(t('workflowUsage', {command: cmd.name}));
      return true;
    }
    await store.setGroupText(chat, field, value);
    await reply(t(clear ? 'workflowRemoved' : 'workflowSaved'));
    return true;
  }
  if (cmd.name === 'proses' || cmd.name === 'done') {
    const original = message.message?.extendedTextMessage?.contextInfo;
    const quoted = original?.quotedMessage;
    if (!quoted || !original?.stanzaId) {
      await reply(t('workflowReplyFirst'));
      return true;
    }
    const order = String(quoted.conversation || quoted.extendedTextMessage?.text ||
      quoted.imageMessage?.caption || quoted.videoMessage?.caption || '').trim();
    if (!order) { await reply(t('workflowNoText')); return true; }
    const meta = store.group(chat);
    const template = cmd.name === 'proses'
      ? (meta.processText || (ctx.lang === 'en' ? '⏳ Processing order:\n{order}' : '⏳ Pesanan diproses:\n{order}'))
      : (meta.doneText || (ctx.lang === 'en' ? '✅ Order complete:\n{order}' : '✅ Pesanan selesai:\n{order}'));
    const mentioned = original.participant ? [jid(original.participant)] : [];
    const final = template.replace(/\{order\}/gi, order.slice(0, 550))
      .replace(/\{user\}/gi, mentioned.length ? '@' + mentioned[0].split('@')[0] : (ctx.lang === 'en' ? 'customer' : 'pelanggan'))
      .replace(/\{group\}/gi, String(role.metadata?.subject || 'group').slice(0, 100));
    await sock.sendMessage(chat, { text: final.slice(0, 1100), mentions: mentioned }, { quoted: message });
    return true;
  }
  if (cmd.name === 'tagall' || cmd.name === 'hidetag') {
    if (participants.length > 250) { await reply(t('groupLarge')); return true; }
    const targets = [...new Set(participants.map(p => p.id).filter(Boolean))];
    const body = cmd.args.join(' ').slice(0, 500);
    const text = cmd.name === 'tagall'
      ? (body || t('groupCall')) + '\n' + targets.map(t => '@' + t.split('@')[0]).join(' ')
      : (body || t('groupMessage'));
    await sock.sendMessage(chat, { text: text.slice(0, 3500), mentions: targets });
    return true;
  }
  if (!role.botAdmin) { await reply(t('botAdminNeeded')); return true; }
  if (['kick', 'promote', 'demote', 'add'].includes(cmd.name)) {
    const target = targetFromArgs(message, cmd);
    if (!target || !target.includes('@')) { await reply(t('groupTarget')); return true; }
    if (identityProtected(target, config, sock)) { await reply(t('groupProtected')); return true; }
    const action = { kick: 'remove', add: 'add', promote: 'promote', demote: 'demote' }[cmd.name];
    await sock.groupParticipantsUpdate(chat, [target], action);
    await reply(t('groupAction',{action:cmd.name}));
    return true;
  }
  if (cmd.name === 'open' || cmd.name === 'close') {
    await sock.groupSettingUpdate(chat, cmd.name === 'open' ? 'not_announcement' : 'announcement');
    await reply(t('groupOpened',{action:cmd.name}));
    return true;
  }
  if (cmd.name === 'setnamegc' || cmd.name === 'setdesc') {
    const value = cmd.args.join(' ').trim();
    if (!value || value.length > (cmd.name === 'setnamegc' ? 100 : 500)) {
      await reply(t('groupTextUsage',{action:cmd.name,max:cmd.name === 'setnamegc' ? 100 : 500}));
      return true;
    }
    if (cmd.name === 'setnamegc') await sock.groupUpdateSubject(chat, value);
    else await sock.groupUpdateDescription(chat, value);
    await reply(t('groupUpdated'));
    return true;
  }
  if (cmd.name === 'linkgc') {
    const code = await sock.groupInviteCode(chat);
    await reply(t('invite',{url:'https://chat.whatsapp.com/'+code}));
    return true;
  }
  if (cmd.name === 'revoke') {
    const code = await sock.groupRevokeInvite(chat);
    await reply(t('inviteReset',{url:'https://chat.whatsapp.com/'+code}));
    return true;
  }
  return false;
}
module.exports = { GROUP_COMMANDS, ADMIN_COMMANDS, handleGroup, mentioned, targetFromArgs };
