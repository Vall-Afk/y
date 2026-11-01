# Beauté. — Implemented Features (v1.5.0 roadmap)

**GitHub:** https://github.com/Vall-Afk/y/tree/feature/beaute-legacy-modern  
**Goal:** Legacy Complete (incremental). **Not full legacy parity yet.** Consult [LEGACY_AUDIT.md](LEGACY_AUDIT.md).

## FREE / GRATIS

| Category | Commands | Notes |
|---|---|---|
| Main / language | menu, help, allmenu, ping, status, infobot, owner, bahasa id/en, language id/en, lang, listbahasa, languages | Persisted language per WhatsApp user; old ! prefix still works |
| Tools | say, reverse, count, calc, hitung, **tambah, kurang, kali, bagi**, pilih, roll, coin, password, runtime, speed, waktu | No eval, bounded inputs |
| Group | groupinfo, welcome, left, goodbye, antilink, antiwame, kick, add, promote, demote, tagall, hidetag, linkgc, revoke, open, close, setnamegc, setdesc | Admin rights checked |
| Group welcome templates | setwelcome, setleft, delsetwelcome, delsetleft | {user}/{group} placeholders; saved |
| **Legacy Store** | **list, getlist, addlist, update, dellist** | Persistent per group, members can read; admin writes only |
| **Legacy order workflows** | **setproses, changeproses, delsetproses, setdone, changedone, delsetdone, proses, done** | Admin-only status on quoted order; {order}/{user}/{group} placeholders |
| Media | sticker, s, toimg, ttp, smeme | Static images, capped sizes; local blur/grayscale/invert/rotate/flip/mirror/pixelate/circle/enhance/compress/resize; Brat and quoted text stickers |
| RPG | joinrpg, inventory, level, rpgshop, mining, mine, nebang, mancing, hunt, adventure, heal, buy, sell, jualikan, jualkayu, jualcoal, jualstone | Economy persistence; cooldowns |
| Games | tictactoe, ttt, tttmove, delttt, tebakangka, jawab, nyerah | In-memory games |
| Economy | daily, balance, limit, buylimit, transfer, topglobal, toplocal, cekpremium | Virtual coins |
| Network | github, gitclone, wiki, cuaca | Fixed allowlist; size/timeout limits; free network quota |

## ★ PREMIUM EXCLUSIVE

| Commands | Notes |
|---|---|
| jadibot 628xxxx, jadibot qr | Premium-only one GLOBAL secondary connection |
| cekjadibot, statusjadibot, listjadibot, stopjadibot | Controlled sessions and private QR/pairing |
| Network premium access | No daily quota deduction where network limit applies |

## ♛ OWNER ONLY

| Commands | Notes |
|---|---|
| mode public/private, self, public | Control main bot mode |
| addpremium 62xxx <days>, delpremium 62xxx, listpremium | Only MAIN owner, not all premium members |

## MENU HELPERS

menu, menugroup, menugrup, menustore, menutoko, menumedia, menutools, menugame, menurpg, menuekonomi, menudownload, menupremium, menuowner, menubahasa. In the main menu, Free, Premium and Owner sections remain visually distinct.

## English language

Send **language en** or **bahasa en**, then **menu**. Supported replies include main interface, premium Jadibot operations, group moderation, store and workflow, economy, tools, AFK, core game and RPG feedback, Wikipedia language selection and weather labels. The preference is stored across restarts. Legacy commands keep their established keyword names; some low-level errors, remote responses and missing translations may be in Indonesian.

## Not yet migrated or not verified live

Not included: MediaFire arbitrary files, arbitrary Pinterest/reverse-image retrieval, exact proprietary TextPro styles, unsolicited menfess, mass broadcast, fake/impersonation messages, old payment/topup API keys, adult/asupan and casino modules. New YouTube/TikTok/Instagram downloadable media is **optional yt-dlp integration**, requires a separately installed executable and individual lawful public URLs; extractors and WhatsApp playback remain **unverified live**. QR pairing and FFmpeg commands also require user-run end-to-end tests. See [full 428-command ledger](LEGACY_COMMAND_MATRIX.md).

## QA

Use PowerShell commands:
~~~powershell
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd audit --omit=dev
npm.cmd start
~~~

Passing CI tests syntax, local unit logic and dependency checks only. Live WhatsApp pairing and external endpoints require separate validation with authorized accounts. Keep .env and data/auth untouched.

The PowerShell npm.cmd run check command now prints per-file progress and enforces a 20-second timeout on any single node --check invocation, so stalled checks are identifiable rather than silent.

## New Media Studio commands
brat <text>, qc (reply), blur [1-30], grayscale, greyscale, invert, negative, rotate 90/180/270, flip, mirror, pixelate, circle, enhance, compress, resize 128-2048. These use local Sharp processing and 5 MB input limits.

## FFmpeg converters (optional runtime dependency)

`tomp3`, `toaudio`, `tovn`, `tovideo`, `tosticker`, `togif` now have bounded local implementations. They require a working local FFmpeg binary (optional `ffmpeg-static` download, or `FFMPEG_PATH` in .env). Actual WhatsApp media and codecs require live verification; command presence is not proof of successful conversion for every format.

**Stickerwm** / **wm** are implemented for static images with WebP EXIF metadata (pack and author names), bounded local conversion and no remote uploads.

## Legacy RPG Advanced

