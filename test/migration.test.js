'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { Store } = require('../src/store');
const { createRouter } = require('../src/commands');
const { loadConfig } = require('../src/config');
const { textSticker, memeSticker, xmlSafe, splitText } = require('../src/features/sticker-tools');

test('custom welcome and left templates are stored safely', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'beaute-group-migration-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'settings.json');
  const store = new Store(file);
  await store.init();
  await store.setGroupFlag('12345@g.us', 'welcome', true);
  await store.setGroupText('12345@g.us', 'welcomeText', 'Selamat datang, {user}, di {group}');
  await store.setGroupText('12345@g.us', 'goodbyeText', 'Sampai jumpa, {user}');
  assert.match(store.group('12345@g.us').welcomeText, /{group}/);
  await assert.rejects(store.setGroupText('12345@g.us', 'welcomeText', 'x'.repeat(301)), /300/);
  const reload = new Store(file);
  await reload.init();
  assert.equal(reload.group('12345@g.us').welcome, true);
  assert.equal(reload.group('12345@g.us').goodbyeText, 'Sampai jumpa, {user}');
});
test('admin can set welcome text using bare keywords, ordinary user cannot', async () => {
  const cfg = loadConfig({ OWNER_NUMBER: '6287721373781' });
  const caller = '6281111111111@s.whatsapp.net', admin = '6282222222222@s.whatsapp.net';
  const updates = [], replies = [];
  const store = { mode: 'public', group: () => ({ welcome: false }),
    setGroupText: async (...args) => { updates.push(args); } };
  const socket = { user: { id: '6283333333333@s.whatsapp.net' },
    groupMetadata: async () => ({ subject: 'test', participants: [
      { id: admin, admin: 'admin' }, { id: caller, admin: null },
      { id: '6283333333333@s.whatsapp.net', admin: 'admin' }
    ] }),
    sendMessage: async (_chat, payload) => { replies.push(payload); } };
  let now = 999999999;
  const router = createRouter(cfg, store, { warn() {} }, { now: () => (now += 2000) });
  const msg = (sender, text) => ({ key: { remoteJid: '123@g.us', participant: sender },
    message: { conversation: text } });
  await router.handle(socket, msg(caller, 'setwelcome a'));
  assert.equal(updates.length, 0);
  await router.handle(socket, msg(admin, 'setwelcome Halo {user} di {group}'));
  assert.deepEqual(updates[0], ['123@g.us', 'welcomeText', 'Halo {user} di {group}']);
  await router.handle(socket, msg(admin, 'delsetwelcome'));
  assert.deepEqual(updates[1], ['123@g.us', 'welcomeText', '']);
  assert.match(replies.at(-1).text, /default/);
});
test('TTP and meme are valid compact WebP stickers with escaped text', async () => {
  assert.equal(xmlSafe('<script>&"'), '&lt;script&gt;&amp;&quot;');
  assert.throws(() => splitText('x'.repeat(100)), /1–90/);
  const ttp = await textSticker('HAAAA! <3');
  const meta = await sharp(ttp).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, 512);
  assert.equal(meta.height, 512);
  const image = await sharp({ create: { width: 220, height: 100, channels: 3, background: '#cc3300' } }).png().toBuffer();
  const msg = { key: { remoteJid: '1@s.whatsapp.net' },
    message: { extendedTextMessage: { text: 'smeme WOW | <HEY>', contextInfo: {
      stanzaId: 'msg1', participant: '1@s.whatsapp.net',
      quotedMessage: { imageMessage: { fileLength: image.length } }
    } } } };
  const meme = await memeSticker({}, msg, 'WOW | <HEY>', { warn() {} }, async () => image);
  const mm = await sharp(meme).metadata();
  assert.equal(mm.format, 'webp');
  assert.equal(mm.width, 512);
  assert.equal(mm.height, 512);
  await assert.rejects(memeSticker({}, msg, '', {}, async () => image), /Contoh/);
});
test('premium jadibot uses phone alias when incoming DM is a WhatsApp LID', async () => {
  const config = loadConfig({ OWNER_NUMBER: '6287721373781' });
  const calls = [];
  const subbot = {
    start: async (...params) => { calls.push(params); return 'sent'; }
  };
  let now = 10000000;
  const router = createRouter(config, { mode: 'public', group: () => ({}) }, { warn() {} },
    { subbot, now: () => (now += 2000) });
  const messages = [];
  const sock = { user: { id: '6283333333333@s.whatsapp.net' },
    sendMessage: async (_chat, payload) => { messages.push(payload); } };
  await router.handle(sock, {
    key: { remoteJid: '123456789012345@lid', remoteJidAlt: '6281111111111@s.whatsapp.net' },
    message: { conversation: 'jadibot 6282222222222' }
  });
  assert.equal(calls[0][0], '6281111111111@s.whatsapp.net');
  assert.match(messages.at(-1).text, /sent/);
});
