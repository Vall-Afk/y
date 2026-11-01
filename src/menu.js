'use strict';
// WhatsApp-friendly (text-only) internationalized menu. No inert entries.
const SECTIONS = Object.freeze([
  {
    id: 'main', icon: '✦', idTitle: 'UMUM', enTitle: 'GENERAL',
    commands: ['menu', 'ping', 'status', 'owner', 'bahasa id|en', 'listbahasa', 'afk [alasan]']
  },
  {
    id: 'tools', icon: '⚙', idTitle: 'TOOLS', enTitle: 'TOOLS',
    commands: ['calc 10+5*2', 'tambah 10 5', 'kurang 10 5', 'kali 10 5', 'bagi 10 5',
      'say <teks>', 'reverse <teks>', 'count <teks>', 'pilih a | b', 'roll [max]',
      'coin', 'password [8-64]', 'waktu', 'runtime']
  },
  {
    id: 'group', icon: '♧', idTitle: 'MANAJEMEN GRUP', enTitle: 'GROUP MANAGEMENT',
    commands: ['groupinfo', 'welcome on|off', 'left on|off', 'antilink on|off', 'antiwame on|off',
      'setwelcome <teks>', 'setleft <teks>', 'delsetwelcome', 'delsetleft',
      'tagall [teks]', 'hidetag [teks]', 'kick @user', 'add 62xxx', 'promote @user',
      'demote @user', 'open', 'close', 'linkgc', 'revoke', 'setnamegc <nama>', 'setdesc <teks>']
  },
  {
    id: 'store', icon: '▦', idTitle: 'TOKO / GRUP', enTitle: 'GROUP STORE',
    commands: ['list', 'list <nama>', 'addlist nama | isi', 'update nama | isi', 'dellist nama']
  },
  {
    id: 'media', icon: '✎', idTitle: 'STIKER / MEDIA', enTitle: 'STICKERS / MEDIA',
    commands: ['sticker', 'toimg', 'ttp <teks>', 'smeme ATAS | BAWAH']
  },
  {
    id: 'game', icon: '♜', idTitle: 'GAME', enTitle: 'GAMES',
    commands: ['tictactoe @user', 'tttmove 1-9', 'delttt', 'tebakangka', 'jawab <angka>', 'nyerah']
  },
  {
    id: 'rpg', icon: '⚔', idTitle: 'RPG WORLD', enTitle: 'RPG WORLD',
    commands: ['joinrpg', 'inventory', 'level', 'rpgshop', 'mining', 'nebang', 'mancing',
      'hunt', 'adventure', 'heal', 'buy <item> <jumlah>', 'sell <item> <jumlah>']
  },
  {
    id: 'economy', icon: '◇', idTitle: 'EKONOMI', enTitle: 'ECONOMY',
    commands: ['daily', 'balance', 'limit', 'buylimit', 'transfer 62xxx 100', 'topglobal',
      'toplocal', 'cekpremium']
  },
  {
    id: 'search', icon: '⌕', idTitle: 'INTERNET', enTitle: 'INTERNET',
    commands: ['github owner/repo', 'gitclone owner/repo', 'wiki <topik>', 'cuaca <kota>']
  }
]);
const PREMIUM = Object.freeze(['jadibot 628xxxx (pairing)', 'jadibot qr', 'cekjadibot', 'stopjadibot']);
const OWNER = Object.freeze(['mode public|private', 'self', 'public',
  'addpremium 62xxx 30', 'delpremium 62xxx', 'listpremium']);
