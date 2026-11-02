'use strict';
// WhatsApp-friendly (text-only) internationalized menu. No inert entries.
const SECTIONS = Object.freeze([
  {
    id: 'main', icon: '✦', idTitle: 'UMUM', enTitle: 'GENERAL',
    commands: ['menu', 'ping', 'status', 'owner', 'credits', 'script', 'donate', 'bahasa id|en', 'listbahasa', 'afk [alasan]']
  },
  {
    id: 'tools', icon: '⚙', idTitle: 'TOOLS', enTitle: 'TOOLS',
    commands: ['calc 10+5*2', 'tambah 10 5', 'kurang 10 5', 'kali 10 5', 'bagi 10 5',
      'jeda 2', 'nowa 628xxx', 'getquoted', 'say <teks>', 'reverse <teks>', 'count <teks>', 'pilih a | b', 'roll [max]',
      'coin', 'password [8-64]', 'waktu', 'runtime', 'cekdrive', 'cekbandwidth']
  },
  {
    id: 'group', icon: '♧', idTitle: 'MANAJEMEN GRUP', enTitle: 'GROUP MANAGEMENT',
    commands: ['groupinfo', 'welcome on|off', 'left on|off', 'antilink on|off', 'antiwame on|off',
      'setwelcome <teks>', 'setleft <teks>', 'delsetwelcome', 'delsetleft',
      'antispam on|off', 'warn @user', 'unwarn @user', 'listwarn',
      'rules', 'setrules <teks>', 'addresponse key | reply',
      'listresponse', 'setcmd keyword | reply', 'delcmd keyword', 'setopen 08:00', 'setclose 22:00', 'listschedule', 'checksewa', 'hargasewa',
      'tagall [teks]', 'hidetag [teks]', 'kick @user', 'add 62xxx', 'promote @user',
      'demote @user', 'open', 'close', 'linkgc', 'revoke', 'setnamegc <nama>', 'setdesc <teks>',
      'setppgc (reply gambar)', 'delppgc']
  },
  {
    id: 'store', icon: '▦', idTitle: 'TOKO / GRUP', enTitle: 'GROUP STORE',
    commands: ['list', 'list <nama>', 'addlist nama | isi', 'update nama | isi', 'dellist nama',
      'setproses <teks>', 'setdone <teks>', 'proses (reply)', 'done (reply)', 'delsetproses', 'delsetdone']
  },
  {
    id: 'media', icon: '✎', idTitle: 'STIKER / MEDIA', enTitle: 'STICKERS / MEDIA',
    commands: ['sticker', 'toimg', 'attp <teks>', 'emojimix 😀+😎', 'nuliskiri <teks>', 'ttp <teks>', 'smeme ATAS | BAWAH', 'react ❤️ (reply)',
      'brat <teks>', 'qc (reply)', 'stickerwm Pack | Author', 'blur [1-30]', 'grayscale', 'invert',
      'rotate 90', 'flip', 'mirror', 'pixelate', 'circle', 'enhance', 'compress', 'resize 512',
      'tomp3 (reply)', 'toaudio (reply)', 'tovn (reply)', 'tovideo (reply sticker)',
      'tosticker (reply video)', 'togif (reply image)']
  },
  {
    id: 'anonymous', icon: '♧', idTitle: 'CHAT ANONIM', enTitle: 'ANONYMOUS CHAT',
    commands: ['anonymous', 'start', 'next', 'stop', 'sendprofile (both consent)']
  },
  {
    id: 'storage', icon: '▣', idTitle: 'MEDIA TERSIMPAN', enTitle: 'SAVED MEDIA',
    commands: ['addstik key', 'liststik', 'getstik key', 'delstik key',
      'addimg key', 'listimg', 'getimg key', 'delimg key',
      'addvn key', 'listvn', 'getvn key', 'delvn key',
      'addvid key', 'listvid', 'getvid key', 'delvid key']
  },
  {
    id: 'textfx', icon: '✧', idTitle: 'EFEK TEKS', enTitle: 'TEXT EFFECTS',
    commands: ['textfx list [page]', 'textfx neon Beauté', 'neon <teks>', 'glitch <teks>', 'rainbow <teks>',
      'halloween <teks>', 'ice <teks>', 'fire <teks>', 'matrix <teks>',
      'snow <teks>', 'wood <teks>', 'metallic <teks>', 'space <teks>',
      'watercolor <teks>', 'christmas <teks>']
  },
  {
    id: 'game', icon: '♜', idTitle: 'GAME', enTitle: 'GAMES',
    commands: ['tictactoe @user', 'tttmove 1-9', 'delttt', 'tebakangka', 'jawab <angka>', 'nyerah']
  },
  {
    id: 'rpg', icon: '⚔', idTitle: 'RPG WORLD', enTitle: 'RPG WORLD',
    commands: ['joinrpg', 'inventory', 'level', 'rpgshop', 'mining', 'nebang', 'mancing',
      'hunt', 'adventure', 'heal', 'buy <item> <jumlah>', 'sell <item> <jumlah>',
      'lebur [jumlah]', 'craft sword|pickaxe', 'equip sword|pickaxe',
      'killslime', 'killgoblin', 'killdevil', 'killbehemoth', 'killdemon',
      'killdemonking', 'luckyday', 'goplanet', 'jualbahankimia [jumlah]', 'toprpg']
  },
  {
    id: 'economy', icon: '◇', idTitle: 'EKONOMI', enTitle: 'ECONOMY',
    commands: ['daily', 'balance', 'limit', 'buylimit', 'buyglimit (group)', 'transfer 62xxx 100', 'topglobal',
      'toplocal', 'cekpremium']
  },
  {
    id: 'search', icon: '⌕', idTitle: 'INTERNET', enTitle: 'INTERNET',
    commands: ['github owner/repo', 'gitclone owner/repo', 'wiki <topik>', 'cuaca <kota>',
      'translate en <teks>', 'lirik <judul>', 'ytsearch <judul>', 'play <judul>',
      'pinterest <keyword>', 'grupwa <keyword>', 'mediafire <URL>', 'searchbyimage (reply image)',
      'ytmp3 <YouTube URL>', 'ytmp4 <YouTube URL>',
      'tiktok <TikTok URL>', 'tiktokaudio <TikTok URL>',
      'instagram <Instagram URL>']
  }
]);
const DOWNLOAD_GUIDE = Object.freeze([
  'ytmp3 <YouTube URL>', 'ytmp4 <YouTube URL>',
  'tiktok <TikTok URL>', 'tiktoknowm <TikTok URL>', 'tiktokaudio <TikTok URL>',
  'instagram <Instagram URL>', 'igphoto <Instagram URL>',
  'igvideo <Instagram URL>', 'igreels <Instagram URL>'
]);
const ACADEMIC = Object.freeze([
  'statadv 10 20 30 40', 'ujit 2,3,4,5 | 3', 'chisquare 10,20,30 | 15,20,25',
  'covariance 1,2,3 | 2,4,6', 'bayes 0.01 0.95 0.05',
  'zscore 75 60 10', 'ci95 100 15 100', 'sharpe 0.12 0.04 0.2',
  'obligasi 1000000 0.08 0.1 5', 'kuisstat 1', 'regresi 1,2;2,4;3,6', 'mathadv sqrt 81',
  'keuangan 1000000 0.05 12', 'investasi 0.04 1.2 0.10',
  'npv 0.1 -1000 400 400 400', 'irr -1000 600 600', 'portofolio 0.6 0.1 0.08 0.2 0.1 0.3',
  'peluang binomial 10 3 0.5', 'anova 1,2,3;4,5,6',
  'multivariat 3 4', 'gregorian 2026-11-02', 'liturgi 2027',
  'alkitab Matius 1:1', 'vulgata Ioannes III:XVI', 'google <pencarian>', 'ai <pertanyaan>'
]);
const PREMIUM = Object.freeze(['jadibot 628xxxx (pairing)', 'jadibot qr', 'cekjadibot', 'stopjadibot']);
const OWNER = Object.freeze(['mode public|private', 'self', 'public', 'dashboard',
  'autoread on|off', 'autobio on|off', 'autorespond on|off', 'anticall on|off',
  'addpremium 62xxx 30', 'delpremium 62xxx', 'listpremium',
  'addsewa <group@g.us> bulan|minggu', 'joinsewa https://chat.whatsapp.com/KODE bulan|minggu', 'delsewa <group@g.us>', 'listsewa', 'backup (private DM)',
  'join <invite link> (DM)', 'leavegc (group)', 'setnamebot <teks>',
  'setbiobot <teks>', 'setppbot (reply gambar)', 'delppbot']);
