'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
class Store {
  constructor(file) {
    this.file = file;
    this.state = { mode: 'public', groups: {} };
    this.pending = Promise.resolve();
  }
  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
    try {
      const data = await fs.readFile(this.file, 'utf8');
      if (data.length > 1_000_000) throw new Error('Store file is unexpectedly large');
      const parsed = JSON.parse(data);
      if (!parsed || !['public', 'private'].includes(parsed.mode) ||
          !parsed.groups || typeof parsed.groups !== 'object' ||
          Array.isArray(parsed.groups)) throw new Error('Invalid store schema');
      this.state = { mode: parsed.mode, groups: parsed.groups };
    } catch (err) {
      if (err.code !== 'ENOENT') throw new Error('Cannot read store without risking data loss: ' + err.message);
      await this.save();
    }
  }
  get mode() { return this.state.mode; }
  group(chat) {
    const g = this.state.groups[chat] || {};
    return { welcome: g.welcome === true, antilink: g.antilink === true };
  }
  async setMode(mode) {
    if (!['public', 'private'].includes(mode)) throw new Error('Invalid mode');
    this.state.mode = mode;
    return this.save();
  }
  async setGroupFlag(chat, field, enabled) {
    if (!chat.endsWith('@g.us') || !['welcome', 'antilink'].includes(field) ||
        typeof enabled !== 'boolean') throw new Error('Invalid group settings');
    const previous = this.group(chat);
    this.state.groups[chat] = { ...previous, [field]: enabled };
    return this.save();
  }
  save() {
    const snapshot = JSON.stringify(this.state, null, 2) + '\n';
    this.pending = this.pending.then(async () => {
      const tmp = this.file + '.' + process.pid + '.' + randomUUID() + '.tmp';
      try {
        await fs.writeFile(tmp, snapshot, { mode: 0o600, flag: 'wx' });
        await fs.rename(tmp, this.file);
      } finally { await fs.rm(tmp, { force: true }).catch(() => {}); }
    });
    return this.pending;
  }
}
module.exports = { Store };
