'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { jid } = require('../util');
const ECONOMY_COMMANDS = new Set([
  'daily','balance','limit','buylimit','buyglimit','transfer','topglobal','toplocal',
  'cekpremium','listpremium','addpremium','delpremium'
]);
const MAX_BALANCE = 100_000_000;
const DAY = 86_400_000;
const GROUP_RE=/^[a-zA-Z0-9_-]{3,64}@g\.us$/;
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
    this.state = { users: {}, groups: {} };
    this.pending = Promise.resolve();
  }
  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
    try {
      const data = await fs.readFile(this.file, 'utf8');
      if (data.length > 2_000_000) throw new Error('Database terlalu besar.');
      const parsed = JSON.parse(data);
      if (!parsed || !parsed.users || Array.isArray(parsed.users) || typeof parsed.users !== 'object') throw new Error('Format database tidak sesuai.');
      const groups=parsed.groups===undefined?{}:parsed.groups;
      if(!groups||typeof groups!=='object'||Array.isArray(groups)||
        Object.keys(groups).length>1000||Object.entries(groups).some(([id,g])=>
          !GROUP_RE.test(id)||!g||!Number.isSafeInteger(g.extra)||g.extra<0||g.extra>10000||
          !Number.isSafeInteger(g.used)||g.used<0||g.used>10000||
          typeof g.quotaDay!=='string'||g.quotaDay.length>10))
        throw new Error('Invalid group quota data.');
      this.state = {...parsed,groups};
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
  groupQuota(chat) {
    if(!GROUP_RE.test(chat||''))return 0;
    const g=this.state.groups?.[chat];
    if(!g)return 0;
    return Math.max(0,g.extra-(g.quotaDay===new Date(this.now()).toISOString().slice(0,10)?g.used:0));
  }
  buyGroupLimit(id,chat) {
    if(!validUser(id)||!GROUP_RE.test(chat||''))throw new Error('Group quota needs a valid group.');
    return this.transact(db=>{
      const buyer=userFrom(db,id);
      if(buyer.balance<250)return false;
      if(!db.groups)db.groups={};
      if(!Object.hasOwn(db.groups,chat)){
        if(Object.keys(db.groups).length>=1000)throw new Error('Group quota storage full.');
        db.groups[chat]={extra:0,used:0,quotaDay:''};
      }
      const g=db.groups[chat];
      if(g.extra>9990)return false;
      buyer.balance-=250;
      g.extra+=10;
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
  consume(id,chat) {
    return this.transact((db, time) => {
      const user = userFrom(db, id);
      normalizeQuota(user, time);
      if (isPremium(user, time)) return true;
      if (user.used < 20 + user.extra) {user.used++;return true;}
      const group=db.groups?.[chat];
      if(group){
        normalizeQuota(group,time);
        if(group.used<group.extra){group.used++;return true;}
      }
      return false;
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
  const { cmd, economy, reply, message, sender, accountSender, owner, config, roles, chat, subbot, t, lang } = ctx;
  const account = accountSender || sender;
  if (!ECONOMY_COMMANDS.has(cmd.name)) return false;
  if (!economy) { await reply(t('economyMissing')); return true; }
  const value = economy.get(account);
  if (cmd.name === 'balance' || cmd.name === 'limit' || cmd.name === 'cekpremium') {
    if (cmd.name === 'balance') await reply(t('balance',{amount:value.balance}));
    else if (cmd.name === 'limit') await reply(t('quota',{quota:owner || value.premium ? 'Unlimited' : value.quota, premium:t(value.premium ? 'premActive' : 'premInactive')})+
      (chat.endsWith('@g.us')?'\nGroup bonus: '+economy.groupQuota(chat):''));
    else await reply('Premium: ' + (owner || value.premium ? t('premActive') : t('premInactive')) + (value.premium ? '\n' + t('premUntil',{date:new Date(value.premiumUntil).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID')}) : ''));
    return true;
  }
  if (cmd.name === 'daily') {
    const result = await economy.daily(account);
    await reply(result.claimed ? t('dailyClaimed',{amount:result.balance}) : t('dailyCooldown',{hours:Math.ceil(result.wait / 3600000)}));
    return true;
  }
  if (cmd.name === 'buyglimit') {
    if(!chat.endsWith('@g.us')){await reply(lang==='en'?'Use buyglimit inside a group.':'Gunakan buyglimit di grup.');return true;}
    const ok=await economy.buyGroupLimit(account,chat);
    await reply(ok?(lang==='en'?'Bought 10 shared daily API requests for this group (250 virtual coins).':
      'Berhasil membeli 10 kuota API harian bersama untuk grup (250 koin virtual).'):
      (lang==='en'?'Insufficient coins or group quota limit reached.':
        'Koin tidak cukup atau batas kuota grup tercapai.'));
    return true;
  }
  if (cmd.name === 'buylimit') {
    await reply(await economy.buyLimit(account) ? t('buyLimitDone') : t('buyLimitInsufficient'));
    return true;
  }
  if (cmd.name === 'transfer') {
    const to = numberFrom(cmd.args[0], message);
    const amount = Number(cmd.args.at(-1));
    if (!to || !Number.isSafeInteger(amount)) { await reply(t('transferUsage')); return true; }
    await reply(await economy.transfer(account, to, amount) ? t('transferDone',{amount}) : t('transferFailed'));
    return true;
  }
  if (cmd.name === 'topglobal' || cmd.name === 'toplocal') {
    let ids = null;
    if (cmd.name === 'toplocal') {
      if (!chat.endsWith('@g.us')) { await reply(t('toplocalOnly')); return true; }
      const role = await roles();
      ids = (role.metadata?.participants || []).flatMap(p => [jid(p.id), jid(p.phoneNumber)].filter(validUser));
    }
    const top = economy.leaderboard(ids);
    await reply('*' + t('topBalance') + '*\n' + (top.map((x, i) => (i + 1) + '. ***' + x.id.split('@')[0].slice(-4) + ': ' + x.balance + ' koin').join('\n') || t('noData')));
    return true;
  }
  if (cmd.name === 'listpremium') {
    if (!owner) { await reply(t('ownerOnly')); return true; }
    const all = economy.listPremium();
    await reply('*Premium*\n' + (all.map(x => x.id.split('@')[0] + ' — ' + new Date(x.until).toLocaleDateString('id-ID')).join('\n') || t('premiumEmpty')));
    return true;
  }
  if (!owner) { await reply('Khusus owner.'); return true; }
  const to = numberFrom(cmd.args[0], message);
  if (!to) { await reply(t('premiumTarget')); return true; }
  if (cmd.name === 'addpremium') {
    const days = Number(cmd.args.at(-1));
    const until = await economy.premium(to, days);
    await reply(t('premiumGranted',{date:new Date(until).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID')}));
  } else if (cmd.name === 'delpremium') {
    await economy.revokePremium(to);
    await subbot?.refreshMembership?.(to);
    await reply(t('premiumRevoked'));
  }
  return true;
}
module.exports = { Economy, ECONOMY_COMMANDS, handleEconomy, validUser, numberFrom, userFrom };
