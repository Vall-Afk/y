'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { SubBotManager, validPhone } = require('../src/subbot');
const { createRouter } = require('../src/commands');
const { loadConfig } = require('../src/config');
const logger = { warn() {}, error() {}, info() {} };
const primary = '6287721373781@s.whatsapp.net';
const user = '6281111111111@s.whatsapp.net';
const stranger = '6282222222222@s.whatsapp.net';
const phone = '6288888888888';
const configTemplate = loadConfig({ OWNER_NUMBER: '6287721373781', DATA_DIR: '.' });
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'beaute-subbot-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  let premium = true;
  const sent = [], sockets = [], received = [], changes = [];
  const creds = { registered: false };
  const config = Object.freeze({ ...configTemplate, dataDir: dir });
  const economy = { get: id => ({
    premium: id === user && premium,
    premiumUntil: id === user && premium ? Date.now() + 86400000 : 0
  }) };
  function makeSocket(options) {
    const socket = {
      options, ev: new EventEmitter(), ended: false, loggedOut: false,
      authState: { creds },
      requestPairingCode: async number => {
        socket.pairedNumber = number;
        return 'ABCD-EFGH';
      },
      end(reason) { socket.ended = true; socket.endReason = reason; },
      async logout() { socket.loggedOut = true; },
      sendMessage: async (...args) => { sent.push(args); }
    };
    sockets.push(socket);
    return socket;
  }
  const opts = {
    config, economy, logger, makeSocket,
    authState: async folder => {
      await fs.mkdir(folder, { recursive: true });
      return { state: { creds }, saveCreds: async () => {} };
    },
    browsers: { ubuntu: () => ['Ubuntu','Chrome','100.0'] },
    disconnectReason: { loggedOut: 401, badSession: 500 },
    onMessage: async (_sock, msg) => received.push(msg),
    onParticipants: async (_sock, event) => changes.push(event),
    notify: async (to, text) => sent.push([to, { text }]),
    getPrimaryId: () => '6289999999999@s.whatsapp.net'
  };
  const manager = new SubBotManager(opts);
  await manager.init();
  return {
    manager, opts, config, sent, sockets, received, changes,
    setPremium: value => { premium = value; },
    creds
  };
}
function tick() { return new Promise(resolve => setImmediate(resolve)); }
test('validates target number and owner', async t => {
  const h = await fixture(t);
  assert.equal(validPhone('628123456789'), true);
  assert.equal(validPhone('+628123456789'), false);
  await assert.rejects(h.manager.start(stranger, phone), /premium/);
  await assert.rejects(h.manager.start(user, '6287721373781'), /bot utama/);
  await assert.rejects(h.manager.start(user, '0001111'), /jadibot/);
  assert.equal(h.sockets.length, 0);
});
test('pairing is private and limited to one concurrent slot', async t => {
  const h = await fixture(t);
  const startResult = await Promise.allSettled([
    h.manager.start(user, phone),
    h.manager.start(primary, '6287777777777')
  ]);
  assert.equal(startResult.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(startResult.filter(x => x.status === 'rejected').length, 1);
  assert.equal(h.sockets.length, 1);
  const sock = h.sockets[0];
  sock.ev.emit('connection.update', { connection: 'connecting' });
  await tick();
  assert.equal(sock.pairedNumber, phone);
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0][0], user);
  assert.match(h.sent[0][1].text, /ABCD-EFGH/);
  sock.ev.emit('connection.update', { connection: 'connecting' });
  await tick();
  assert.equal(h.sent.length, 1, 'should not spam duplicate pairing codes');
  h.creds.registered = true;
  sock.ev.emit('connection.update', { connection: 'open' });
  await tick();
  assert.match(h.manager.describe(user), /online/);
  assert.match(h.manager.describe(stranger), /dipakai/);
  const msg = { key: {remoteJid: stranger}, message: { conversation: 'ping' }};
  sock.ev.emit('messages.upsert', { type: 'notify', messages: [msg] });
  await tick();
  assert.equal(h.received.length, 1);
  assert.match(await h.manager.stop(user), /dihapus/);
  assert.equal(sock.loggedOut, true);
  assert.equal(h.manager.slot, null);
  assert.equal(await fs.stat(h.manager.metadataFile).catch(() => null), null);
});
test('stop only by slot owner or primary owner, and premium expiry suspends', async t => {
  const h = await fixture(t);
  await h.manager.start(user, phone);
  await assert.rejects(h.manager.stop(stranger), /pemilik sesi/);
  h.setPremium(false);
  const sock = h.sockets[0];
  sock.ev.emit('messages.upsert', { type: 'notify', messages: [{ key: { remoteJid: stranger }, message: { conversation: 'ping' } }] });
  await tick();
  assert.equal(h.manager.slot.status, 'premium-habis');
  assert.equal(sock.ended, true);
  assert.equal(h.received.length, 0);
  assert.match(await h.manager.stop(primary), /dihapus/);
});
test('restores linked credentials, keeps maximum slot, and preserves auth on shutdown', async t => {
  const h = await fixture(t);
  await h.manager.start(user, phone);
  h.creds.registered = true;
  h.sockets[0].ev.emit('connection.update', { connection: 'open' });
  await tick(); await tick();
  await h.manager.shutdown();
  assert.equal(h.sockets[0].ended, true);
  assert.ok(await fs.stat(h.manager.metadataFile));
  const restored = new SubBotManager(h.opts);
  await restored.init();
  assert.equal(h.sockets.length, 2);
  assert.match(restored.describe(user), /menyiapkan/);
  assert.match(await restored.stop(primary), /dihapus/);
});
test('unlinked restored pairing waits for explicit request rather than leaking code', async t => {
  const h = await fixture(t);
  await h.manager.start(user, phone);
  await h.manager.shutdown();
  const restored = new SubBotManager(h.opts);
  await restored.init();
  assert.equal(h.sockets.length, 1);
  assert.match(restored.describe(user), /menunggu-pairing/);
  await restored.start(user, phone);
  assert.equal(h.sockets.length, 2);
  await restored.stop(user);
});
test('no-prefix router delegates jadibot only in direct chat to manager', async () => {
  const calls = [], actions = [];
  const subbot = {
    describe: () => 'status child',
    start: async (...args) => { actions.push({ type: 'start', args }); return 'pairing dimulai'; },
    stop: async (...args) => { actions.push({ type: 'stop', args }); return 'berhasil stop'; }
  };
  const store = { mode: 'public', group: () => ({}) };
  const sock = {
    user: { id: '6289999999999@s.whatsapp.net' },
    sendMessage: async (chat, payload) => { calls.push({ chat, payload }); }
  };
  let clock = 10000000000;
  const router = createRouter(configTemplate, store, logger, { subbot, now: () => (clock += 2000) });
  await router.handle(sock, { key: {remoteJid: user}, message: {conversation: 'jadibot ' + phone} });
  assert.equal(actions[0].type, 'start');
  assert.equal(actions[0].args[0], user);
  assert.match(calls.at(-1).payload.text, /pairing dimulai/);
  await router.handle(sock, { key: {remoteJid: '123456@g.us', participant: user}, message: {conversation: 'jadibot ' + phone} });
  assert.equal(actions.length, 1);
  assert.match(calls.at(-1).payload.text, /chat pribadi/);
  await router.handle(sock, { key: {remoteJid: user}, message: {conversation: '!cekjadibot'} });
  assert.match(calls.at(-1).payload.text, /status child/);
  await router.handle(sock, { key: {remoteJid: user}, message: {conversation: 'stopjadibot'} });
  assert.equal(actions.at(-1).type, 'stop');
});

test('premium cancellation immediately suspends an already linked child session', async t => { const h=await fixture(t); await h.manager.start(user,phone); const sock=h.sockets[0]; h.creds.registered=true; sock.ev.emit('connection.update',{connection:'open'}); await tick(); h.setPremium(false); await h.manager.refreshMembership(user); assert.equal(h.manager.slot.status,'premium-habis'); assert.equal(sock.ended,true); await h.manager.stop(primary); });
