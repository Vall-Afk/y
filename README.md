<div align="center">

# ✦ Beauté. ✦
### WhatsApp Multi-Device Bot — Legacy × Modern

**Legacy Complete Roadmap · Version 1.5.0 (staged migration)**

**Tanpa prefix · Free & Premium · Bahasa Indonesia & English · Jadibot 1 Sesi**

[**🔗 LINK SCRIPT BEAUTÉ.**](https://github.com/Vall-Afk/y/tree/feature/beaute-legacy-modern) · [**GitHub Repository**](https://github.com/Vall-Afk/y) · [**Status Migrasi**](FEATURES.md) · [**Audit 428 Perintah**](LEGACY_COMMAND_MATRIX.md)

</div>

---

## ♛ Credits / Kredit

| Identitas | Nama / Akun |
|---|---|
| Nama / Name | **Vall** |
| Owner BOT | **Vall** — WhatsApp: 6287721373781 |
| Recoder | **Vall** |
| Owner source code versi modifikasi | **Vall-Afk** |
| GitHub | **[@Vall-Afk](https://github.com/Vall-Afk)** |
| Instagram | **[@v4lonenonly](https://www.instagram.com/v4lonenonly/)** |
| Nama bot | **Beauté.** |
| Source / Script | **https://github.com/Vall-Afk/y** |

### ♡ Thanks To
- **Tritunggal Mahakudus**
- **Orang Tua**
- **Keluarga**
- **Saya sendiri**

**Original project attribution:** kode legacy dalam repository berasal dari proyek terdahulu termasuk **Haruka-Md / ZeeoneOfc**, sebagaimana disebutkan README dan package source v9.1. Beauté. ini adalah *recode/pengembangan versi modifikasi* oleh Vall, bukan klaim kepemilikan atas karya kontributor asal. Hak cipta, lisensi, dan pemberitahuan atribusi karya pihak lain tetap harus dihormati.

---

## 📦 Link Script

**GitHub:** https://github.com/Vall-Afk/y

**Versi pengembangan Beauté. (fitur terbaru):**
https://github.com/Vall-Afk/y/tree/feature/beaute-legacy-modern

**Buka / unduh source melalui GitHub** menggunakan tautan di atas (menu **Code → Download ZIP**) atau Git clone. Branch default v9.1 berisi source lama dan **belum** otomatis menerima perubahan di branch pengembangan. Gunakan branch yang tertulis di atas jika ingin menjalankan Beauté. versi ini.

> **Penting:** Legacy Complete adalah *roadmap migrasi*, belum berarti 428 command lama sudah sepenuhnya berfungsi. Periksa daftar yang sudah aktif di FEATURES.md, hasil audit di LEGACY_AUDIT.md, serta [matriks status 428 perintah](LEGACY_COMMAND_MATRIX.md).

## ⚙️ Persyaratan / Requirements

- **Windows PowerShell atau Command Prompt** (tersedia juga pada OS lain yang mendukung Node.js).
- **Node.js 22 atau lebih baru**, dan **Git**.
- Akun WhatsApp yang kamu kendalikan untuk pairing bot utama.
- Koneksi internet aktif. Terminal harus tetap berjalan supaya bot merespons.
- Akun WhatsApp **kedua yang berbeda** bila ingin menguji Jadibot.

> Di PowerShell gunakan **npm.cmd**, bukan npm. Tidak perlu mengubah kebijakan keamanan eksekusi PowerShell.

## 🚀 Cara install baru — Windows PowerShell

Buka PowerShell, kemudian:

~~~powershell
git clone --branch feature/beaute-legacy-modern https://github.com/Vall-Afk/y.git
cd y
Copy-Item .env.example .env
notepad .env
~~~

Isi file .env dengan identitas yang benar; contoh:

~~~dotenv
OWNER_NUMBER=6287721373781
OWNER_NAME=Vall
OWNER_INSTAGRAM=v4lonenonly
BOT_NAME=Beauté.
PREFIX=!
~~~

Kemudian jalankan:

~~~powershell
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd audit --omit=dev
npm.cmd start
~~~

Pada koneksi pertama, pindai QR utama di terminal dari **WhatsApp → Perangkat tertaut → Tautkan perangkat**. Bila sesi utama sudah ada dan valid, bot akan menggunakan sesi tersebut tanpa perlu pairing ulang.

## 🔄 Update untuk instalasi yang sudah berhasil — D:\y

**Hentikan bot dengan Ctrl+C** terlebih dahulu. Di PowerShell:

~~~powershell
Set-Location D:\y
git status --short
git switch feature/beaute-legacy-modern
git fetch origin
git pull --ff-only origin feature/beaute-legacy-modern
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd audit --omit=dev
npm.cmd start
~~~

Jika ada perubahan lokal yang belum disimpan, selesaikan terlebih dahulu agar git pull tidak berbenturan. Jangan pernah menghapus **.env**, **data/auth**, atau database di **data/** untuk sekadar update. Folder tersebut berisi login serta data pengguna. Pastikan tidak ada proses bot lain yang membuka sesi yang sama.

## ✨ Menu dan fitur Free vs Premium

Ketik **menu** melalui chat ke Beauté. Menu menampilkan **FITUR GRATIS / FREE FEATURES**, **PREMIUM EXCLUSIVE**, dan **KHUSUS OWNER / OWNER ONLY** dengan pemisahan jelas.

| FREE — Gratis | PREMIUM — Berbayar/akses admin |
|---|---|
| Menu, status, owner, ganti bahasa, AFK | **Jadibot via pairing code** |
| Manajemen grup dan welcome/left untuk admin | **Jadibot via QR** |
| Daftar toko grup: list, addlist, update, dellist | **1 slot Jadibot tambahan GLOBAL** untuk semua premium |
| Status pesanan proses/done di grup | **Kuota command network yang didukung tanpa batas harian** |
| Tools, hitungan, konverter stiker & TTP/SMEME | Sesi terpisah dari akun bot utama |
| RPG, game, ekonomi virtual, daily, balance | Premium dapat dikelola HANYA oleh owner bot |
| Wiki, cuaca, GitHub / Gitclone (kuota network free berlaku) | Perpanjangan dengan addpremium oleh owner |

**Free**: fitur lookup/API publik tertentu memiliki kuota harian (saat ini 20 + tambahan limit yang dibeli menggunakan koin virtual). **Premium**: tidak dikenai kuota harian tersebut pada command yang sudah menerapkan batas itu. Pengaturan grup hanya boleh diubah admin grup; perintah owner seperti addpremium tidak pernah otomatis menjadi hak semua pengguna premium.

**Semua perintah tidak perlu prefix**. Contoh: **menu**, **ping**, **inventory**, **daily**, **calc 10+5*2**. Bentuk lama **!menu** tetap berlaku. Bot hanya mengenali *kata pertama yang cocok persis*, bukan percakapan yang kebetulan mengandung kata menu.

### 📚 Perintah cepat

~~~text
menu                  → menu utama (Free / Premium / Owner)
menugroup             → fitur grup
menustore             → katalog toko dan status pesanan
menumedia             → stiker dan media
menurpg               → RPG
menupremium           → Jadibot Premium
menutools             → utilitas dan kalkulator
language en           → gunakan English
bahasa id             → kembali ke Bahasa Indonesia
listbahasa            → pilihan bahasa
~~~

### 🛒 Migrasi fitur Store dari source lama

Di grup, **admin grup** dapat menjalankan:

~~~text
addlist harga | Burger 20k
update harga | Burger 22k
dellist harga
list
list harga
setproses ⏳ Pesanan {order} sedang disiapkan untuk {user}
setdone ✅ Pesanan {order} selesai untuk {user}
delsetproses
delsetdone
~~~

Anggota boleh membaca daftar toko lewat **list** atau **list harga**, tetapi tidak boleh mengubah isinya. Untuk status order, **balas pesan pesanan** lalu admin mengetik **proses** atau **done**. Template mendukung **{order}**, **{user}**, dan **{group}**, dibatasi panjangnya, serta disimpan per grup.

### 🌐 Bahasa Inggris / English Language

~~~text
language en
menu
status
menugroup
inventory
wiki Earth
~~~

**English:** Send **language en** to switch the bot's menu and supported replies into English; send **bahasa id** to switch back. Your selection is saved per user, even after restarting the process. You can also preview the English main menu with **menu en**. Keywords are stable (some command names remain Indonesian for compatibility). Menus, core commands, main group operations, store, economy, tools, AFK and common RPG/game responses have English support; some inherited messages, third-party errors and external content may remain untranslated during subsequent phases.

## 💎 Jadibot Premium — maks. SATU sesi tambahan

Hanya member dengan premium aktif (atau main owner) yang boleh memakai Jadibot. **Batas 1 sesi berlaku global** untuk seluruh pengguna bot, bukan satu sesi per orang. Sesi tambahan berjalan pada proses Node.js yang sama.

1. Owner utama memberi premium (contoh 30 hari):

   ~~~text
   addpremium 6281111111111 30
   ~~~

2. Pengguna premium mengirim **chat pribadi ke bot utama**, bukan ke grup. Pilih salah satu:

   ~~~text
   jadibot 6282222222222
   jadibot qr
   ~~~

   Pada metode pertama bot mengirim *pairing code*. Pada metode kedua bot mengirim gambar QR ke chat pribadi. Scan atau masukkan kode melalui **Perangkat tertaut** milik akun WhatsApp kedua yang memang kamu miliki/kendalikan.

3. Cek atau hentikan sesi:

   ~~~text
   cekjadibot
   stopjadibot
   ~~~

Folder data/auth menyimpan sesi **bot utama**; data/jadibot/auth khusus sesi **Jadibot**. Penghentian Jadibot tidak menghapus auth utama. Ketika premium berakhir, koneksi tambahan ditangguhkan. Akun kedua tidak dapat membuat Jadibot lain.

**Keamanan:** QR dan pairing code adalah kredensial sensitif: jangan kirim kepada orang lain. Hubungkan hanya akun sendiri; cabut perangkat tertaut dari aplikasi WhatsApp jika diperlukan. Live pairing tidak diuji oleh GitHub Actions.

## ✅ Testing dan status migrasi

Setiap pengembangan di branch ini menjalankan unit test Node.js, pemeriksaan sintaks, serta audit dependency via GitHub Actions. Command utama sudah terbukti bekerja oleh penguji lokal; fitur baru (termasuk login Jadibot dengan QR, workflow toko, dan bahasa) tetap harus diuji langsung melalui akun WhatsApp percobaan sebelum merge ke branch stabil.

Fitur downloader TikTok/YouTube/Instagram/MediaFire, fitur search tertentu, animasi video, modul RPG lanjutan, dan sejumlah API berbayar lama **belum diklaim selesai**. Source legacy v9.1 memiliki banyak command dari handler terobfuskasi dan dependency usang; tidak disalin mentah-mentah. Token lama yang pernah terpublikasi perlu dicabut/diganti.

- [Daftar fitur aktual](FEATURES.md)
- [Audit dan roadmap Legacy Complete](LEGACY_AUDIT.md)
- [Draft pengembangan (PR #2)](https://github.com/Vall-Afk/y/pull/2)

---

<div align="center">

**✧ Beauté. · Recode by Vall · GitHub @Vall-Afk · Instagram @v4lonenonly ✧**

*Terima kasih — Tritunggal Mahakudus, Orang Tua, Keluarga, dan Saya sendiri.*

</div>

**Jadibot + English:** if you send language en before starting Jadibot, connection status, pairing instructions and QR captions are also presented in English.

### Troubleshooting: npm.cmd run check seems stuck on Windows

Versions before the syntax-check progress utility chained many node --check calls without printing individual progress. The new npm.cmd run check checks all JavaScript files under src/, prints each filename and the result, and stops with a clear error if one check exceeds **20 seconds**. This is a diagnostic timeout, not a promise that every computer can check every file in under 20 seconds. If it fails, send the last filename/error; try node --version and node --check .\src\index.js to isolate the problem. Do not disable antivirus or change PowerShell execution policy. Remember that node --check only checks syntax; it does not connect to WhatsApp or launch the bot.

### Local Image Studio (no external uploads)
Reply to an image with blur [1–30], grayscale, invert, rotate 90/180/270, flip, mirror, pixelate, circle, enhance, compress or resize 512. Each image is processed locally with Sharp; source size ≤5 MB, ≤20 MP. Send brat <text> to make a simple static text sticker, or reply to a text message with qc. Animations and online background removal are not claimed supported.

### Audio/video converter (local FFmpeg)

Supported keywords: `tomp3`, `toaudio` (quoted audio/video to MP3), `tovn` (quoted audio/video to Opus voice message), `tovideo` (quoted static image/sticker to 3-second MP4), `togif` (MP4 with GIF playback flag), and `tosticker` (quoted short video to animated WebP). Bounded input/output **12 MB**, duration 3–30 seconds depending on command, execution timeout 35 seconds and at most two concurrent conversions. The media is processed **locally**, not uploaded to third-party APIs; temporary files are removed.

The optional `ffmpeg-static@5.3.0` package downloads an FFmpeg binary for your OS during `npm.cmd install`. If optional installation fails, other bot features still work but these media commands need a working FFmpeg executable on the system PATH, or an absolute `FFMPEG_PATH` in .env. FFmpeg binaries have their **own licenses** (bundled binary packages may carry GPL obligations). Consult upstream package licensing before redistributing the binary. Source videos and voice notes require runtime WhatsApp testing (FFmpeg codec availability can vary).

**Sticker with pack/author:** reply to an image with `stickerwm My Pack | Vall` (or `wm My Pack | Vall`). The result embeds a WhatsApp-compatible WebP EXIF sticker-pack-name and sticker-pack-publisher, with bounded string lengths. This is static only and uses local image processing.

### Advanced RPG / Legacy RPG World

The virtual RPG now includes `lebur` (3 ore + 1 coal → ingot), `craft sword`, `craft pickaxe`, `equip sword`, `unequip`, `luckyday`, `goplanet`, `toprpg` and boss levels: `killslime`, `killgoblin`, `killdevil`, `killbehemoth`, `killdemon`, `killdemonking`. These are virtual activities only, with cooldowns, level and HP requirements, transactionally persisted items and no real-world money or wagers. Existing RPG save data is extended in place; do not delete `data/economy.json`.

### Group rental / Sewa (owner only)

Manual rental registry: `addsewa <group-id@g.us> 30`, `delsewa <group-id@g.us>`, `listsewa`. Group members can use `checksewa` to see expiry. Rental status is only metadata; it does **not** process money or send mass messages. **Default `REQUIRE_SEWA=false`**, so existing groups keep working. Only if you explicitly set `REQUIRE_SEWA=true` in .env does the bot restrict non-owner group commands when no active rental exists. The bot does not kick members or leave groups automatically. Main and Jadibot store rental ledgers separately.

### Backup data via main owner DM

From the **main owner account**, send `backup` in a **private chat** to Beauté. The bot sends a JSON document containing active settings, economy/RPG, group catalog, group moderation, and rental settings (also isolated non-auth Jadibot config). **Excluded:** every WhatsApp auth/session folder, `.env`, API keys and tokens. This document can contain private account numbers and group data: keep it securely and do not share. The command does **not** provide an automatic remote restore; restoration must be reviewed and performed offline with the bot stopped. Use a separate filesystem backup for your own WhatsApp auth and .env (never upload these to GitHub).

### Safe search/translation integrations

New keyword commands: `translate en Halo dunia` / `translate id Hello` (MyMemory public translation API), `lirik <title>` (LRCLIB song **source links**, not complete copyrighted lyrics), and `ytsearch <query>` / `play <query>` (official YouTube metadata **only**). The latter require your own `YOUTUBE_API_KEY` in .env (enable YouTube Data API v3 in your own Google Cloud project). They do **not** download YouTube audio/video. Text entered in translate is sent explicitly to a third-party service, so do not submit sensitive information. All endpoints are allowlisted, limited in output size and timed out.

### Anonymous text-only chats (opt-in, privacy-first)

Send `anonymous` to read privacy rules, then `start` in the **private chat** to join a partner queue. When another consenting user joins, text messages (maximum 1,000 characters) are relayed without revealing a contact number. Use `next` to change partners or `stop` to end a session; there is a rate limit and a 30-minute inactivity expiry. **Only text** is forwarded, never media or hidden message metadata. `sendprofile` exchanges WhatsApp links **only after both partners explicitly approve**; do not use it if you do not want to disclose your number. The pairing queue is in memory only and is cleared on restart. Anonymous chats are isolated between main bot and Jadibot. Bullying and unsolicited messages are not permitted; partners can immediately end a chat.

### Local TextPro-style visual effects

`textfx neon Beauté`, `neon Beauté`, `glitch Beauté`, `rainbow Beauté`, `halloween Beauté`, `ice`, `fire`, `matrix`, `snow`, `wood`, `metallic`, `space`, `watercolor`, `christmas` and several legacy aliases now render distinctive original PNG designs locally with Sharp. `menutextpro` lists the main effects. The effects are **original local alternatives**, **not pixel-identical copies** of remote TextPro services or their copyrighted templates. Text is escaped and limited to 85 characters.

### Group-scoped media storage / Legacy Storage

Group administrators can **explicitly** save selected quoted media using `addstik name`, `addimg name`, `addvn name`, and `addvid name`. Everyone in the same group can use `liststik`, `listimg`, `listvn`, `listvid` and fetch via `getstik name`, `getimg name`, `getvn name`, or `getvid name`. Only group admins can delete using `delstik`, `delimg`, `delvn`, `delvid`. **Do not store media without the creator's consent.** Limits: max 15 items of each type/group, max 30MB/group, per file up to 1MB stickers, 3MB audio/images, 8MB videos. Saved files remain on your computer under data/saved-media or data/jadibot/saved-media, excluded from chat backups and from Git. Backup or delete these files separately as needed.

### Optional public-media downloaders (yt-dlp)

Legacy keywords `ytmp3`, `ytmp4`, `tiktok`, `tiktoknowm`, `tiktokaudio`, `instagram`, `igphoto`, `igvideo`, `igreels` now have an **optional executable-based implementation** for **single public media**. This uses the external, independently maintained `yt-dlp` utility (https://github.com/yt-dlp/yt-dlp), which is **not bundled with Beauté.** Install the official standalone executable yourself and put it on `PATH`, or set `YTDLP_PATH=C:\\path\\to\\yt-dlp.exe` in `.env`. For `ytmp3` and `tiktokaudio`, FFmpeg must also be available. `npm.cmd install` does not install yt-dlp automatically. Only HTTPS YouTube, TikTok and Instagram **individual public post/video** URLs are accepted; no playlists, private content, cookies, credentials, paywalls, DRM, or generic URL downloads. 12 MB output ceiling, 3-minute max source duration when metadata exists, 90-second process timeout, 1 simultaneous download. Inability to download due to changing platform extractor behavior will be reported as an error.

Use these commands **only for media you created, own, or are permitted to download/re-share**, and comply with the source platform's terms. A public page is not automatic redistribution permission. The alias `tiktoknowm` does **not** guarantee watermark removal; it currently uses the same source-preserving pipeline as `tiktok`.

### Profile and group join/leave (authorization required)

Owner-only: `join https://chat.whatsapp.com/<invite-code>` from a private chat (the owner must have a valid invitation), `leavegc` inside the group, `setnamebot <name>`, `setbiobot <status>`, `setppbot` / `setppbot2` (reply to an image), and `delppbot`. Group admins, only when the bot is a group admin: `setppgc` / `setppgc2` / `pppanjanggc` (reply to an image), and `delppgc`. Photos are resized/cropped to a 640px JPEG locally using Sharp; the legacy long-profile alias does not preserve a taller crop. These operations use WhatsApp APIs and require live group/profile tests.

### Legacy compatibility aliases

`changewelcome` and `changeleft` now accept the same arguments as `setwelcome` and `setleft`; these are permission-gated group admin aliases. The `dashboard` command shows a small private owner-only bot summary without exposing credentials. The `donate` command links to the owner contact, **not** a payment method (none was provided).

## ✦ Migration dashboard — current branch

This version audits **428 unique advertised legacy keywords**. Based on the current [full matrix](LEGACY_COMMAND_MATRIX.md), **135** have readable module handlers (module-level unit tests), **31** have local alternative visual effects, **175** remain unimplemented, **11** deferred for opt-in/privacy and abuse safeguards, and **76** excluded from automatic migration pending content/safety review. Counts are for old advertised keywords, not complete feature parity or guarantees of live WhatsApp compatibility. The active menu deliberately avoids listing unsupported legacy commands as if they were operational.
