'use strict';
process.umask(0o077);
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const { loadConfig } = require('./config');
const { Store } = require('./store');
const { createRouter } = require('./commands');
const { Economy } = require('./features/economy');
const { GameHub } = require('./features/games');
const { RpgService } = require('./features/rpg');
const { Away } = require('./features/afk');
const { isGroup } = require('./util');
async function main() {
  const config = loadConfig();
  const logger = pino({ level: config.logLevel, redact: ['*.key','*.token','*.auth','*.password'] });
  await fs.mkdir(config.authDir, { recursive: true, mode: 0o700 });
  await fs.chmod(config.authDir, 0o700);
  const store = new Store(path.join(config.dataDir, 'settings.json'));
  await store.init();
  const economy = new Economy(path.join(config.dataDir, 'economy.json'));
  await economy.init();
  const games = new GameHub();
  const rpg = new RpgService(economy);
  const afk = new Away();
  const router = createRouter(config, store, logger, { economy, games, rpg, afk });
  let socket = null, timer = null, attempts = 0, stopping = false, connecting = false, connected = false;
  const health = http.createServer((req, res) => {
    if (req.url !== '/healthz') { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ alive: true, connected }) + '\n');
  });
  await new Promise(resolve => health.listen(config.port, '127.0.0.1', resolve));
  async function connect() {
    if (stopping || connecting) return;
    connecting = true;
    try {
      const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
      const sock = makeWASocket({
        auth: state, logger, browser: Browsers.ubuntu(config.name),
        printQRInTerminal: false, markOnlineOnConnect: false, syncFullHistory: false
      });
      socket = sock;
      sock.ev.on('creds.update', saveCreds);
      sock.ev.on('connection.update', ({ qr, connection, lastDisconnect }) => {
        if (socket !== sock || stopping) return;
        if (qr) {
          console.log('\n' + config.name + ' | WhatsApp > Perangkat tertaut > Tautkan perangkat > Scan QR:\n');
          qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') { attempts = 0; connected = true; logger.info('WhatsApp connected. Bot is ready.'); }
        if (connection === 'close') {
          connected = false;
          socket = null;
          const status = lastDisconnect?.error?.output?.statusCode;
          if (status === DisconnectReason.loggedOut || status === DisconnectReason.badSession) {
            logger.error('Session logged out or invalid; manual re-pair is needed.'); return;
          }
          if (timer) clearTimeout(timer);
          const delay = Math.min(60_000, 2000 * 2 ** Math.min(attempts++, 5));
          logger.warn({ status, delay }, 'Disconnected; reconnect scheduled');
          timer = setTimeout(() => { timer = null; connect().catch(err => logger.error({ error: err.message }, 'Reconnect failed')); }, delay);
        }
      });
      sock.ev.on('messages.upsert', async event => {
        if (event.type !== 'notify') return;
        for (const message of event.messages || []) {
          if (socket !== sock) break;
          await router.handle(sock, message);
        }
      });
      sock.ev.on('group-participants.update', async event => {
        if (socket !== sock || !isGroup(event?.id) || !['add', 'remove'].includes(event.action)) return;
        const flags = store.group(event.id);
        if (event.action === 'add' && !flags.welcome || event.action === 'remove' && !flags.goodbye) return;
        try {
          const participants = (event.participants || []).slice(0, 8);
          for (const person of participants) {
            const who = typeof person === 'string' ? person : person.id;
            if (!who) continue;
            const action = event.action === 'add' ? 'Selamat datang' : 'Sampai jumpa';
            await sock.sendMessage(event.id, { text: action + ', @' + who.split('@')[0] + '!', mentions: [who] });
          }
        } catch (err) { logger.warn({ error: err.message }, 'Group participant event failed'); }
      });
    } catch (err) {
      logger.error({ error: err.message }, 'Connection initialization failed');
      if (!stopping) {
        const delay = Math.min(60_000, 2000 * 2 ** Math.min(attempts++, 5));
        timer = setTimeout(() => { timer = null; connect().catch(e => logger.error(e.message)); }, delay);
      }
    } finally { connecting = false; }
  }
  async function shutdown() {
    if (stopping) return;
    stopping = true;
    if (timer) clearTimeout(timer);
    try { socket?.end(new Error('Shutdown')); } catch {}
    await new Promise(resolve => health.close(resolve));
    process.exitCode = 0;
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  process.on('unhandledRejection', err => logger.error({ error: err?.message }, 'Unhandled rejection'));
  logger.info({ port: config.port }, 'Starting ' + config.name + '; health endpoint on localhost');
  await connect();
}
main().catch(err => { console.error('Startup error:', err.message); process.exitCode = 1; });
