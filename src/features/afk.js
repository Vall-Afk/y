'use strict';
const { jid } = require('../util');
class Away {
  constructor(now = () => Date.now()) {
    this.now = now;
    this.users = new Map();
    this.notified = new Map();
  }
  set(id, reason, lang = 'id') {
    const value = String(reason || (lang === 'en' ? 'Away right now' : 'Sedang AFK')).slice(0, 150);
    this.users.set(jid(id), { reason: value, at: this.now() });
    return (lang === 'en' ? 'AFK enabled: ' : 'Status AFK aktif: ') + value;
  }
  activity(sender, message, lang = 'id') {
    const id = jid(sender);
    const out = [];
    const own = this.users.get(id);
    if (own) {
      this.users.delete(id);
      out.push((lang === 'en' ? 'Welcome back! You were AFK for ' : 'Selamat datang kembali! AFK selama ') + Math.max(0, Math.round((this.now() - own.at) / 60000)) + (lang === 'en' ? ' minutes.' : ' menit.'));
    }
    const m = message.message || {};
    const context = m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || {};
    const targets = [...new Set([...(context.mentionedJid || []), context.participant].filter(Boolean).map(jid))].slice(0, 5);
    for (const target of targets) {
      const targetAFK = this.users.get(target);
      if (!targetAFK || target === id || this.now() - targetAFK.at > 24 * 60 * 60 * 1000) continue;
      const key = id + '|' + target;
      if (this.now() - (this.notified.get(key) || 0) < 60000) continue;
      this.notified.set(key, this.now());
      out.push('@' + target.split('@')[0] + (lang === 'en' ? ' is AFK: ' : ' sedang AFK: ') + targetAFK.reason);
    }
    if (this.notified.size > 10000) this.notified.clear();
    if (this.users.size > 5000) this.users.clear();
    return out.join('\n');
  }
}
module.exports = { Away };
