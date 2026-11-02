<div align="center">

# ✦ Beauté. ✦
### WhatsApp Multi-Device Bot — Beauté. Edition

**Legacy Complete Roadmap · Version 1.5.0 (staged migration)**

**Tanpa prefix · Fitur gratis · Sewa grup terjangkau · Jadibot gratis (1 slot) · Bahasa Indonesia & English**

[**Panduan Fitur**](FEATURES.md) · [**Audit 428 Perintah**](LEGACY_COMMAND_MATRIX.md)

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
| Distribusi kode sumber | Melalui owner, dengan ketentuan lisensi pihak ketiga |

### ♡ Thanks To
- **Tritunggal Mahakudus**
- **Orang Tua**
- **Keluarga**
- **Saya sendiri**

**Original project attribution:** kode legacy dalam repository berasal dari proyek terdahulu termasuk **Haruka-Md / ZeeoneOfc**, sebagaimana disebutkan README dan package source v9.1. Beauté. ini adalah *recode/pengembangan versi modifikasi* oleh Vall, bukan klaim kepemilikan atas karya kontributor asal. Hak cipta, lisensi, dan pemberitahuan atribusi karya pihak lain tetap harus dihormati.

---

## 📦 Distribusi dan lisensi kode sumber

Kode sumber versi Beauté. ditawarkan melalui owner. Ketik **owner** di bot untuk informasi harga dan lisensi. Tautan unduh tidak dibagikan melalui perintah `script` / `sc` / `source`.

**Atribusi:** Beauté. adalah pengembangan dengan implementasi dan identitas sendiri di atas basis proyek terdahulu. Kontribusi dan pemberitahuan hak cipta pihak lain, termasuk Haruka-Md / ZeeoneOfc bila berlaku, tidak boleh dihapus atau diklaim sebagai karya asli Vall. Periksa lisensi masing-masing dependensi dan komponen sebelum penjualan/distribusi.

**Catatan:** Repository publik tetap dapat diakses selama pengaturan visibilitas GitHub belum diubah. Menyembunyikan link di bot bukan proteksi kode sumber.

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

## ✨ Akses gratis dan layanan sewa grup

Semua perintah pengguna yang tersedia gratis, termasuk Jadibot (satu slot bersama). Izin owner/admin dan persyaratan API eksternal tetap berlaku. **Sewa grup** adalah layanan terpisah: Rp10.000 per 7 hari atau Rp30.000 per bulan kalender; masa sewa berakhir pukul 00.00 WIB pada tanggal jatuh tempo. Gunakan `hargasewa`, `paymethod`, dan `owner`. Owner memverifikasi pembayaran sebelum mengaktifkan `joinsewa`.


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

### Troubleshooting: `spawn EPERM` saat `npm.cmd test` di Windows

Jika Node.js menampilkan `Error: spawn EPERM` pada beberapa **nama file test** (misalnya `test\\migration.test.js`) dan stack trace berasal dari `node:internal/test_runner/runner`, berarti proses pengujian Node tidak berhasil membuat **worker child process**. Ini **bukan** bukti bahwa assertion/fitur di dalam file tersebut gagal; test file tersebut mungkin belum sempat dijalankan. Biasanya masalah berkaitan dengan pembatasan proses Windows, software keamanan, atau tekanan sumber daya saat banyak worker dimulai serentak.

Mulai versi ini `npm.cmd test` menjalankan file test **satu per satu** dengan `node --test --test-concurrency=1`. Tes tetap terisolasi antarfile dan semua assertion tetap dijalankan. Mode paralel opsional hanya untuk lingkungan yang mendukung: `npm.cmd run test:parallel`.

Jika masih terjadi `spawn EPERM`, tutup instance bot lain/terminal Node yang tidak diperlukan, buka terminal PowerShell biasa (tidak harus Administrator), lalu jalankan:

~~~powershell
Set-Location D:\y
node --version
npm.cmd test
node --test --test-concurrency=1 .\test\migration.test.js
node --test --test-concurrency=1 .\test\image-studio.test.js
node --test --test-concurrency=1 .\test\rental.test.js
node --test --test-concurrency=1 .\test\syntax-check.test.js
npm.cmd run check
~~~

