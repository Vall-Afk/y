'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const FLAGS = new Set(['welcome','goodbye','antilink','antiwame']);
class Store {
  constructor(file) {
    this.file = file;
    this.state = { mode: 'public', groups: {}, languages: {} };
    this.pending = Promise.resolve();
  }
  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
    try {
      const data = await fs.readFile(this.file, 'utf8');
      if (data.length > 1_000_000) throw new Error('Store file is unexpectedly large');
      const parsed = JSON.parse(data);
      if (!parsed || !['public','private'].includes(parsed.mode) ||
          !parsed.groups || typeof parsed.groups !== 'object' ||
          Array.isArray(parsed.groups)) throw new Error('Invalid store schema');
      const languages = parsed.languages === undefined ? {} : parsed.languages;
      if (!languages || typeof languages !== 'object' || Array.isArray(languages) ||
          Object.keys(languages).length > 10000 ||
          Object.entries(languages).some(([id, value]) =>
            !/^[1-9]\d{4,19}@(s\.whatsapp\.net|lid)$/.test(id) || !['id','en'].includes(value)))
        throw new Error('Invalid language preferences');
      this.state = { mode: parsed.mode, groups: parsed.groups, languages };
    } catch (err) {
      if (err.code !== 'ENOENT') throw new Error('Cannot read store without risking data loss: ' + err.message);
      await this.save();
    }
  }
  get mode() { return this.state.mode; }
  group(chat) {
    const g = this.state.groups[chat] || {};
    return { welcome: g.welcome === true, goodbye: g.goodbye === true,
      antilink: g.antilink === true, antiwame: g.antiwame === true,
      welcomeText: typeof g.welcomeText === 'string' ? g.welcomeText.slice(0, 300) : '',
      goodbyeText: typeof g.goodbyeText === 'string' ? g.goodbyeText.slice(0, 300) : '' };
  }
  language(sender) {
    return Object.hasOwn(this.state.languages, sender) && this.state.languages[sender] === 'en' ? 'en' : 'id';
  }
  async setLanguage(sender, language) {
    if (typeof sender !== 'string' || !/^[1-9]\d{4,19}@(s\.whatsapp\.net|lid)$/.test(sender) ||
        !['id', 'en'].includes(language)) throw new Error('Invalid language preferences');
    if (!Object.hasOwn(this.state.languages, sender) && Object.keys(this.state.languages).length >= 10000)
      throw new Error('Language preferences full');
    this.state.languages[sender] = language;
    return this.save();
  }
  async setMode(mode) {
    if (!['public','private'].includes(mode)) throw new Error('Invalid mode');
    this.state.mode = mode;
    return this.save();
  }
  async setGroupFlag(chat, field, enabled) {
    if (!chat.endsWith('@g.us') || !FLAGS.has(field) || typeof enabled !== 'boolean')
      throw new Error('Invalid group settings');
    this.state.groups[chat] = { ...this.group(chat), [field]: enabled };
    return this.save();
  }
  async setGroupText(chat, field, value) {
    if (!chat.endsWith('@g.us') || !['welcomeText','goodbyeText'].includes(field) ||
        typeof value !== 'string' || value.length > 300)
      throw new Error('Teks grup tidak valid (maksimal 300 karakter).');
    this.state.groups[chat] = { ...this.group(chat), [field]: value.trim() };
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
