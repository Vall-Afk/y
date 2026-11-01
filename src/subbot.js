'use strict';
// A single, premium-only secondary WhatsApp connection. Credentials never leave
// data/jadibot/auth; only the requester receives the pairing code in private chat.
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { jid } = require('./util');

function validPhone(phone) { return typeof phone === 'string' && /^[1-9]\d{7,14}$/.test(phone); }
function validRequester(value) {
  return typeof value === 'string' && /^[1-9]\d{4,19}@(s\.whatsapp\.net|lid)$/.test(jid(value));
}
class SubBotManager {
  constructor({
    config, economy, logger, makeSocket, authState, browsers, disconnectReason,
    onMessage, onParticipants, notify, getPrimaryId = () => '',
    now = () => Date.now(), schedule = setTimeout, cancel = clearTimeout, logoutTimeoutMs = 5000
  }) {
    this.config = config;
    this.economy = economy;
    this.logger = logger;
    this.makeSocket = makeSocket;
    this.authState = authState;
    this.browsers = browsers;
    this.disconnectReason = disconnectReason;
    this.onMessage = onMessage;
    this.onParticipants = onParticipants;
    this.notify = notify;
    this.getPrimaryId = getPrimaryId;
    this.now = now;
    this.schedule = schedule;
    this.cancel = cancel;
    this.logoutTimeoutMs = logoutTimeoutMs;
    this.dir = path.join(config.dataDir, 'jadibot');
    this.authDir = path.join(this.dir, 'auth');
    this.metadataFile = path.join(this.dir, 'session.json');
    this.slot = null;
    this.pending = Promise.resolve();
    this.shuttingDown = false;
  }
  serial(task) {
    const result = this.pending.then(task);
    this.pending = result.catch(() => {});
    return result;
  }
  eligible(owner) {
    return jid(owner) === this.config.ownerJid || Boolean(this.economy.get(jid(owner)).premium);
  }
  expiry(owner) {
    return jid(owner) === this.config.ownerJid ? Infinity : this.economy.get(jid(owner)).premiumUntil;
  }
  async writeMetadata(slot) {
    const metadata = { owner: slot.owner, phone: slot.phone, createdAt: slot.createdAt, linked: Boolean(slot.linked) };
    const temp = this.metadataFile + '.' + randomUUID() + '.tmp';
    try {
      await fs.writeFile(temp, JSON.stringify(metadata) + '\n', { flag: 'wx', mode: 0o600 });
      await fs.rename(temp, this.metadataFile);
    } finally { await fs.rm(temp, { force: true }).catch(() => {}); }
  }
  async init() {
    await fs.mkdir(this.dir, { recursive: true, mode: 0o700 });
    let data;
    try {
      const text = await fs.readFile(this.metadataFile, 'utf8');
      if (text.length > 4096) throw new Error('Metadata terlalu besar.');
      data = JSON.parse(text);
      if (!validRequester(data.owner) || !validPhone(data.phone) ||
          !Number.isFinite(data.createdAt) || typeof data.linked !== 'boolean') {
        throw new Error('Format metadata invalid.');
      }
    } catch (err) {
      if (err.code === 'ENOENT') return;
      throw new Error('Metadata jadibot tidak valid. Tidak aman menghapus sesi otomatis: ' + err.message);
    }
    const slot = this.newSlot(data);
    this.slot = slot;
    if (!slot.linked) {
      slot.status = 'menunggu-pairing';
      return;
    }
    if (!this.eligible(slot.owner)) {
      slot.status = 'premium-habis';
      return;
    }
    try { await this.launch(slot); }
    catch (err) {
      slot.status = 'error';
      this.logger.warn({ error: err.message }, 'Failed to restore secondary session');
    }
  }
  newSlot(meta) {
    return {
      owner: jid(meta.owner), phone: meta.phone,
      createdAt: meta.createdAt, linked: Boolean(meta.linked),
      status: 'menyiapkan', socket: null, timer: null, expiryTimer: null,
      retries: 0, pairingAttempts: 0, pairingInFlight: false
    };
  }
  describe(requester, isMainOwner = false) {
    const s = this.slot;
    if (!s) return 'Jadibot: belum ada sesi. Slot tersedia (maksimal 1).';
    if (jid(requester) !== s.owner && !isMainOwner) return 'Jadibot: slot sedang dipakai oleh pengguna premium lain.';
    return 'Jadibot: ' + s.status + '\nNomor: ' + s.phone +
      '\nPengguna: ' + s.owner.split('@')[0] +
      '\nBuat/lanjut: jadibot ' + s.phone +
      '\nHentikan: stopjadibot';
  }
  async inform(slot, message) {
    if (this.slot !== slot || this.shuttingDown) return;
    try { await this.notify(slot.owner, message); }
    catch (err) { this.logger.warn({ error: err.message }, 'Cannot notify jadibot owner'); }
  }
  clearTimers(slot) {
    if (slot.timer) this.cancel(slot.timer);
    if (slot.expiryTimer) this.cancel(slot.expiryTimer);
    slot.timer = null;
    slot.expiryTimer = null;
  }
  watchExpiry(slot) {
    if (slot.expiryTimer) this.cancel(slot.expiryTimer);
    if (this.slot !== slot || this.shuttingDown || slot.status === 'premium-habis') return;
    if (slot.owner === this.config.ownerJid) return;
    const until = this.expiry(slot.owner);
    if (!(until > this.now())) {
      void this.suspend(slot);
      return;
    }
    const delay = Math.max(1, Math.min(60000, until - this.now()));
    slot.expiryTimer = this.schedule(() => {
      slot.expiryTimer = null;
      if (this.slot !== slot || this.shuttingDown) return;
      if (!this.eligible(slot.owner)) void this.suspend(slot);
      else this.watchExpiry(slot);
    }, delay);
    slot.expiryTimer?.unref?.();
  }
  async suspend(slot) {
    if (this.slot !== slot || slot.status === 'premium-habis') return;
    this.clearTimers(slot);
    slot.status = 'premium-habis';
    const socket = slot.socket;
    slot.socket = null;
    try { socket?.end?.(new Error('Premium jadibot expired')); }
    catch {}
    await this.inform(slot, 'Sesi jadibot dihentikan sementara karena premium habis. Perpanjang premium lalu gunakan jadibot ' + slot.phone + ' untuk melanjutkan.');
  }
  async ensureCleanAuth() {
    try {
      const entries = await fs.readdir(this.authDir);
      if (entries.length) throw new Error('Ada sesi jadibot lama tanpa metadata. Hubungi owner untuk pemeriksaan, jangan hapus data/auth utama.');
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
  start(owner, phone, primaryId) {
    return this.serial(async () => {
      owner = jid(owner);
      if (!validRequester(owner)) throw new Error('Identitas pengirim tidak valid.');
      if (!this.eligible(owner)) throw new Error('Jadibot khusus premium aktif.');
      if (!validPhone(phone)) throw new Error('Gunakan: jadibot 628xxxxxxxxxx (nomor akun kedua).');
      const main = jid(primaryId || this.getPrimaryId());
      if (phone === this.config.ownerNumber || jid(phone + '@s.whatsapp.net') === main) {
        throw new Error('Jangan tautkan akun bot utama sebagai jadibot.');
      }
      if (this.slot) {
        if (this.slot.owner !== owner || this.slot.phone !== phone)
          throw new Error('Slot jadibot sedang digunakan. Maksimal satu sesi tambahan.');
        if (['online', 'menyiapkan', 'pairing', 'reconnecting'].includes(this.slot.status))
          return 'Sesi jadibot sudah ' + this.slot.status + '. Gunakan cekjadibot.';
        if (!this.eligible(owner)) throw new Error('Perpanjang premium terlebih dahulu.');
        this.clearTimers(this.slot);
        const stale = this.slot.socket;
        this.slot.socket = null;
        try { stale?.end?.(new Error('Restart jadibot session')); } catch {}
        this.slot.status = 'menyiapkan';
        this.slot.retries = 0;
        this.slot.pairingAttempts = 0;
        await this.launch(this.slot);
        return 'Mencoba menyambungkan kembali sesi jadibot. Periksa chat pribadi untuk kode baru jika diperlukan.';
      }
      await this.ensureCleanAuth();
      const slot = this.newSlot({ owner, phone, createdAt: this.now(), linked: false });
      this.slot = slot;
      try {
        await this.writeMetadata(slot);
        await this.launch(slot);
      } catch (err) {
        this.clearTimers(slot);
        try { slot.socket?.end?.(new Error('Pairing init failed')); } catch {}
        slot.socket = null;
        slot.status = 'error';
        // Keep metadata and auth for explicit owner-controlled cleanup.
        throw err;
      }
      return 'Sesi jadibot disiapkan untuk ' + phone +
        '. Kode pairing akan dikirim melalui chat pribadi; jangan dibagikan. Maksimal 1 sesi tambahan.';
    });
  }
  async launch(slot) {
    if (this.slot !== slot || this.shuttingDown || !this.eligible(slot.owner)) return;
    this.clearTimers(slot);
    const previousSocket = slot.socket;
    slot.socket = null;
    try { previousSocket?.end?.(new Error('Jadibot reconnect')); } catch {}
    await fs.mkdir(this.authDir, { recursive: true, mode: 0o700 });
    const { state, saveCreds } = await this.authState(this.authDir);
    if (this.slot !== slot || this.shuttingDown) return;
    const socket = this.makeSocket({
      auth: state, logger: this.logger, browser: this.browsers.ubuntu(this.config.name + '-Jadibot'),
      printQRInTerminal: false, markOnlineOnConnect: false, syncFullHistory: false
    });
    slot.socket = socket;
    slot.status = 'menyiapkan';
    slot.pairingInFlight = false;
    this.watchExpiry(slot);
    socket.ev.on('creds.update', async () => {
      if (this.slot !== slot || slot.socket !== socket) return;
      try { await saveCreds(); }
      catch (err) { this.logger.error({ error: err.message }, 'Cannot persist jadibot credentials'); }
    });
    const pair = async () => {
      if (this.slot !== slot || slot.socket !== socket || slot.pairingInFlight || slot.status === 'pairing' ||
          state.creds.registered || slot.pairingAttempts >= 3 || !this.eligible(slot.owner)) return;
      slot.pairingInFlight = true;
      slot.pairingAttempts++;
      try {
        const code = await socket.requestPairingCode(slot.phone);
        if (this.slot !== slot || slot.socket !== socket) return;
        if (!code || !/^[a-z0-9-]{6,24}$/i.test(code)) throw new Error('Kode pairing tidak valid.');
        slot.status = 'pairing';
        await this.inform(slot,
          '*Beauté. Jadibot*\nKode pairing: *' + code +
          '*\nBuka WhatsApp nomor ' + slot.phone +
          ' → Perangkat tertaut → Tautkan perangkat → Tautkan dengan nomor telepon.\n' +
          'Masukkan kode di atas. Jangan kirimkan kode ini kepada orang lain.');
      } catch (err) {
        this.logger.warn({ error: err.message }, 'Jadibot pairing error');
        if (this.slot === slot && slot.socket === socket) {
          slot.status = 'error';
          await this.inform(slot, 'Permintaan kode jadibot gagal. Coba stopjadibot, lalu jadibot <nomor> kembali.');
        }
      } finally { slot.pairingInFlight = false; }
    };
    socket.ev.on('connection.update', update => {
      if (this.slot !== slot || slot.socket !== socket || this.shuttingDown) return;
      if ((update.connection === 'connecting' || update.qr) && !state.creds.registered)
        void pair();
      if (update.connection === 'open') {
        slot.status = 'online';
        slot.retries = 0;
        slot.linked = true;
        void this.serial(async () => {
          if (this.slot === slot && !this.shuttingDown) await this.writeMetadata(slot);
        }).catch(err => this.logger.error({ error: err.message }, 'Failed to persist jadibot metadata'));
        void this.inform(slot, 'Jadibot tersambung! Nomor: ' + slot.phone + '. Gunakan cekjadibot untuk melihat status.');
      }
      if (update.connection === 'close') {
        slot.socket = null;
        const reason = update.lastDisconnect?.error?.output?.statusCode;
        if ([this.disconnectReason.loggedOut, this.disconnectReason.badSession].includes(reason)) {
          this.clearTimers(slot);
          slot.status = 'terputus';
          void this.inform(slot, 'Jadibot terputus dari WhatsApp. Gunakan stopjadibot kemudian jadibot ' + slot.phone + '.');
          return;
        }
        if (!this.eligible(slot.owner)) { void this.suspend(slot); return; }
        slot.status = 'reconnecting';
        if (slot.timer) this.cancel(slot.timer);
        const delay = Math.min(60000, 2000 * 2 ** Math.min(slot.retries++, 5));
        slot.timer = this.schedule(() => {
          slot.timer = null;
          if (this.slot !== slot || this.shuttingDown) return;
          void this.launch(slot).catch(err => {
            slot.status = 'error';
            this.logger.warn({ error: err.message }, 'Jadibot reconnect failed');
          });
        }, delay);
        slot.timer?.unref?.();
      }
    });
    socket.ev.on('messages.upsert', async event => {
      if (this.slot !== slot || slot.socket !== socket || this.shuttingDown) return;
      if (event.type !== 'notify') return;
      if (!this.eligible(slot.owner)) { await this.suspend(slot); return; }
      for (const message of event.messages || []) {
        if (this.slot !== slot || slot.socket !== socket) break;
        try { await this.onMessage(socket, message); }
        catch (err) { this.logger.warn({ error: err.message }, 'Jadibot command failed'); }
      }
    });
    socket.ev.on('group-participants.update', async event => {
      if (this.slot !== slot || slot.socket !== socket || this.shuttingDown || !this.eligible(slot.owner)) return;
      try { await this.onParticipants(socket, event); }
      catch (err) { this.logger.warn({ error: err.message }, 'Jadibot group event failed'); }
    });
  }
  async refreshMembership(user) {
    const slot = this.slot;
    if (!slot || slot.owner !== jid(user) || this.eligible(slot.owner)) return;
    await this.suspend(slot);
  }
  stop(requester, force = false) {
    return this.serial(async () => {
      const slot = this.slot;
      if (!slot) return 'Tidak ada sesi jadibot aktif.';
      if (!force && jid(requester) !== slot.owner && jid(requester) !== this.config.ownerJid)
        throw new Error('Hanya pemilik sesi atau owner utama yang dapat menghentikan jadibot.');
      slot.status = 'menghentikan';
      this.clearTimers(slot);
      const socket = slot.socket;
      slot.socket = null;
      let timeout = null;
      try {
        if (socket?.logout) await Promise.race([
          Promise.resolve().then(() => socket.logout()),
          new Promise((_, reject) => {
            timeout = this.schedule(() => reject(new Error('Jadibot logout timeout')), this.logoutTimeoutMs);
          })
        ]);
      } catch (err) {
        this.logger.warn({ error: err.message }, 'Jadibot logout failed; will remove local auth');
      } finally {
        if (timeout) this.cancel(timeout);
      }
      try { socket?.end?.(new Error('Stopped by user')); }
      catch {}
      await fs.rm(this.authDir, { recursive: true, force: true });
      await fs.rm(this.metadataFile, { force: true });
      this.slot = null;
      return 'Jadibot dihentikan dan sesi lokalnya dihapus. Slot kini tersedia.';
    });
  }
  async shutdown() {
    this.shuttingDown = true;
    const slot = this.slot;
    if (!slot) return;
    this.clearTimers(slot);
    const socket = slot.socket;
    slot.socket = null;
    try { socket?.end?.(new Error('App shutdown')); }
    catch {}
    // Credentials deliberately retained so the one session can resume later.
  }
}
module.exports = { SubBotManager, validPhone, validRequester };
