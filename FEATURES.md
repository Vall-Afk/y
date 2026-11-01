# Beauté. — Legacy + Modern migration ledger

**Branch:** feature/beaute-legacy-modern
**Upstream:** v9.1. Its command/help.js lists many commands, but the critical command/case.js is obfuscated. We only mark code as implemented if a readable replacement and tests exist. This file is a migration ledger, not a promise that every original API works.

## Phase 1: implemented in this branch

| Category | Commands | Notes |
|---|---|---|
| Connection | QR, persisted auth, reconnect, owner-only private mode | Reuses verified working baseline |
| Owner | owner, mode, self, public, addpremium, delpremium | Owner Vall, 6287721373781 |
| Group | groupinfo, welcome, left/goodbye, antilink, antiwame, tagall, hidetag, kick, add, promote, demote, open, close, linkgc, revoke, setnamegc, setdesc | Bot must be group admin for mutations |
| Economy | daily, balance, limit, buylimit, transfer, topglobal, toplocal, cekpremium, listpremium | Local virtual currency; no cash or payment gateway |
| Tools | say, reverse, count, calc/hitung, pilih, roll, coin, password, runtime/speed, waktu | Safe math parser, no eval |
| Games | tictactoe/ttt, tttmove, delttt, tebakangka, jawab, nyerah | In-memory sessions, reset on restart |
| Network | github, gitclone, wiki, cuaca | Official/public endpoints, fixed hostname allowlist, response limits |
| Media | sticker/s, toimg | Static images, local conversion |
| Menus | menu/allmenu/help, menugroup, menumedia, menutools, menugame, menuekonomi, menudownload, menuowner | All displayed commands have routing |

## Phase 2: not yet implemented, must be reviewed individually

- Old converter variants: stickerwm, smeme, tovideo, tomp3, emojimix, text drawing, audio/video conversion.
- Downloads: TikTok, YouTube audio/video, Instagram, MediaFire; requires evaluation of API stability, platform rules, content, downloader size limits, no scraped login cookies.
- Group and store: custom messages, timed open/close, response list, afk, sewa, broadcast (with explicit opt-in and anti-spam limitations).
- RPG and inventory: mining, hunt, adventure, items, purchase, selling, leaderboards (new game data schema needed).
- Search: Pinterest, lyrics, YouTube metadata, image search, translation.
- Text effects, legacy game variants, premium integrations and custom sticker packs.
- Legacy adult content and third-party topup/payments: **not restored automatically** due to privacy, safety, external dependencies and account/payment risk.

## Testing & operating notes
Run from PowerShell or CMD in this branch:
1. npm install
2. npm test
3. npm run check
4. npm audit --omit=dev
5. npm start (uses existing .env and data/auth, do not delete them)

Before testing live, stop any other bot process that uses the same WhatsApp session. Test group commands in a temporary test group where the bot is admin. Never add unsafe API tokens into source code. Scan QR only if the existing session has expired or is absent.

**External API and live-account checks are not covered by unit tests.** GitHub Actions validates installation, tests, syntax and dependency vulnerabilities, not end-to-end WhatsApp group moderation.