const ALIASES = Object.freeze({
  menu: 'all', help: 'all', allmenu: 'all',
  menugroup: 'group', menugrup: 'group',
  menustore: 'store', menutoko: 'store', menumedia: 'media',
  menutools: 'tools', menugame: 'game', menurpg: 'rpg',
  menuekonomi: 'economy', menudownload: 'search',
  menupremium: 'premium', menuowner: 'owner',
  menubahasa: 'language'
});
function menu(config, section = 'menu', profile = {}) {
  const lang = profile.lang === 'en' ? 'en' : 'id';
  const english = lang === 'en';
  const all = (ALIASES[section] || section) === 'all';
  const target = ALIASES[section] || section;
  const member = profile.owner ? (english ? 'OWNER' : 'OWNER')
    : profile.premium ? 'PREMIUM' : 'FREE';
  const title = String(config.name || 'Beauté.').slice(0, 50);
  const header = [
    '╭━━━━━━━━━━━━━━━━━━╮',
    '    ✧ *' + title + '* ✧',
    '    WhatsApp • Legacy × Modern',
    '╰━━━━━━━━━━━━━━━━━━╯',
    '  ♡ ' + (english ? 'Creator' : 'Kreator') + ': *' + config.ownerName + '*',
    '  ◇ GitHub: *Vall-Afk*',
    '  ✦ IG: *@' + config.ownerInstagram + '*',
    '  🌐 ' + (english ? 'Language' : 'Bahasa') + ': *' + lang.toUpperCase() + '*',
    '  ✧ ' + (english ? 'Your tier' : 'Statusmu') + ': *' + member + '*'
  ];
  if (typeof profile.balance === 'number' && Number.isFinite(profile.balance)) {
    header.push('  ◈ ' + (english ? 'Coins' : 'Koin') + ': ' + profile.balance.toLocaleString(english ? 'en-US' : 'id-ID'));
  }
  const sep = '\n┏━━━ ✦ ';
  function groupText(group) {
    return sep + group.icon + ' ' + (english ? group.enTitle : group.idTitle) +
      ' ━━━┓\n' + group.commands.map(x => '┃ ◦ ' + x).join('\n') + '\n┗━━━━━━━━━━━━┛';
  }
  const free = SECTIONS.filter(g => all || g.id === target);
  const pieces = [...header];
  if (free.length) {
    pieces.push('\n╔═══ ' + (english ? 'FREE FEATURES' : 'FITUR GRATIS') + ' ═══╗');
    pieces.push(...free.map(groupText));
  }
  if (all || target === 'premium') {
    pieces.push('\n╔═══ ★ PREMIUM EXCLUSIVE ★ ═══╗');
    pieces.push((english ? '✧ Unlimited supported API quota + one shared child bot slot'
      : '✧ Kuota API tanpa batas + satu slot Jadibot bersama'));
    pieces.push(PREMIUM.map(x => '┃ ★ ' + x).join('\n'));
    pieces.push('╚══════════════════════╝');
  }
  if (all || target === 'owner') {
    pieces.push('\n╔═══ ♛ ' + (english ? 'OWNER ONLY' : 'KHUSUS OWNER') + ' ═══╗');
    pieces.push(OWNER.map(x => '┃ ♛ ' + x).join('\n'));
    pieces.push('╚═══════════════════╝');
  }
  if (target === 'language') {
    pieces.push('\n🌐 ' + (english ? 'Choose:' : 'Pilih:') +
      '\n ◦ bahasa id\n ◦ language en\n ◦ listbahasa');
  }
  if (all) {
    pieces.push('\n' + (english
      ? 'Tip: send "menugroup", "menustore", or "menupremium" for category details.'
      : 'Tip: ketik menugroup, menustore, atau menupremium untuk detail kategori.'));
  }
  pieces.push('\n' + (english
    ? '✧ No prefix required • Old ! commands still work.'
    : '✧ Tanpa prefix • Perintah ! tetap bisa.'));
  const result = pieces.join('\n');
  if (result.length > 3700) {
    // Avoid truncated category menus: a compact main menu lists categories with
    // a preview, while the category commands remain available individually.
    if (all) {
      return [...header, '\n╔═══ ' + (english ? 'FREE FEATURES' : 'FITUR GRATIS') + ' ═══╗',
        ...SECTIONS.map(g => g.icon + ' *' + (english ? g.enTitle : g.idTitle) +
          '*\n ' + (g.id === 'group'
            ? ['groupinfo', 'antilink', 'promote', 'tagall']
            : g.commands.slice(0, 4)).join(' · ') +
          '\n ' + (english ? 'See:' : 'Lihat:') + ' ' +
          (Object.keys(ALIASES).find(k => ALIASES[k] === g.id) || 'menu')),
        '\n╔═══ ★ PREMIUM EXCLUSIVE ★ ═══╗',
        ...PREMIUM.map(x => '★ ' + x),
        '\n♛ ' + (english ? 'OWNER COMMANDS: menuowner' : 'PERINTAH OWNER: menuowner'),
        '\n' + (english ? 'More categories: menugroup · menustore · menupremium'
          : 'Menu lengkap: menugroup · menustore · menupremium')
      ].join('\n').slice(0, 3700);
    }
  }
  return result;
}
module.exports = { menu, SECTIONS, PREMIUM, OWNER, ALIASES };
