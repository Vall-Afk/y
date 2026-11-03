'use strict';
const { randomInt, randomBytes } = require('node:crypto');
const { statfs } = require('node:fs/promises');

const TOOL_COMMANDS = new Set(['say','reverse','count','calc','hitung','pilih','roll','coin','password','runtime','speed','waktu','tambah','kurang','kali','bagi','cekdrive','cekbandwidth']);
function calculate(expression) {
  const input = expression.replace(/\s+/g, '');
  if (!input || input.length > 120 || !/^[0-9.+*/()%\-]+$/.test(input)) throw new Error('Gunakan angka dan operator + - * / % ( ) saja.');
  const tokens = input.match(/\d+(?:\.\d+)?|\.\d+|[()+*/%-]/g) || [];
  if (tokens.join('') !== input || tokens.length > 80) throw new Error('Ekspresi tidak valid.');
  let cursor = 0;
  function factor(depth = 0) {
    if (depth > 16) throw new Error('Ekspresi terlalu dalam.');
    if (tokens[cursor] === '-') { cursor++; return -factor(depth + 1); }
    if (tokens[cursor] === '+') { cursor++; return factor(depth + 1); }
    if (tokens[cursor] === '(') {
      cursor++;
      const n = sum(depth + 1);
      if (tokens[cursor++] !== ')') throw new Error('Kurung tidak lengkap.');
      return n;
    }
    const token = tokens[cursor++];
    if (!token || !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(token)) throw new Error('Angka tidak valid.');
    return Number(token);
  }
  function product(depth) {
    let n = factor(depth);
    while (['*', '/', '%'].includes(tokens[cursor])) {
      const op = tokens[cursor++];
      const r = factor(depth);
      n = op === '*' ? n * r : op === '/' ? n / r : n % r;
    }
    return n;
  }
  function sum(depth) {
    let n = product(depth);
    while (['+', '-'].includes(tokens[cursor])) {
      const op = tokens[cursor++];
      const r = product(depth);
      n = op === '+' ? n + r : n - r;
    }
    return n;
  }
  const result = sum(0);
  if (cursor !== tokens.length || !Number.isFinite(result) || Math.abs(result) > 1e15) throw new Error('Hasil tidak valid atau terlalu besar.');
  return Number(result.toPrecision(12));
}
async function handleTools(ctx) {
  const { cmd, reply, t, lang } = ctx;
  if (!TOOL_COMMANDS.has(cmd.name)) return false;
  const text = cmd.args.join(' ').slice(0, 2000);
  const requireText = () => { if (!text) throw new Error(t('toolInput')); };
  try {
    switch (cmd.name) {
      case 'tambah': case 'kurang': case 'kali': case 'bagi': {
        if (cmd.args.length !== 2 || cmd.args.some(x => !/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(x)))
          throw new Error(lang === 'en' ? 'Enter two numbers, e.g. tambah 10 5' : 'Masukkan dua angka, misalnya tambah 10 5');
        const [a,b] = cmd.args.map(Number);
        const expression = a + ({tambah:'+',kurang:'-',kali:'*',bagi:'/'}[cmd.name]) + b;
        await reply(expression + ' = ' + calculate(expression));
        break;
      }
      case 'cekdrive': {
        const disk = await statfs(process.cwd());
        const total = Number(disk.blocks) * Number(disk.bsize);
        const free = Number(disk.bavail) * Number(disk.bsize);
        const gb = n => (n / (1024 ** 3)).toFixed(2);
        await reply('Disk lokal bot: ' + gb(free) + ' GiB tersedia / ' + gb(total) + ' GiB total.');
        break;
      }
      case 'cekbandwidth': {
        await reply('Bandwidth jaringan tidak dapat diukur dari proses bot tanpa pemantauan antarmuka jaringan. Gunakan monitoring server/hosting; tidak ada angka palsu.');
        break;
      }
      case 'say': requireText(); await reply(text); break;
      case 'reverse': requireText(); await reply([...text].reverse().join('')); break;
      case 'count': requireText(); await reply(t('chars',{chars:[...text].length,words:text.trim().split(/\s+/).length})); break;
      case 'calc': case 'hitung': requireText(); await reply(text + ' = ' + calculate(text)); break;
      case 'pilih': {
        const items = text.split('|').map(s => s.trim()).filter(Boolean);
        if (items.length < 2 || items.length > 20) throw new Error(t('invalidOption'));
        await reply(t('pick',{choice:items[randomInt(items.length)]})); break;
      }
      case 'roll': {
        const max = cmd.args.length ? Number(cmd.args[0]) : 6;
        if (!Number.isInteger(max) || max < 2 || max > 1000) throw new Error('Maksimal angka: 2–1000.');
        await reply('🎲 ' + (randomInt(max) + 1) + ' / ' + max); break;
      }
      case 'coin': await reply(t(randomInt(2) ? 'coinHead' : 'coinTail')); break;
      case 'password': {
        const n = cmd.args.length ? Number(cmd.args[0]) : 16;
        if (!Number.isInteger(n) || n < 8 || n > 64) throw new Error(t('passLength'));
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        const data = randomBytes(n);
        await reply(t('passGenerated',{password:[...data].map(x => alphabet[x % alphabet.length]).join('')})); break;
      }
      case 'runtime': case 'speed': await reply(t('uptime',{seconds:Math.floor(process.uptime())})); break;
      case 'waktu': await reply((lang === 'en' ? 'Jakarta time: ' : 'WIB: ') + new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'medium' }).format(new Date())); break;
    }
  } catch (e) { await reply(t('toolInvalid',{error:e.message})); }
  return true;
}
module.exports = { TOOL_COMMANDS, handleTools, calculate };