const ALIASES = Object.freeze({
  menu: 'all', help: 'all', allmenu: 'all',
  menugroup: 'group', menugrup: 'group',
  menustore: 'store', menutoko: 'store', menumedia: 'media',
  menuchat: 'anonymous', menuanonymous: 'anonymous',
  menutextpro: 'textfx', menutextfx: 'textfx',
  menustorage: 'storage', menulibrary: 'storage',
  menutools: 'tools', menugame: 'game', menurpg: 'rpg',
  menuekonomi: 'economy', menudownload: 'downloads',
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
  if (target === 'academic') {
    pieces.push('\\n╭─── 📚 AKADEMIK & KALENDER ───╮');
    pieces.push(ACADEMIC.map(x => '│ • ' + x).join('\\n'));
    pieces.push('╰────────────────────────╯');
    pieces.push('Kitab Suci: referensi tersedia; teks ayat belum terintegrasi.');
  }
  if (target === 'downloads') {
    pieces.push('\\n╭─── ⬇ ' + (english ? 'MEDIA DOWNLOADS' : 'UNDUH MEDIA') + ' ───╮');
    pieces.push(DOWNLOAD_GUIDE.map(x => '│ • ' + x).join('\\n'));
    pieces.push('╰────────────────────╯');
    pieces.push(english ? 'Public links only • yt-dlp required • max 12 MB.' :
      'Hanya tautan publik • perlu yt-dlp • maksimal 12 MB.');
  }
  if (all || target === 'premium') {
    pieces.push('\n╔═══ ✧ JADIBOT GRATIS ✧ ═══╗');
    pieces.push((english ? '✧ Free Jadibot; one shared child bot slot'
      : '✧ Jadibot gratis; satu slot bersama'));
    pieces.push(PREMIUM.map(x => '┃ ✧ ' + x).join('\n'));
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
        ...PREMIUM.map(x => '✧ ' + x),
        '\n♛ ' + (english ? 'OWNER COMMANDS: menuowner' : 'PERINTAH OWNER: menuowner'),
        '\n' + (english ? 'More categories: menugroup · menustore · menupremium'
          : 'Menu lengkap: menugroup · menustore · menupremium')
      ].join('\n').slice(0, 3700);
    }
  }
  return result;
}
module.exports = { menu, SECTIONS, PREMIUM, OWNER, ALIASES };
