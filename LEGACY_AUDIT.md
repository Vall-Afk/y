# Beauté. — Legacy v9.1 Audit & Complete Migration Roadmap

**Repository:** https://github.com/Vall-Afk/y  
**Audited source:** v9.1 / command/help.js, README.md and package.json; new readable modules on feature/beaute-legacy-modern.  
**Goal:** migrate safe legacy functionality incrementally, without copying obfuscated code, unsafe credentials or brittle dependencies.

## Scope and evidence

The original v9.1 help menu contains **434 command mentions, 428 distinct command names**, spanning 17 headings. Its primary command/case.js is around 1.73 MB and heavily obfuscated. The old help menu is a **claim of feature availability**, not proof that each command's runtime implementation was operational. Legacy package.json carries old Baileys v4, outdated scraper clients, external keys/APIs and native/audio dependencies. We will not claim full 428-command parity until each replacement is readable, tested and independently verified.

### Audited source menu categories

MAIN MENU; CONVERTER/TOOLS; ANONYMOUS CHATS; STORE MENU; RPG GAMES; DOWNLOADS MENU; GROUP MENU; GAME MENU; SEARCH MENU; RANDOM MENU; BALANCE MENU; STORAGE; BAILEYS; OWNERS MENU; ASUPAN MENU; NSFW MENU; TEXTPRO MENU.

The two source-level checks for each migration are: (1) explicit readable command implementation and permissions, and (2) automated tests for normal/denied/bad input. External calls and real WhatsApp operations additionally need live testing.

## Feature migration ledger

| Legacy source category | Current status | Verified approach / remaining work |
|---|---|---|
| Main / owner | **Migrated in part** | menu, help, infobot/status, owner, ping, public/self, premium admin; English language preference and clear Free/Premium menus |
| Basic converter | **Migrated in part** | sticker, toimg, smeme, ttp; image size/pixel checks; animated media, branded WebP metadata, emoji mixing remain |
| Store | **Migrated in part (this phase)** | list, addlist, update, dellist; process/done templates: setproses, changeproses, delsetproses, setdone, changedone, delsetdone, proses, done; group-only admin permission for changes |
| Calculator | **Migrated in part (this phase)** | tambah, kurang, kali, bagi via bounded arithmetic parser; no eval |
| Group | **Migrated in part** | welcome, left, custom templates, antiwame/antilink, moderation, link, subject/desc, tagging; scheduled open/close and group store extensions still pending |
| Economy | **Migrated in part** | coins, limit, daily, transfer, global/local leaderboard and premium; old buyglimit/game limit not yet migrated |
| RPG | **Migrated in part** | basic persistent progress, mining, logging, fishing, hunting, inventory, trades and healing; bosses, equipment and planets pending |
| Games | **Migrated in part** | Tic Tac Toe and number guessing; casino intentionally excluded pending product/safety review |
| Network & download | **Migrated in part** | github, gitclone, wiki (id/en), cuaca; video/music/social downloaders not yet migrated; use trusted APIs and bounded outputs only |
| Language | **Newly implemented** | bahasa id/en, language id/en, listbahasa; per-user saved preferences and deterministic English UX for major modules |
| Jadibot | **Newly implemented** | premium-only, one shared session, QR or phone pairing, expiry checks, isolated auth; live testing required |
| Search | **Partial** | wiki and github; lyrics, Pinterest, YouTube catalog, reverse search require safe provider evaluation |
| Anonymous / menfess | **Not migrated** | privacy, abuse prevention, consent and rate limiting must be designed before enabling |
| Storage / forwarded media | **Not migrated** | require explicit consent, retention policy, disk limits and user deletion |
| Broadcast and fake messages | **Not migrated** | mass messages, spoofing and impersonation risk; require opt-in/no-spam constraints |
| Adult / NSFW / asupan | **Not migrated** | deliberately excluded from automatic migration; safety and content consent |
| TextPro (hundreds of effects) | **Not migrated** | external services, upload privacy, image rendering constraints; select safe effects individually |
| Payment / topup | **Not migrated** | no old secrets copied; require explicit approved provider and full transactional review |

## Important security decisions

1. **No copying command/case.js** or unreviewed minified/obfuscated handlers.
2. **No reuse of exposed API keys**, cookies, session credentials or external payment tokens. Rotate leaked historical secrets.
3. **No unrestricted URL fetches** (avoid SSRF); use allowlisted hosts, strict timeouts and response limits.
4. **No untrusted eval or shell execution.** Calculator uses a bounded parser.
5. **No group modification by non-admins**, no additional premium rights beyond defined entitlement, and no child-bot spawning unlimited sockets.
6. **No uploads of auth folders, .env or QR/pairing codes** to GitHub.
7. Preserve original contributors' notices/licenses while crediting **Vall / Vall-Afk** for modifications.

## Next safe batches (not yet implemented)

**Phase B — Media:** safe text effect variants, metadata-aware stickerwm, capped audio/video conversions with an explicit FFmpeg setup.

**Phase C — Moderation:** warnings, antispam, custom responses, scheduled group opening/closing with timezone rules and restart-safe jobs.

**Phase D — External search:** audited providers for lyric/translation/metadata; downloads only if platform rules and bounded content handling permit.

**Phase E — Advanced RPG:** bosses, crafting and leaderboards; strong transaction tests and resource caps.

**Phase F — Operational tools:** opt-in group rental (sewa), backup/restore excluding credentials, log rotation and storage cleanup.

## Windows test workflow

~~~powershell
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd audit --omit=dev
npm.cmd start
~~~

CI unit tests do not exercise real WhatsApp servers, pairing QR expiry, admin permissions or API limits in production. All main-account and child-account auth files must remain separate and private.

See [README.md](README.md) and [FEATURES.md](FEATURES.md) for installation and the **currently available** commands.
