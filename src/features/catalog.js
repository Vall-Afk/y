'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { isGroup } = require('../util');

const CATALOG_COMMANDS = new Set(['list', 'getlist', 'addlist', 'dellist', 'update']);
const MUTATIONS = new Set(['addlist','dellist','update']);
const KEY = /^[a-z0-9_]{1,30}$/;
const MAX_GROUPS = 1000;
const MAX_ROWS = 40;
const MAX_VALUE = 1000;
function assertGroup(chat) {
  if (!isGroup(chat)) throw new Error('Invalid group ID');
}
function parseInput(args) {
  const raw = args.join(' ');
  const pos = raw.indexOf('|');
  if (pos < 0) return null;
  const key = raw.slice(0, pos).trim().toLowerCase();
  const value = raw.slice(pos + 1).trim();
  if (!KEY.test(key) || !value || value.length > MAX_VALUE || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))
    return null;
  return { key, value };
}
class GroupCatalog {
  constructor(file) {
    this.file = file;
    this.groups = {};
    this.pending = Promise.resolve();
  }
  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
    try {
      const data = await fs.readFile(this.file, 'utf8');
      if (data.length > 2_000_000) throw new Error('Group catalog exceeds size limit.');
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) ||
          !parsed.groups || typeof parsed.groups !== 'object' || Array.isArray(parsed.groups) ||
          Object.keys(parsed.groups).length > MAX_GROUPS) throw new Error('Invalid group catalog.');
      for (const [chat, rows] of Object.entries(parsed.groups)) {
        assertGroup(chat);
        if (!rows || typeof rows !== 'object' || Array.isArray(rows) ||
            Object.keys(rows).length > MAX_ROWS) throw new Error('Invalid group rows.');
        for (const [key, value] of Object.entries(rows)) {
          if (!KEY.test(key) || typeof value !== 'string' || !value ||
              value.length > MAX_VALUE) throw new Error('Invalid catalog entry.');
        }
      }
      this.groups = parsed.groups;
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Catalog cannot be loaded safely: ' + error.message);
      await this.write(this.groups);
    }
  }
  async write(groups) {
    const tmp = this.file + '.' + process.pid + '.' + randomUUID() + '.tmp';
    try {
      await fs.writeFile(tmp, JSON.stringify({ groups }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
      await fs.rename(tmp, this.file);
    } finally { await fs.rm(tmp, { force: true }).catch(() => {}); }
  }
  mutate(action) {
    const work = this.pending.then(async () => {
      const copy = structuredClone(this.groups);
      const result = action(copy);
      await this.write(copy);
      this.groups = copy;
      return result;
    });
    this.pending = work.catch(() => {});
    return work;
  }
  entries(chat) {
    assertGroup(chat);
    return Object.entries(this.groups[chat] || {}).sort((a,b) => a[0].localeCompare(b[0]));
  }
  get(chat, key) {
    assertGroup(chat);
    if (!KEY.test(key || '')) return '';
    const group = this.groups[chat];
    return group && Object.hasOwn(group, key) ? group[key] : '';
  }
  change(chat, name, value, mode) {
    assertGroup(chat);
    if (!KEY.test(name || '') || (mode !== 'delete' && (!value || value.length > MAX_VALUE)))
      throw new Error('Invalid group catalog entry.');
    return this.mutate(groups => {
      if (!Object.hasOwn(groups, chat)) {
        if (Object.keys(groups).length >= MAX_GROUPS) throw new Error('Group catalog limit reached.');
        groups[chat] = {};
      }
      const rows = groups[chat];
      const exists = Object.hasOwn(rows, name);
      if (mode === 'add' && exists) return 'exists';
      if (mode !== 'add' && !exists) return 'missing';
      if (mode === 'add' && Object.keys(rows).length >= MAX_ROWS) return 'full';
      if (mode === 'delete') delete rows[name];
      else Object.defineProperty(rows, name, { value, writable: true, enumerable: true, configurable: true });
      if (!Object.keys(rows).length) delete groups[chat];
      return 'ok';
    });
  }
}
async function handleCatalog(ctx) {
  const { cmd, chat, owner, roles, reply, catalog, t } = ctx;
  if (!CATALOG_COMMANDS.has(cmd.name)) return false;
  if (!isGroup(chat)) { await reply(t('groupOnly')); return true; }
  if (!catalog) { await reply(t('catalogStoreNotReady')); return true; }
  const key = cmd.args.join(' ').trim().toLowerCase();
  if (!MUTATIONS.has(cmd.name)) {
    if (key) {
      const item = catalog.get(chat, key);
      await reply(item ? '*'+ key.toUpperCase() + '*\n' + item : t('catalogMissing',{key}));
    } else {
      const rows = catalog.entries(chat);
      await reply(rows.length ? '*' + t('catalogHeading') + '*\n' +
        rows.map(([name]) => '• ' + name).join('\n') +
        '\n\n' + (ctx.lang === 'en' ? 'Use list <name> to view an entry.' : 'Gunakan list <nama> untuk melihat isinya.')
        : t('catalogEmpty'));
    }
    return true;
  }
  if (!owner && !(await roles()).senderAdmin) { await reply(t('groupAdminOnly')); return true; }
  const input = cmd.name === 'dellist' ? { key, value: '' } : parseInput(cmd.args);
  if (!input || !KEY.test(input.key)) {
    await reply(t(cmd.name === 'dellist' ? 'catalogKeyUsage' : 'catalogUsage')); return true;
  }
  const mode = { addlist: 'add', update: 'update', dellist: 'delete' }[cmd.name];
  const result = await catalog.change(chat, input.key, input.value, mode);
  const keys = {
    add: 'catalogCreated', update: 'catalogUpdated', delete: 'catalogRemoved'
  };
  await reply(result === 'exists' ? t('catalogExists') : result === 'missing' ? t('catalogNotExists')
    : result === 'full' ? t('catalogFull') : t(keys[mode], {key: input.key}));
  return true;
}
module.exports = { GroupCatalog, CATALOG_COMMANDS, handleCatalog, parseInput };