Jika hanya satu test gagal, kirim **error assertion atau stack trace** yang baru. Jika bahkan satu file menghasilkan `spawn EPERM`, periksa kebijakan endpoint/security atau proteksi folder Windows dan apakah `node.exe` diizinkan membuat child process; jangan mematikan antivirus atau mengubah kebijakan PowerShell secara global. `npm.cmd run check` menjalankan pemeriksaan sintaks secara terpisah dan bukan pengganti semua tes.

**Peringatan `npm warn install-scripts` bukan error test:** npm dapat menahan skrip instalasi dari `ffmpeg-static`, `protobufjs`, atau `@whiskeysockets/baileys` sampai pengguna meninjau dan menyetujuinya. Jalankan `npm.cmd install-scripts ls` untuk memeriksa daftar dan hanya setujui skrip paket yang sudah diverifikasi dan dipercaya. Bila `ffmpeg-static` belum memasang binary, fitur konversi video/audio memerlukan FFmpeg terpasang terpisah; pengujian unit saja tidak membuktikan binary FFmpeg tersedia.

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

This version audits **428 unique advertised legacy keywords**. Based on the current [full matrix](LEGACY_COMMAND_MATRIX.md), **151** have readable module handlers (module-level unit tests), **184** have original local visual alternatives, **5** have limited link/fingerprint alternatives, **0** remain without an audit disposition, **11** are deferred for opt-in/privacy and abuse safeguards, and **77** are excluded from automatic migration pending content/safety review. Counts are for old advertised keywords, not complete feature parity or guarantees of live WhatsApp compatibility. The active menu deliberately avoids listing unsupported legacy commands as if they were operational.

### Legacy local utility migration (privacy-preserving alternatives)

`attp` creates an animated sticker with FFmpeg (requires separately installed FFmpeg); `emojimix` composes two emoji locally into an original WebP sticker; `nuliskiri`, `nuliskanan`, `foliokiri`, `foliokanan` create original notebook/folio-style PNG art. `cecan`, `cogan`, `waifu` return **illustrated, non-real-person avatars**, not scraped personal photographs. `jeda 1–5` replies after a bounded delay (does not alter the group-wide messaging rate). `getquoted` returns quoted text/captions; `nowa` generates a wa.me link without testing registration. `pinterest` and `grupwa` return search links (no scraping or auto-joining). `mediafire` validates and returns an official file-page link, **not** an automated file downloader. `searchbyimage` computes a local SHA-256 fingerprint of a quoted photo; it does **not** upload photos or perform internet reverse-image search. These limited alternatives are labeled explicitly in the migration matrix.

### Owner-only automation (explicitly OFF by default)

In a **private owner DM**, use `autoread on|off`, `autobio on|off`, `autorespond on|off`, and `anticall on|off`. Settings are persisted in `data/owner-automation.json`. `autoread` marks incoming messages read (privacy impact), `autobio` updates the bot's public profile status when enabled/connected, `autorespond` sends a simple reply to a DM non-command at most once per contact per 6 hours per process, and `anticall` rejects incoming calls without blocking users. All four start disabled. These WhatsApp side effects need live testing. `autoblok212` deliberately **does not block by country code**; it only explains how to block abusive accounts individually. Group admins can use `setcmd keyword | response` and `delcmd keyword` as aliases for exact-match custom group auto replies (not arbitrary JavaScript or bot command replacement); built-in commands cannot be overridden.

### Group shared API quota and RPG chemistry (virtual only)

`buyglimit` in a group spends **250 virtual coins** from the buyer for **10 shared daily API requests** usable after members' own daily quota is exhausted; `limit` displays remaining group bonus. Group purchases persist and are bounded to 10,000 shared daily requests per group. No real payment integration. `jualbahankimia [1–100]` sells the virtual `chemical` RPG item; obtain it by `buy chemical <qty>` or occasionally from `adventure`/`jelajah`. Legacy RPG data is normalized with the new item on access.

### Browse 145 newly migrated TextPro-style aliases

Use `menutextpro` or `textfx list 1` through `textfx list 5` to see all original local style names, then send `<style> <your text>`, e.g. `jewelry8 Beauté.`. The local renderer makes procedural artwork with distinct patterns and palettes per legacy keyword, not copies of the proprietary TextPro images.

Legacy numeric-leading style keywords such as `3dchrome`, `3dbox`, `3dsteel`, and `3dstone` are explicitly recognized as commands (ordinary numeric messages remain ignored).
