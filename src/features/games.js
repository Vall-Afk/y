'use strict';
const { randomInt } = require('node:crypto');
const { jid } = require('../util');
const { englishGame } = require('./english-output');
const GAME_COMMANDS = new Set(['tictactoe','ttt','tttmove','delttt','tebakangka','jawab','nyerah']);
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
class GameHub {
  constructor(now = () => Date.now(), rand = randomInt) {
    this.now = now;
    this.rand = rand;
    this.ttt = new Map();
    this.guesses = new Map();
  }
  cleanup(chat) {
    const t = this.ttt.get(chat), g = this.guesses.get(chat);
    if (t && t.expires < this.now()) this.ttt.delete(chat);
    if (g && g.expires < this.now()) this.guesses.delete(chat);
  }
  beginTTT(chat, x, o) {
    this.cleanup(chat);
    if (!chat.endsWith('@g.us')) return 'Game ini hanya untuk grup.';
    if (x === o) return 'Pilih lawan yang berbeda.';
    if (this.ttt.has(chat)) return 'Masih ada Tic Tac Toe aktif di grup.';
    this.ttt.set(chat, { x, o, board: Array(9).fill(''), turn: 'X', expires: this.now() + 20 * 60 * 1000 });
    return 'Tic Tac Toe dimulai!\nX: @' + x.split('@')[0] + '\nO: @' + o.split('@')[0] + '\nGunakan !tttmove 1-9.';
  }
  board(chat) {
    const g = this.ttt.get(chat);
    return g ? g.board.map((v, i) => v || String(i + 1)).reduce((r, v, i) => r + v + (i % 3 === 2 ? '\n' : ' | '), '') : '';
  }
  moveTTT(chat, sender, position) {
    this.cleanup(chat);
    const g = this.ttt.get(chat);
    if (!g) return 'Tidak ada game Tic Tac Toe aktif.';
    const player = sender === g.x ? 'X' : sender === g.o ? 'O' : null;
    if (!player) return 'Kamu bukan pemain game ini.';
    if (player !== g.turn) return 'Belum giliranmu.';
    if (!Number.isInteger(position) || position < 1 || position > 9 || g.board[position - 1]) return 'Posisi tidak valid / sudah terisi.';
    g.board[position - 1] = player;
    const board = this.board(chat);
    if (WINS.some(line => line.every(i => g.board[i] === player))) {
      this.ttt.delete(chat);
      return board + '\nPemenang: @' + sender.split('@')[0];
    }
    if (g.board.every(Boolean)) {
      this.ttt.delete(chat);
      return board + '\nSeri!';
    }
    g.turn = player === 'X' ? 'O' : 'X';
    g.expires = this.now() + 20 * 60 * 1000;
    return board + '\nGiliran: ' + g.turn;
  }
  cancel(chat, sender, isAdmin) {
    this.cleanup(chat);
    const game = this.ttt.get(chat);
    if (!game) return 'Tidak ada game aktif.';
    if (!isAdmin && sender !== game.x && sender !== game.o) return 'Hanya pemain atau admin yang boleh mengakhiri game.';
    this.ttt.delete(chat);
    return 'Tic Tac Toe dibatalkan.';
  }
  guessStart(chat) {
    this.cleanup(chat);
    if (this.guesses.has(chat)) return 'Masih ada tebak angka aktif.';
    this.guesses.set(chat, { answer: this.rand(1, 101), attempts: 0, expires: this.now() + 5 * 60 * 1000 });
    return 'Tebak angka 1–100! Gunakan !jawab <angka>. Maksimal 8 tebakan.';
  }
  guess(chat, value) {
    this.cleanup(chat);
    const game = this.guesses.get(chat);
    if (!game) return 'Tidak ada permainan tebak angka aktif.';
    if (!Number.isInteger(value) || value < 1 || value > 100) return 'Masukkan angka 1–100.';
    game.attempts++;
    if (value === game.answer) { this.guesses.delete(chat); return 'Benar! Jawaban: ' + value; }
    if (game.attempts >= 8) { this.guesses.delete(chat); return 'Kesempatan habis! Jawaban: ' + game.answer; }
    return (value < game.answer ? 'Terlalu kecil.' : 'Terlalu besar.') + ' Sisa kesempatan: ' + (8 - game.attempts);
  }
  surrender(chat) {
    this.cleanup(chat);
    const game = this.guesses.get(chat);
    if (!game) return 'Tidak ada tebak angka aktif.';
    this.guesses.delete(chat);
    return 'Menyerah. Jawaban: ' + game.answer;
  }
}
async function handleGames(ctx) {
  const { cmd, games, chat, sender, reply, message, roles, owner, config, sock, lang } = ctx;
  const en = text => englishGame(text, lang);
  if (!GAME_COMMANDS.has(cmd.name)) return false;
  if (!games) { await reply(lang === 'en' ? 'Games are unavailable.' : 'Game belum tersedia.'); return true; }
  const ctxInfo = message.message?.extendedTextMessage?.contextInfo || {};
  const participant = jid((ctxInfo.mentionedJid || [])[0] || '');
  if (cmd.name === 'tictactoe' || cmd.name === 'ttt') {
    if (!participant) { await reply(lang === 'en' ? 'Mention an opponent: ttt @member' : 'Tandai lawan: ttt @anggota'); return true; }
    const text = en(games.beginTTT(chat, sender, participant));
    await sock.sendMessage(chat, { text, mentions: [sender, participant] });
  } else if (cmd.name === 'tttmove') {
    await reply(en(games.moveTTT(chat, sender, Number(cmd.args[0]))));
  } else if (cmd.name === 'delttt') {
    let isAdmin = owner;
    if (chat.endsWith('@g.us') && !isAdmin) isAdmin = (await roles()).senderAdmin;
    await reply(en(games.cancel(chat, sender, isAdmin)));
  } else if (cmd.name === 'tebakangka') await reply(en(games.guessStart(chat)));
  else if (cmd.name === 'jawab') await reply(en(games.guess(chat, Number(cmd.args[0]))));
  else if (cmd.name === 'nyerah') await reply(en(games.surrender(chat)));
  return true;
}
module.exports = { GameHub, GAME_COMMANDS, handleGames };
