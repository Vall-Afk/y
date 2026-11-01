# Beauté. — Legacy Complete Migration Audit

**Maintainer / Recode:** Vall · GitHub **[@Vall-Afk](https://github.com/Vall-Afk)** · Instagram **[@v4lonenonly](https://instagram.com/v4lonenonly)**  
**Source:** https://github.com/Vall-Afk/y · **Active development branch:** feature/beaute-legacy-modern  
**Original source audited:** v9.1/command/help.js, v9.1/package.json, v9.1/README.md.

## Scope and truthful status

The legacy help menu advertises **428 distinct commands** from 434 mentions across 17 sections. That figure is **not proof** that all old commands worked; the v9.1 primary handler is obfuscated and depends on old web scrapers, Baileys v4, remote APIs and sometimes exposed credentials. A safer modern build is used in place of copying these components.

**Per-keyword migration ledger:** [LEGACY_COMMAND_MATRIX.md](LEGACY_COMMAND_MATRIX.md)

| Audit state | Legacy keywords |
|---|---:|
| Implemented by readable local modules / tested at module level | **135** |
| Original local visual alternatives (not exact proprietary copies) | **31** |
| Not yet migrated | **175** |
| Deferred pending consent/abuse safeguards | **11** |
| Excluded from automatic migration for safety/content review | **76** |
| **Total** | **428** |

"Implemented" does **not** mean every external provider and every WhatsApp account flow has passed live testing. Legacy parity is **NOT complete**. Some newly implemented commands are not present in the 428-command source listing, so the actual modern feature count differs.

## What has been migrated in the readable build

| Domain | Current scope | Important limitation |
|---|---|---|
| Main / owner | Prefixless commands, menus, bilingual preferences, status/owner/source/credits, dashboard, private mode, premium ledger | Status is process-local; real WhatsApp profile effects require live testing |
| Group | Welcome/left templates, invite links, admin management, warnings, rules, anti-link/anti-wa.me/anti-spam, exact auto replies, scheduled open/close WIB, group avatars | Admin checks required; schedule only when bot is online and admin |
| Store | Persistent group catalog, add/update/delete, quoted status workflows proses/done with placeholders | Admin-only writes; no payment processor |
| Tools & economy | Safe math parser, old arithmetic aliases, random/password helpers, virtual coins, daily/limit/transfer/leaderboard | No gambling/real-money payout |
| RPG | Basic equipment, recipes, lebur, HP/XP, gather/trade, levels, six bosses, goplanet and leaderboard | Virtual-only economy; cooldown and level gates |
| Games | Tic Tac Toe, number guessing | Old casino not auto-enabled |
| Media | Sharp static stickers, stickerwm EXIF, TTP/smeme/brat/qc, image filters and effects | Image source max 5MB; WhatsApp codecs need live tests |
| Audio/video | Optional local FFmpeg to MP3/voice, static picture to MP4 and video to animated sticker | FFmpeg required; bounded sizes and timeouts |
| TextPro-style | 14 distinct original SVG/Sharp effect themes, 31 matching source names with local alternatives | **Not** the original proprietary TextPro renders |
| Downloaders | Optional yt-dlp on public single YouTube, TikTok, Instagram videos and posts | yt-dlp separately installed; 12 MB limit; no private sessions; platform changes may break |
| Search/translation | GitHub/Gitclone, Indonesian/English Wikipedia, Open-Meteo weather, LRCLIB lyric-source links, MyMemory translation, official YouTube metadata search | YouTube Data API key user-supplied; metadata not guaranteed; lyrics not reproduced in full |
| Anonymous | Opt-in 2-party text-only sessions, stop/next and mutual consent for contact links | No storage, no media forwarding, no unsolicited menfess |
| Media storage | Per-group opt-in saved sticker/audio/photo/video commands with quotas | Group admin writes, member reads; separate filesystem retention/consent |
| Rental/sewa | Manually maintained group rental expiry with optional REQUIRE_SEWA=true access gate | Default false; no actual payments or silent group exits |
| Backup | Private owner DM export of JSON settings/economy/catalog/other group data | Excludes all credentials and .env; no remote restore |
| Premium Jadibot | One GLOBAL extra connection, QR or pairing code, isolated credentials and premium expiry | Requires live WhatsApp pairing verification |

## Not yet migrated / purposely withheld

- Hundreds of obsolete visual effect aliases and vendor-specific TextPro artwork; only independently recreated local styles are offered.
- General-purpose MediaFire and arbitrary URL downloaders, Pinterest arbitrary image fetch and reverse-image search: untrusted URL/SSRF, privacy and provider challenges.
- Legacy anonymous menfess messaging to users who did **not** opt in; contact consent is required.
- Mass broadcast, messages simulating another person, impersonation or fake quotes: abuse/spam risk. An opt-in, non-spamming consent workflow would be needed before enabling any broadcast.
- Adult/NSFW/asupan sources: not part of the automatically enabled bot while content, age restrictions and consent remain unreviewed.
- Legacy casino tied to virtual or real coins: excluded from automatic migration, not falsely advertised.
- Payment/topup secrets and private APIs: no old API key or cookie copied. Replace exposed historical tokens rather than reusing them.
- WhatsApp-specific functions requiring interaction with groups and devices are not fully verified until end-to-end testing with authorized accounts.

### Source attribution and safety

This is a modified **Vall** version of the repo under **Vall-Afk**. It does not erase earlier authors' credits or license notices (original repository referenced Haruka-Md / ZeeoneOfc). The README contains user-requested Thanks To: **Tritunggal Mahakudus, Orang Tua, Keluarga, Saya sendiri**.

Rules maintained in the codebase: no eval of untrusted expressions, no arbitrary arbitrary-host fetch, fixed timeouts/size caps on media/network, admin privileges for group-changing commands, privacy-preserving default settings, separate main bot/Jadibot credentials, never publish auth/.env or historical tokens.

## Verification gates

Run from PowerShell in the development branch:

~~~powershell
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd audit --omit=dev
npm.cmd start
~~~

Automated GitHub Actions verifies local unit tests, syntax and dependency audit, not a successful live YouTube/TikTok/Instagram extraction or real WhatsApp QR scan.

See [README.md](README.md), [FEATURES.md](FEATURES.md), and [LEGACY_COMMAND_MATRIX.md](LEGACY_COMMAND_MATRIX.md). The PR targeting the secure rebuild remains a **draft** until real WhatsApp and group-permission testing.
