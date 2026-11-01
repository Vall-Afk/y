'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { jid } = require('../util');
const ECONOMY_COMMANDS = new Set([
  'daily','balance','limit','buylimit','transfer','topglobal','toplocal',
  'cekpremium','listpremium','addpremium','delpremium'
]);
const MAX_BALANCE = 100_000_000;
const DAY = 86_400_000;
function validUser(value) { return /^[1-9]\d{4,19}@(s\.whatsapp\.net|lid)$/.test(value); }
function initialUser() { return { balance: 0, dailyAt: 0, quotaDay: '', used: 0, extra: 0, premiumUntil: 0 }; }
function userFrom(state, id) {
  if (!validUser(id)) throw new Error('Nomor pengguna tidak valid.');
  if (!Object.hasOwn(state.users, id)) {
    if (Object.keys(state.users).length >= 10000) throw new Error('Database pengguna penuh.');
    state.users[id] = initialUser();
  }
  return state.users[id];
}
function normalizeQuota(user, time) {
  const day = new Date(time).toISOString().slice(0, 10);
  if (user.quotaDay !== day) { user.quotaDay = day; user.used = 0; }
}
function isPremium(user, time) { return user.premiumUntil > time; }
function summary(user, time) {
  const purchased = Math.max(0, user.extra || 0);
  const allowance = 20 + purchased;
  const used = user.quotaDay === new Date(time).toISOString().slice(0, 10) ? user.used : 0;
  return { balance: user.balance, quota: Math.max(0, allowance - used), premium: isPremium(user, time), premiumUntil: user.premiumUntil };
}
class Economy {
  constructor(file, now = () => Date.now()) {
    this.file = file;
    this.now = now;
    this.state = { users: {} };
    this.pending = Promise.resolve();
  }
  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
    try {
      const data = await fs.readFile(this.file, 'utf8');
      if (data.length > 2_000_000) throw new Error('Database terlalu besar.');
      const parsed = JSON.parse(data);
      if (!parsed || !parsed.users || Array.isArray(parsed.users) || typeof parsed.users !== 'object') throw new Error('Format database tidak sesuai.');
      this.state = parsed;
    } catch (err) {
      if (err.code !== 'ENOENT') throw new Error('Database ekonomi rusak, data tidak ditimpa: ' + err.message);
      await this.write(this.state);
    }
  }
  async write(data) {
    const temp = this.file + '.' + process.pid + '.' + randomUUID() + '.tmp';
    try {
      await fs.writeFile(temp, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      await fs.rename(temp, this.file);
    } finally { await fs.rm(temp, { force: true }).catch(() => {}); }
  }
  transact(action) {
    const task = this.pending.then(async () => {
      const copy = structuredClone(this.state);
      const result = action(copy, this.now());
      await this.write(copy);
      this.state = copy;
      return result;
    });
    this.pending = task.catch(() => {});
    return task;
  }
  get(id) {
    const user = validUser(id) ? this.state.users[id] || initialUser() : initialUser();
    return summary(user, this.now());
  }
  daily(id) {
    return this.transact((db, time) => {
      const user = userFrom(db, id);
      if (time - user.dailyAt < DAY) return { claimed: false, wait: DAY - (time - user.dailyAt) };
      user.balance = Math.min(MAX_BALANCE, user.balance + 120);
      user.dailyAt = time;
      return { claimed: true, balance: user.balance };
    });
  }
  buyLimit(id) {
    return this.transact(db => {
      const user = userFrom(db, id);
      if (user.balance < 100) return false;
      if (user.extra > 10000) return false;
      user.balance -= 100;
      user.extra += 10;
      return true;
    });
  }
  transfer(from, to, amount) {
    if (!validUser(from) || !validUser(to) || from === to ||
        !Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000) throw new Error('Transfer tidak valid.');
    return this.transact(db => {
      const sender = userFrom(db, from);
      if (sender.balance < amount) return false;
      const receiver = userFrom(db, to);
      if (receiver.balance + amount > MAX_BALANCE) return false;
      sender.balance -= amount;
      receiver.balance += amount;
      return true;
    });
  }
  consume(id) {
    return this.transact((db, time) => {
      const user = userFrom(db, id);
      normalizeQuota(user, time);
      if (isPremium(user, time)) return true;
      if (user.used >= 20 + user.extra) return false;
      user.used++;
      return true;
    });
  }
  premium(id, days) {
    if (!validUser(id) || !Number.isInteger(days) || days < 1 || days > 365) throw new Error('Nomor/hari tidak valid.');
    return this.transact((db, time) => {
      const user = userFrom(db, id);
      user.premiumUntil = Math.max(user.premiumUntil, time) + days * DAY;
      return user.premiumUntil;
    });
  }
  revokePremium(id) {
    return this.transact(db => { userFrom(db, id).premiumUntil = 0; });
  }
  listPremium() {
    const time = this.now();
    return Object.entries(this.state.users).filter(([, u]) => isPremium(u, time)).map(([id, u]) => ({ id, until: u.premiumUntil })).slice(0, 50);
  }
  leaderboard(ids) {
    const allow = ids ? new Set(ids) : null;
    return Object.entries(this.state.users).filter(([id]) => !allow || allow.has(id))
      .sort((a, b) => b[1].balance - a[1].balance).slice(0, 10)
      .map(([id, u]) => ({ id, balance: u.balance }));
  }
}
function numberFrom(args, message) {
  const m = message.message || {};
  const ref = m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || {};
  const mentioned = (ref.mentionedJid || [])[0] || ref.participant;
  if (mentioned && validUser(jid(mentioned))) return jid(mentioned);
  const number = args?.replace(/^\+/, '');
  if (/^[1-9]\d{7,14}$/.test(number || '')) return number + '@s.whatsapp.net';
  return '';
}
async function handleEconomy(ctx) {
  const { cmd, economy, reply, message, sender, owner, config, roles, chat } = ctx;
  if (!ECONOMY_COMMANDS.has(cmd.name)) return false;
  if (!economy) { await reply('Database ekonomi belum tersedia.'); return true; }
  const value = economy.get(sender);
  if (cmd.name === 'balance' || cmd.name === 'limit' || cmd.name === 'cekpremium') {
    if (cmd.name === 'balance') await reply('Saldo: ' + value.balance + ' koin.');
    else if (cmd.name === 'limit') await reply('Limit: ' + (owner || value.premium ? 'Unlimited' : value.quota) + '\nPremium: ' + (value.premium ? 'Aktif' : 'Tidak'));
    else await reply('Premium: ' + (owner || value.premium ? 'Aktif' : 'Tidak aktif') + (value.premium ? '\nSampai: ' + new Date(value.premiumUntil).toLocaleDateString('id-ID') : ''));
    return true;
  }
  if (cmd.name === 'daily') {
    const result = await economy.daily(sender);
    await reply(result.claimed ? 'Daily +120 koin! Saldo: ' + result.balance : 'Daily belum tersedia. Coba lagi dalam ' + Math.ceil(result.wait / 3600000) + ' jam.');
    return true;
  }
  if (cmd.name === 'buylimit') {
    await reply(await economy.buyLimit(sender) ? 'Berhasil membeli +10 limit untuk 100 koin.' : 'Saldo kurang dari 100 koin.');
    return true;
  }
  if (cmd.name === 'transfer') {
    const to = numberFrom(cmd.args[0], message);
    const amount = Number(cmd.args.at(-1));
    if (!to || !Number.isSafeInteger(amount)) { await reply('Contoh: !transfer 62812xxxx 100'); return true; }
    await reply(await economy.transfer(sender, to, amount) ? 'Transfer ' + amount + ' koin berhasil.' : 'Saldo tidak mencukupi / penerima melebihi batas.');
    return true;
  }
  if (cmd.name === 'topglobal' || cmd.name === 'toplocal') {
    let ids = null;
    if (cmd.name === 'toplocal') {
      if (!chat.endsWith('@g.us')) { await reply('Toplocal hanya di grup.'); return true; }
      const role = await roles();
      ids = (role.metadata?.participants || []).flatMap(p => [jid(p.id), jid(p.phoneNumber)].filter(validUser));
    }
    const top = economy.leaderboard(ids);
    await reply('*Top saldo*\n' + (top.map((x, i) => (i + 1) + '. ***' + x.id.split('@')[0].slice(-4) + ': ' + x.balance + ' koin').join('\n') || 'Belum ada data.'));
    return true;
  }
  if (cmd.name === 'listpremium') {
    if (!owner) { await reply('Khusus owner.'); return true; }
    const all = economy.listPremium();
    await reply('*Premium*\n' + (all.map(x => x.id.split('@')[0] + ' — ' + new Date(x.until).toLocaleDateString('id-ID')).join('\n') || 'Belum ada.'));
    return true;
  }
  if (!owner) { await reply('Khusus owner.'); return true; }
  const to = numberFrom(cmd.args[0], message);
  if (!to) { await reply('Nomor tidak valid. Contoh: !addpremium 62812xxxx 30'); return true; }
  if (cmd.name === 'addpremium') {
    const days = Number(cmd.args.at(-1));
    const until = await economy.premium(to, days);
    await reply('Premium aktif hingga ' + new Date(until).toLocaleDateString('id-ID'));
  } else if (cmd.name === 'delpremium') {
    await economy.revokePremium(to); await reply('Premium dicabut.');
  }
  return true;
}
module.exports = { Economy, ECONOMY_COMMANDS, handleEconomy, validUser, numberFrom, userFrom };
