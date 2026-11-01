'use strict';
const NET_COMMANDS = new Set(['github', 'gitclone', 'wiki', 'cuaca']);
const ORIGINS = new Set([
  'https://api.github.com',
  'https://codeload.github.com',
  'https://id.wikipedia.org',
  'https://geocoding-api.open-meteo.com',
  'https://api.open-meteo.com'
]);
async function boundedFetch(url, options = {}) {
  const u = new URL(url);
  if (!ORIGINS.has(u.origin) || u.username || u.password) throw new Error('Endpoint tidak diizinkan.');
  const fetcher = options.fetcher || globalThis.fetch;
  const result = await fetcher(u.href, {
    method: 'GET', redirect: 'error',
    signal: AbortSignal.timeout(options.timeout || 12000),
    headers: { 'User-Agent': 'BeauteBot/1.1 (GitHub: Vall-Afk/y)', 'Accept': u.hostname === 'codeload.github.com' ? 'application/zip' : 'application/json' }
  });
  if (!result.ok) throw new Error('Layanan sedang gagal (HTTP ' + result.status + ').');
  const max = options.maxBytes || 256 * 1024;
  if (Number(result.headers.get('content-length') || '0') > max) throw new Error('Respons terlalu besar.');
  if (!result.body) throw new Error('Respons kosong.');
  const chunks = [];
  let total = 0;
  for await (const chunk of result.body) {
    total += chunk.length;
    if (total > max) { await result.body.cancel?.().catch(() => {}); throw new Error('Respons terlalu besar.'); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, total);
}
async function jsonFetch(url, options) {
  const buffer = await boundedFetch(url, options);
  return JSON.parse(buffer.toString('utf8'));
}
function repoInput(text) {
  const value = text.trim().replace(/\.git$/i, '').replace(/^https:\/\/github\.com\//i, '');
  const parts = value.split('/');
  if (parts.length !== 2 || !/^[a-z0-9](?:[a-z0-9-]{0,38})$/i.test(parts[0]) ||
      !/^[a-z0-9_.-]{1,100}$/i.test(parts[1])) throw new Error('Contoh: !github owner/repo');
  return parts;
}
function simpleText(value, max = 1000) { return String(value || '').replace(/[\x00-\x1f]+/g, ' ').slice(0, max); }
async function handleNetwork(ctx) {
  const { cmd, reply, sock, chat, message, config, economy, sender, owner, fetcher } = ctx;
  if (!NET_COMMANDS.has(cmd.name)) return false;
  const text = cmd.args.join(' ').trim();
  if (!text || text.length > 120) { await reply('Masukkan kata kunci / nama repo (maksimal 120 karakter).'); return true; }
  if (economy && !owner) {
    const can = await economy.consume(sender);
    if (!can) { await reply('Limit harian habis. Gunakan !daily lalu !buylimit, atau hubungi owner untuk premium.'); return true; }
  }
  try {
    if (cmd.name === 'github' || cmd.name === 'gitclone') {
      const [user, repo] = repoInput(text);
      const data = await jsonFetch('https://api.github.com/repos/' + user + '/' + repo, { fetcher });
      if (data.private || data.archived && cmd.name === 'gitclone') throw new Error('Repository tidak didukung untuk download.');
      if (cmd.name === 'github') {
        await reply('*GitHub*\n' + simpleText(data.full_name, 120) +
          '\n⭐ ' + Number(data.stargazers_count || 0) +
          '\nBahasa: ' + simpleText(data.language, 50) +
          '\n' + simpleText(data.description, 500) +
          '\nhttps://github.com/' + user + '/' + repo);
        return true;
      }
      const branch = data.default_branch;
      if (typeof branch !== 'string' || branch.length > 100 || !/^[\w./-]+$/.test(branch) ||
          branch.includes('..')) throw new Error('Nama branch tidak didukung.');
      const archive = await boundedFetch('https://codeload.github.com/' + user + '/' + repo +
        '/zip/refs/heads/' + branch.split('/').map(encodeURIComponent).join('/'), {
        fetcher, maxBytes: 8 * 1024 * 1024, timeout: 20000
      });
      if (archive.subarray(0, 2).toString('hex') !== '504b') throw new Error('File ZIP tidak valid.');
      await sock.sendMessage(chat, {
        document: archive, fileName: repo + '.zip',
        mimetype: 'application/zip',
        caption: 'Source publik GitHub: ' + user + '/' + repo
      }, { quoted: message });
      return true;
    }
    if (cmd.name === 'wiki') {
      const data = await jsonFetch('https://id.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&titles=' + encodeURIComponent(text), { fetcher });
      const page = Object.values(data.query?.pages || {})[0];
      const extract = simpleText(page?.extract, 1500);
      await reply(extract || 'Artikel tidak ditemukan.');
      return true;
    }
    if (cmd.name === 'cuaca') {
      const place = await jsonFetch('https://geocoding-api.open-meteo.com/v1/search?name=' +
        encodeURIComponent(text) + '&count=1&language=id&format=json', { fetcher });
      const city = place.results?.[0];
      if (!city || !Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) {
        await reply('Kota tidak ditemukan.'); return true;
      }
      const data = await jsonFetch('https://api.open-meteo.com/v1/forecast?latitude=' +
        city.latitude + '&longitude=' + city.longitude +
        '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=auto', { fetcher });
      const current = data.current;
      if (!current) throw new Error('Cuaca belum tersedia.');
      await reply('Cuaca ' + simpleText(city.name, 100) +
        '\n🌡️ ' + current.temperature_2m + '°C' +
        '\nKelembapan: ' + current.relative_humidity_2m + '%' +
        '\nHujan: ' + current.precipitation + ' mm' +
        '\nKode cuaca: ' + current.weather_code +
        '\nSumber: Open-Meteo');
      return true;
    }
  } catch (e) {
    await reply('Layanan gagal: ' + simpleText(e.message, 200));
  }
  return true;
}
module.exports = { NET_COMMANDS, handleNetwork, boundedFetch, jsonFetch, repoInput };
