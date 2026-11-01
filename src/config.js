'use strict';
const path = require('node:path');

function loadConfig(env = process.env) {
  const raw = (env.OWNER_NUMBER || '').trim();
  if (!/^([1-9][0-9]{7,14})$/.test(raw)) {
    throw new Error('OWNER_NUMBER must contain 8-15 digits with a country code, e.g. 62812...');
  }
  const prefix = env.PREFIX === undefined ? '!' : env.PREFIX;
  if (!prefix || prefix.length > 3 || /[\s]/.test(prefix)) throw new Error('PREFIX must be 1-3 non-space characters');
  const name = (env.BOT_NAME || 'Beauté.').trim();
  if (!name || name.length > 50) throw new Error('BOT_NAME must be 1-50 characters');
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const dataDir = path.resolve(env.DATA_DIR || './data');
  const authDir = path.resolve(env.AUTH_DIR || path.join(dataDir, 'auth'));
  return Object.freeze({
    ownerNumber: raw,
    ownerJid: raw + '@s.whatsapp.net',
    prefix,
    name,
    port,
    dataDir,
    authDir,
    logLevel: ['fatal', 'error', 'warn', 'info', 'debug'].includes(env.LOG_LEVEL) ? env.LOG_LEVEL : 'info'
  });
}
module.exports = { loadConfig };
