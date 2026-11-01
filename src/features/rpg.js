'use strict';
const { randomInt } = require('node:crypto');
const { userFrom, validUser } = require('./economy');

const RPG_COMMANDS = new Set([
  'joinrpg','inventory','rpgshop','level','mining','mine','nebang','mancing',
  'hunt','adventure','heal','buy','sell','jualikan','jualkayu','jualcoal','jualstone'
]);
const ITEMS = Object.freeze({
  wood: { buy: 15, sell: 6 },
  stone: { buy: 20, sell: 8 },
  coal: { buy: 50, sell: 22 },
  ore: { buy: 80, sell: 35 },
  fish: { buy: 22, sell: 10 },
  meat: { buy: 30, sell: 12 }
});
function initialRpg() {
  return { hp: 100, xp: 0, items: { wood: 0, stone: 0, coal: 0, ore: 0, fish: 0, meat: 0 },
    actions: {} };
}
function status(r) {
  return '*Inventory RPG*\nHP: ' + r.hp + '/100 | Level: ' + (1 + Math.floor(r.xp / 100)) +
    ' | XP: ' + r.xp + '\n' + Object.entries(r.items).map(([k, v]) => k + ': ' + v).join('\n');
}
function itemAliases(name) {
  return ({ ikan: 'fish', kayu: 'wood', batu: 'stone', besi: 'ore', daging: 'meat', batu_bara: 'coal' })[name] || name;
}
class RpgService {
  constructor(economy, random = randomInt) {
    this.economy = economy;
    this.random = random;
  }
  snapshot(id) { return this.economy.state.users[id]?.rpg || null; }
  async join(id) {
    if (!validUser(id)) throw new Error('Identitas pengguna tidak didukung.');
    return this.economy.transact(db => {
      const user = userFrom(db, id);
      if (user.rpg) return 'Kamu sudah terdaftar RPG.\n' + status(user.rpg);
      user.rpg = initialRpg();
      return 'Berhasil bergabung RPG!\n' + status(user.rpg);
    });
  }
  async action(id, name) {
    const rules = {
      mining: { cooldown: 300000, hp: 8, xp: 12, item: 'stone', chance: 'coal' },
      nebang: { cooldown: 300000, hp: 6, xp: 10, item: 'wood' },
      mancing: { cooldown: 300000, hp: 5, xp: 10, item: 'fish' },
      hunt: { cooldown: 300000, hp: 12, xp: 16, item: 'meat' },
      adventure: { cooldown: 900000, hp: 20, xp: 28, item: 'ore' }
    };
    const rule = rules[name];
    if (!rule) throw new Error('Aksi tidak tersedia.');
    return this.economy.transact((db, time) => {
      const user = userFrom(db, id), r = user.rpg;
      if (!r) return 'Daftar dulu: !joinrpg';
      const wait = rule.cooldown - (time - (r.actions[name] || 0));
      if (wait > 0) return 'Cooldown: tunggu ' + Math.ceil(wait / 60000) + ' menit.';
      if (r.hp < rule.hp) return 'HP tidak cukup. Gunakan !heal atau !buy meat 2.';
      const amount = this.random(1, 4);
      r.hp -= rule.hp;
      r.xp += rule.xp;
      r.items[rule.item] += amount;
      if (rule.chance && this.random(0, 100) < 25) r.items[rule.chance]++;
      r.actions[name] = time;
      return 'Berhasil ' + name + ': +' + amount + ' ' + rule.item +
        '\nHP: ' + r.hp + '/100, XP: ' + r.xp + '.';
    });
  }
  async heal(id) {
    return this.economy.transact(db => {
      const r = userFrom(db, id).rpg;
      if (!r) return 'Daftar dulu: !joinrpg';
      if (r.hp >= 100) return 'HP masih penuh.';
      if (r.items.meat < 2) return 'Butuh 2 meat. Dapatkan dengan !hunt atau !buy meat 2.';
      r.items.meat -= 2;
      r.hp = Math.min(100, r.hp + 45);
      return 'HP pulih menjadi ' + r.hp + '/100.';
    });
  }
  async trade(id, kind, item, amount) {
    item = itemAliases(item);
    if (!Object.hasOwn(ITEMS, item) || !Number.isInteger(amount) || amount < 1 || amount > 100)
      throw new Error('Barang / jumlah tidak valid. Contoh: !sell fish 2');
    return this.economy.transact(db => {
      const user = userFrom(db, id), r = user.rpg;
      if (!r) return 'Daftar dulu: !joinrpg';
      const price = ITEMS[item][kind] * amount;
      if (kind === 'buy') {
        if (user.balance < price) return 'Koin kurang. Butuh ' + price + '.';
        user.balance -= price;
        r.items[item] += amount;
      } else {
        if (r.items[item] < amount) return 'Barang tidak cukup.';
        if (user.balance + price > 100_000_000) return 'Saldo mencapai batas maksimal.';
        r.items[item] -= amount;
        user.balance += price;
      }
      return (kind === 'buy' ? 'Membeli ' : 'Menjual ') + amount + ' ' + item +
        ' seharga ' + price + ' koin. Saldo: ' + user.balance + '.';
    });
  }
}
async function handleRpg(ctx) {
  const { cmd, rpg, sender, accountSender, reply } = ctx;
  const account = accountSender || sender;
  if (!RPG_COMMANDS.has(cmd.name)) return false;
  if (!rpg) { await reply('RPG belum aktif.'); return true; }
  if (cmd.name === 'joinrpg') { await reply(await rpg.join(account)); return true; }
  if (cmd.name === 'inventory' || cmd.name === 'level') {
    const current = rpg.snapshot(account);
    await reply(current ? status(current) : 'Daftar dulu: !joinrpg');
    return true;
  }
  if (cmd.name === 'rpgshop') {
    await reply('*RPG Shop*\n' + Object.entries(ITEMS).map(([k, p]) => k + ' beli ' + p.buy + ', jual ' + p.sell).join('\n') +
      '\n!buy <item> <jumlah> / !sell <item> <jumlah>');
    return true;
  }
  if (['mining','mine','nebang','mancing','hunt','adventure'].includes(cmd.name)) {
    await reply(await rpg.action(account, cmd.name === 'mine' ? 'mining' : cmd.name));
    return true;
  }
  if (cmd.name === 'heal') { await reply(await rpg.heal(account)); return true; }
  const named = { jualikan: 'fish', jualkayu: 'wood', jualcoal: 'coal', jualstone: 'stone' };
  if (Object.hasOwn(named, cmd.name)) {
    const qty = cmd.args.length ? Number(cmd.args[0]) : 1;
    await reply(await rpg.trade(account, 'sell', named[cmd.name], qty));
    return true;
  }
  if (['buy','sell'].includes(cmd.name)) {
    const qty = Number(cmd.args[1]);
    await reply(await rpg.trade(sender, cmd.name, cmd.args[0] || '', qty));
  }
  return true;
}
module.exports = { RpgService, RPG_COMMANDS, handleRpg, initialRpg };
