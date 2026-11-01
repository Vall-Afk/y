# Beauté. — Implemented Features (v1.3.0)

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

## Not yet implemented

TikTok, YouTube and Instagram downloaders; MediaFire; animated sticker conversion, stickerwm metadata; Pinterest, lyrics, translation services, text effects; scheduled group controls; advanced RPG; storage; anonymous chats; mass broadcast. Adult and casino features are not automatically migrated. No legacy obfuscated handler or exposed tokens were copied.

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
