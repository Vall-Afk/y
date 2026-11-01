'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('../src/config');
const { createRouter, menu } = require('../src/commands');
const { calculate } = require('../src/features/tools');
const { Economy } = require('../src/features/economy');
const { GameHub } = require('../src/features/games');
const { boundedFetch, repoInput } = require('../src/features/network');

const config = loadConfig({ OWNER_NUMBER: '6287721373781', OWNER_NAME: 'Vall', OWNER_INSTAGRAM: 'v4lonenonly' });
const logger = { warn() {}, info() {} };
const alice = '6281111111111@s.whatsapp.net', bob = '6282222222222@s.whatsapp.net', group = '1234567@g.us';
function msg(sender, text, mentionedJid) {
  return { key: { remoteJid: group, participant: sender }, message: {
    extendedTextMessage: { text, contextInfo: { mentionedJid: mentionedJid ? [mentionedJid] : [] } }
  } };
}
function harness(storeOverrides = {}) {
  const flags = { welcome: false, goodbye: false, antilink: false, antiwame: false };
  const calls = [];
  let clock = 9999999999;
  const store = {
    mode: 'public',
    group: () => ({ ...flags }),
    setMode: async mode => { store.mode = mode; },
    setGroupFlag: async (_chat, flag, enabled) => { flags[flag] = enabled; },
    ...storeOverrides
  };
  const sock = {
    user: { id: '6283333333333:4@s.whatsapp.net' },
    groupMetadata: async () => ({ subject: 'Test Grup', participants: [
      { id: alice, admin: 'admin' }, { id: bob, admin: null }, { id: '6283333333333@s.whatsapp.net', admin: 'admin' }
    ] }),
    sendMessage: async (chat, payload) => { calls.push({ chat, payload }); },
    groupParticipantsUpdate: async (...args) => { calls.push({ action: 'participant', args }); },
    groupSettingUpdate: async (...args) => { calls.push({ action: 'setting', args }); },
    groupUpdateSubject: async (...args) => { calls.push({ action: 'subject', args }); }
  };
  return { store, flags, sock, calls, router: createRouter(config, store, logger, { now: () => (clock += 2000) }) };
}
test('math parser handles precedence and rejects injection', () => {
  assert.equal(calculate('10 + 2 * (3 + 4)'), 24);
  assert.equal(calculate('-5 + 3'), -2);
  assert.throws(() => calculate('process.exit(1)'));
  assert.throws(() => calculate('1/0'));
  assert.throws(() => calculate('1++'));
});
test('menu includes legacy and modern commands', () => {
  const text = menu(config);
  for (const cmd of ['!promote','!tictactoe','!gitclone','!daily','!antilink','!calc','!sticker']) {
    assert.ok(text.includes(cmd), cmd);
  }
});
test('group admin can configure protection, but ordinary user cannot', async () => {
  const h = harness();
  await h.router.handle(h.sock, msg(bob, '!welcome on'));
  assert.equal(h.flags.welcome, false);
  await h.router.handle(h.sock, msg(alice, '!welcome on'));
  assert.equal(h.flags.welcome, true);
  await h.router.handle(h.sock, msg(alice, '!antiwame on'));
  assert.equal(h.flags.antiwame, true);
  await h.router.handle(h.sock, msg(bob, 'chat with me https://wa.me/6287777777777'));
  assert.equal(h.calls.filter(c => c.payload?.delete).length, 1);
});
test('group admin can tag and change roles, ordinary user cannot', async () => {
  const h = harness();
  await h.router.handle(h.sock, msg(bob, '!promote @someone', alice));
  assert.equal(h.calls.some(c => c.action === 'participant'), false);
  await h.router.handle(h.sock, msg(alice, '!promote @someone', bob));
  assert.equal(h.calls.find(c => c.action === 'participant').args[2], 'promote');
  await h.router.handle(h.sock, msg(alice, '!hidetag hello'));
  assert.equal(h.calls.some(c => c.payload?.mentions?.length === 3), true);
});
test('economy persists, transfers atomically and prevents double claim', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'beaute-economy-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  let now = Date.UTC(2026, 10, 1);
  const file = path.join(dir, 'economy.json');
  const e = new Economy(file, () => now);
  await e.init();
  const results = await Promise.all([e.daily(alice), e.daily(alice)]);
  assert.equal(results.filter(x => x.claimed).length, 1);
  assert.equal(e.get(alice).balance, 120);
  assert.equal(await e.transfer(alice, bob, 100), true);
  assert.equal(e.get(alice).balance, 20);
  assert.equal(e.get(bob).balance, 100);
  assert.throws(() => e.transfer(alice, bob, -10));
  assert.equal(await e.transfer(alice, bob, 1000), false);
  await e.premium(alice, 3);
  assert.equal(e.get(alice).premium, true);
  assert.equal(await e.consume(alice), true);
  await e.revokePremium(alice);
  assert.equal(e.get(alice).premium, false);
  const reload = new Economy(file, () => now);
  await reload.init();
  assert.equal(reload.get(bob).balance, 100);
  await fs.writeFile(file, 'bad-json');
  await assert.rejects(new Economy(file).init(), /Database ekonomi rusak/);
});
test('Tic Tac Toe turn enforcement and win logic', () => {
  const game = new GameHub(() => 1000, () => 42);
  assert.match(game.beginTTT(group, alice, bob), /dimulai/);
  assert.match(game.moveTTT(group, bob, 1), /Belum giliranmu/);
  game.moveTTT(group, alice, 1);
  game.moveTTT(group, bob, 4);
  game.moveTTT(group, alice, 2);
  game.moveTTT(group, bob, 5);
  assert.match(game.moveTTT(group, alice, 3), /Pemenang/);
  assert.match(game.moveTTT(group, bob, 6), /Tidak ada game/);
  assert.match(game.guessStart(group), /1–100/);
  assert.match(game.guess(group, 42), /Benar/);
});
test('trusted fetching rejects arbitrary hosts and oversized documents', async () => {
  await assert.rejects(boundedFetch('https://localhost/secret'));
  await assert.rejects(boundedFetch('https://evil.example/m', { fetcher: async () => new Response('{}') }));
  const response = () => new Response('abcde');
  const output = await boundedFetch('https://api.github.com/repos/a/b', { fetcher: response });
  assert.equal(output.toString(), 'abcde');
  await assert.rejects(boundedFetch('https://api.github.com/repos/a/b', { fetcher: response, maxBytes: 2 }), /besar/);
  assert.deepEqual(repoInput('https://github.com/Vall-Afk/y.git'), ['Vall-Afk','y']);
  assert.throws(() => repoInput('https://evil.com/x/y'));
});
