'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const token = process.env.PANEL_TOKEN;
if (!token || token.length < 24) throw new Error('PANEL_TOKEN must be at least 24 characters');
let processBot = null;
let startedAt = 0;
let restarts = 0;
let expectedStop = false;
let restartTimer = null;
const logs = [];
function writeLog(data) {
  for (const line of String(data).split('\n')) {
    if (line.trim()) {
      logs.push(line.slice(0, 1000));
      if (logs.length > 100) logs.shift();
    }
  }
}
function startBot() {
  if (processBot) return;
  expectedStop = false;
  const p = spawn(process.execPath, ['--env-file-if-exists=.env', 'src/index.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  processBot = p;
  startedAt = Date.now();
  p.stdout.on('data', data => writeLog(data));
  p.stderr.on('data', data => writeLog(data));
  p.on('error', error => writeLog(error.message));
  p.on('close', () => {
    if (processBot !== p) return;
    processBot = null;
    startedAt = 0;
    if (!expectedStop) {
      restarts++;
      restartTimer = setTimeout(startBot, 5000);
    }
  });
}
function stopBot() {
  expectedStop = true;
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = null;
  if (processBot) processBot.kill('SIGTERM');
}
function reply(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
function allowed(req) {
  const provided = (req.headers.authorization || '').replace(/^Bearer /, '');
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(token).digest();
  return crypto.timingSafeEqual(a, b);
}
const page = fs.readFileSync(path.join(__dirname, 'index.html'));
http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' });
    return res.end(page);
  }
  if (req.url === '/healthz') return reply(res, 200, { status: 'ok' });
  if (!allowed(req)) return reply(res, 401, { error: 'Unauthorized' });
  if (req.url === '/api/status' && req.method === 'GET') {
    return reply(res, 200, { running: !!processBot, pid: processBot?.pid, uptime: startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0, restarts, logs });
  }
  if (req.method === 'POST') {
    if (req.url === '/api/start') startBot();
    else if (req.url === '/api/stop') stopBot();
    else if (req.url === '/api/restart') { stopBot(); setTimeout(startBot, 2000); }
    else return reply(res, 404, { error: 'Not found' });
    return reply(res, 200, { ok: true });
  }
  reply(res, 404, { error: 'Not found' });
}).listen(Number(process.env.PORT || 3000), '0.0.0.0');
if (process.env.BOT_AUTOSTART === 'true') startBot();
process.on('SIGTERM', () => { stopBot(); setTimeout(() => process.exit(0), 2000); });
