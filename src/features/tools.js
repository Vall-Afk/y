'use strict';
const { randomInt, randomBytes } = require('node:crypto');

const TOOL_COMMANDS = new Set(['say','reverse','count','calc','hitung','pilih','roll','coin','password','runtime','speed','waktu']);
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
  const { cmd, reply } = ctx;
  if (!TOOL_COMMANDS.has(cmd.name)) return false;
  const text = cmd.args.join(' ').slice(0, 2000);
  const requireText = () => { if (!text) throw new Error('Masukkan teks setelah perintah.'); };
  try {
    switch (cmd.name) {
      case 'say': requireText(); await reply(text); break;
      case 'reverse': requireText(); await reply([...text].reverse().join('')); break;
      case 'count': requireText(); await reply('Karakter: ' + [...text].length + '\nKata: ' + (text.trim().split(/\s+/).length)); break;
      case 'calc': case 'hitung': requireText(); await reply(text + ' = ' + calculate(text)); break;
      case 'pilih': {
        const items = text.split('|').map(s => s.trim()).filter(Boolean);
        if (items.length < 2 || items.length > 20) throw new Error('Contoh: !pilih makan | tidur | belajar');
        await reply('Pilihan: ' + items[randomInt(items.length)]); break;
      }
      case 'roll': {
        const max = cmd.args.length ? Number(cmd.args[0]) : 6;
        if (!Number.isInteger(max) || max < 2 || max > 1000) throw new Error('Maksimal angka: 2–1000.');
        await reply('🎲 ' + (randomInt(max) + 1) + ' / ' + max); break;
      }
      case 'coin': await reply(randomInt(2) ? 'Koin: angka' : 'Koin: gambar'); break;
      case 'password': {
        const n = cmd.args.length ? Number(cmd.args[0]) : 16;
        if (!Number.isInteger(n) || n < 8 || n > 64) throw new Error('Panjang password 8–64.');
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        const data = randomBytes(n);
        await reply('Password acak (jangan bagikan): ' + [...data].map(x => alphabet[x % alphabet.length]).join('')); break;
      }
      case 'runtime': case 'speed': await reply('Uptime: ' + Math.floor(process.uptime()) + ' detik'); break;
      case 'waktu': await reply('WIB: ' + new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'medium' }).format(new Date())); break;
    }
  } catch (e) { await reply('Input tidak valid: ' + e.message); }
  return true;
}
module.exports = { TOOL_COMMANDS, handleTools, calculate };