`lebur`, `jualingot`, `craft`, `equip`, `unequip`, `equipment`, `killslime`, `killgoblin`, `killdevil`, `killbehemoth`, `killdemon`, `killdemonking`, `luckyday`, `goplanet`, `toprpg`, `rpgboard`, `jelajah`, `sellikan`, `sellbesi`, `sellemas` are added as virtual RPG activities with atomic persistence. Boss difficulty and cooldown are checked server-side.

## Manual group rental (sewa)

Owner: `addsewa`, `delsewa`, `listsewa`. Group: `ceksewa`, `checksewa`, `sewa`. Optional `REQUIRE_SEWA=true` gates group commands if expired; default is false and preserves existing groups.

## Owner-only backup

`backup` / `backupbot` sends a bounded JSON export of known settings, economy, catalog, moderation and rental data in a private chat with the main owner. It excludes every authentication folder, QR/pairing codes, .env, and all tokens. This is **an export only**, not an in-chat restore feature. Handle the exported user data privately.

## Search / translation

`translate`, `terjemah` (MyMemory ID↔EN; opted-in text submitted to an external service), `lirik`, `lyrics` (LRCLIB source links only), `ytsearch`, `play` (official YouTube Data API metadata; requires YOUTUBE_API_KEY) are added. These are not TikTok/Instagram/YouTube downloaders.

## Opt-in anonymous chat

`anonymous`, `start`, `next`, `stop`, `sendprofile`: two-party opt-in text-only pairing, input cap and rate limit, no saved chat messages, 30-minute idle expiry, mutual consent before sharing contact details. Legacy `menfess` (unsolicited direct messages) remains excluded pending anti-abuse review.

## Original text effects, locally generated

`textfx`, `neon`, `rainbow`, `glitch`, `halloween`, `horror`, `ice`, `fire`, `matrix`, `snow`, `wood`, `metallic`, `space`, `watercolor`, `christmas`, and selected legacy style aliases use original SVG+Sharp templates. They are not identical to proprietary TextPro renders.

## Legacy group media storage

`addstik/liststik/getstik/delstik`, `addvn/listvn/getvn/delvn`, `addimg/listimg/getimg/delimg`, `addvid/listvid/getvid/delvid` are group scoped. Members can read, admins can add/delete. No implicit logging/saving of incoming media; 15/type/group and 30MB/group hard limits. The user must have rights to retain quoted media.

## Optional public-media downloaders

`ytmp3`, `ytmp4`, `tiktok`, `tiktoknowm`, `tiktokaudio`, `instagram`, `igphoto`, `igvideo`, `igreels` use an optional user-installed `yt-dlp` executable for bounded, individual public media URLs. They are not part of the automated unit network tests: extractor behavior and availability require live user verification. No account cookies/private media/paywall bypass. `tiktoknowm` does not guarantee watermark removal.

## Owner/group profile controls

`join`, `leavegc`, `setnamebot`, `setbiobot`, `setppbot`, `setppbot2`, `delppbot`; admin + bot-admin `setppgc`, `setppgc2`, `pppanjanggc`, `delppgc`. Profile photo operations require live Baileys testing; all input images are local capped JPEG conversions.

Additional legacy aliases: `changewelcome`, `changeleft`, `dashboard` (main owner private status) and `donate` (owner contact only, no payment integration).

## Current migration accounting

Audit of the legacy help menu: **151 readable handler keywords, 184 original local visual alternatives, 5 limited link/fingerprint alternatives, 0 without an audit disposition, 11 privacy/abuse deferred, 77 content/safety excluded**. Total **428 distinct advertised legacy keywords**. This is a phased project, not complete old feature parity. Details and source locations: [LEGACY_COMMAND_MATRIX.md](LEGACY_COMMAND_MATRIX.md).

Legacy local utilities: `attp` (FFmpeg animated sticker), `emojimix` (original WebP composition), `nuliskiri`, `nuliskanan`, `foliokiri`, `foliokanan` (notebook PNG), `cecan`, `cogan`, `waifu` (original illustrated avatars), `jeda` (bounded delay), `getquoted` (quoted text only), `nowa` (wa.me link only). Limited link/fingerprint alternatives: `mediafire` (file-page link only), `pinterest`/`grupwa` (browser search links only), `searchbyimage` (local SHA-256 only, not reverse-image search).

Owner automation: persisted opt-in `autoread`, `autobio`, `autorespond`, `anticall` (OFF by default), requiring owner DM and live WhatsApp tests. `autoblok212` refuses blanket country-code blocking. `setcmd`/`delcmd` are safe group-admin exact-keyword response aliases, not executable plugins or built-in overrides.

`buyglimit`: transactional 250-coin purchase of 10 shared daily API requests/group, consumed after personal quotas. `jualbahankimia`: virtual chemical RPG item with bounded sale and inventory normalization.

## Legacy 173-keyword closure (not full original parity)

The 173 names formerly marked *Not yet migrated* have now been triaged: 145 receive unique original TextPro-style renderings, 8 more receive original emoji/notebook/avatar images, 11 have executable handlers (owner controls, group quota, RPG chemistry, aliases and local utilities), 5 are explicitly limited browser-link/fingerprint substitutes, 3 were already implemented but misclassified in the old ledger, and `autoblok212` is deliberately excluded from country-code-wide blocking. No provider scraping, arbitrary network downloads, account enumeration or automatic discriminatory blocking is claimed. See LEGACY_COMMAND_MATRIX.md for each keyword.
