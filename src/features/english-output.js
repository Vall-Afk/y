'use strict';
// Localized messages for deterministic legacy game/RPG engine output.
// This deliberately operates ONLY on internally generated responses, never
// on arbitrary user chat, remote data or third-party API text.
function englishGame(message, lang) {
  if (lang !== 'en') return message;
  const pairs = [
    ['Game ini hanya untuk grup.', 'This game is only available in groups.'],
    ['Pilih lawan yang berbeda.', 'Choose a different opponent.'],
    ['Masih ada Tic Tac Toe aktif di grup.', 'There is already an active Tic Tac Toe in this group.'],
    ['Tic Tac Toe dimulai!', 'Tic Tac Toe started!'],
    ['Gunakan !tttmove 1-9.', 'Use tttmove 1-9.'],
    ['Tidak ada game Tic Tac Toe aktif.', 'No Tic Tac Toe game is active.'],
    ['Kamu bukan pemain game ini.', 'You are not part of this game.'],
    ['Belum giliranmu.', 'It is not your turn.'],
    ['Posisi tidak valid / sudah terisi.', 'Invalid or occupied position.'],
    ['Pemenang:', 'Winner:'],
    ['Seri!', 'Draw!'],
    ['Giliran:', 'Turn:'],
    ['Tidak ada game aktif.', 'No game is active.'],
    ['Hanya pemain atau admin yang boleh mengakhiri game.', 'Only players or admins may end this game.'],
    ['Tic Tac Toe dibatalkan.', 'Tic Tac Toe cancelled.'],
    ['Masih ada tebak angka aktif.', 'A number-guessing game is already active.'],
    ['Tebak angka 1–100! Gunakan !jawab <angka>. Maksimal 8 tebakan.', 'Guess a number from 1 to 100! Use jawab <number>. Maximum 8 guesses.'],
    ['Tidak ada permainan tebak angka aktif.', 'No number-guessing game is active.'],
    ['Tidak ada tebak angka aktif.', 'No number-guessing game is active.'],
    ['Masukkan angka 1–100.', 'Enter a number from 1 to 100.'],
    ['Benar! Jawaban:', 'Correct! Answer:'],
    ['Kesempatan habis! Jawaban:', 'No attempts left! Answer:'],
    ['Terlalu kecil.', 'Too low.'],
    ['Terlalu besar.', 'Too high.'],
    ['Sisa kesempatan:', 'Attempts remaining:'],
    ['Menyerah. Jawaban:', 'You gave up. Answer:']
  ];
  let output = String(message);
  for (const [id, en] of pairs) output = output.replaceAll(id, en);
  return output;
}
function englishRpg(message, lang) {
  if (lang !== 'en') return message;
  const pairs = [
    ['Kamu sudah terdaftar RPG.', 'You already joined RPG.'],
    ['Berhasil bergabung RPG!', 'Welcome to RPG!'],
    ['Identitas pengguna tidak didukung.', 'User identity is not supported.'],
    ['Daftar dulu: !joinrpg', 'Register first: joinrpg'],
    ['Aksi tidak tersedia.', 'This action is not available.'],
    ['Cooldown: tunggu ', 'Cooldown: wait '],
    [' menit.', ' minutes.'],
    ['HP tidak cukup. Gunakan !heal atau !buy meat 2.', 'Not enough HP. Use heal or buy meat 2.'],
    ['Berhasil ', 'Completed '],
    ['HP masih penuh.', 'HP is already full.'],
    ['Butuh 2 meat. Dapatkan dengan !hunt atau !buy meat 2.', 'Requires 2 meat. Get it with hunt or buy meat 2.'],
    ['HP pulih menjadi ', 'HP restored to '],
    ['Barang / jumlah tidak valid. Contoh: !sell fish 2', 'Invalid item/quantity. Example: sell fish 2'],
    ['Koin kurang. Butuh ', 'Not enough coins. Required: '],
    ['Barang tidak cukup.', 'Insufficient items.'],
    ['Saldo mencapai batas maksimal.', 'Maximum balance reached.'],
    ['Membeli ', 'Bought '],
    ['Menjual ', 'Sold '],
    [' seharga ', ' for '],
    [' koin. Saldo: ', ' coins. Balance: ']
  ];
  let output = String(message);
  for (const [id, en] of pairs) output = output.replaceAll(id, en);
  return output;
}
module.exports = { englishGame, englishRpg };
