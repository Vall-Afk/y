# Beauté. — Legacy Command Migration Matrix

**Source:** `v9.1/command/help.js` · **Target:** `feature/beaute-legacy-modern` · **Recode:** Vall / @Vall-Afk

This is an audit of **428 distinct advertised legacy keywords**, not proof that every old command actually worked. All 173 previously pending keywords now have an explicit disposition: an implemented handler, a documented local/limited alternative, or a deliberate exclusion. **This is NOT 428/428 feature parity.** An entry marked *Implemented* means the new module has a command handler and relevant automated module tests—not that it was individually verified against live WhatsApp or third-party APIs. New feature commands not present in v9.1 are documented in FEATURES.md.

| Status | Count |
|---|---:|
| Implemented (unit-tested module) | 151 |
| Original local alternative | 184 |
| Deferred (consent/abuse risk) | 11 |
| Limited safe alternative | 5 |
| Excluded (content/safety review) | 77 |

Commands with remote-provider behavior, fake/spoofing, adult material or unavailable secrets remain deliberately pending or disabled. **Do not claim 428/428 feature parity.**

| Legacy keyword | Original section | Current status | Location / note |
|---|---|---|---|
| `menu` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `infobot` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `donate` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `dashboard` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `owner` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `cekdrive` | MAIN MENU | Implemented (unit-tested module) | src/features/tools.js (local filesystem) |
| `cekbandwidth` | MAIN MENU | Implemented (unit-tested module) | src/features/tools.js (clear unsupported metric notice) |
| `cekpremium` | MAIN MENU | Implemented (unit-tested module) | src/features/economy.js |
| `listpremium` | MAIN MENU | Implemented (unit-tested module) | src/features/economy.js |
| `listsewa` | MAIN MENU | Implemented (unit-tested module) | src/features/rental.js |
| `speed` | MAIN MENU | Implemented (unit-tested module) | src/features/tools.js |
| `runtime` | MAIN MENU | Implemented (unit-tested module) | src/features/tools.js |
| `listbahasa` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `sticker` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/sticker-tools.js |
| `stickerwm` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/stickerwm.js |
| `smeme` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/sticker-tools.js |
| `toimg` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/sticker-tools.js |
| `tovideo` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/transcode.js |
| `tomp3` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/transcode.js |
| `ttp` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/sticker-tools.js |
| `attp` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/legacy-utilities.js |
| `emojimix` | CONVERTER/TOOLS | Original local alternative | src/features/legacy-utilities.js (local original art) |
| `nuliskiri` | CONVERTER/TOOLS | Original local alternative | src/features/legacy-utilities.js (local original art) |
| `nuliskanan` | CONVERTER/TOOLS | Original local alternative | src/features/legacy-utilities.js (local original art) |
| `foliokiri` | CONVERTER/TOOLS | Original local alternative | src/features/legacy-utilities.js (local original art) |
| `foliokanan` | CONVERTER/TOOLS | Original local alternative | src/features/legacy-utilities.js (local original art) |
| `say` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/tools.js |
| `translate` | CONVERTER/TOOLS | Implemented (unit-tested module) | src/features/network.js |
| `menfess` | ANONYMOUS CHATS | Deferred (consent/abuse risk) | Not enabled |
| `anonymous` | ANONYMOUS CHATS | Implemented (unit-tested module) | src/features/anonymous.js |
| `start` | ANONYMOUS CHATS | Implemented (unit-tested module) | src/features/anonymous.js |
| `next` | ANONYMOUS CHATS | Implemented (unit-tested module) | src/features/anonymous.js |
| `stop` | ANONYMOUS CHATS | Implemented (unit-tested module) | src/features/anonymous.js |
| `sendprofile` | ANONYMOUS CHATS | Implemented (unit-tested module) | src/features/anonymous.js |
| `list` | STORE MENU | Implemented (unit-tested module) | src/features/catalog.js |
| `addlist` | STORE MENU | Implemented (unit-tested module) | src/features/catalog.js |
| `dellist` | STORE MENU | Implemented (unit-tested module) | src/features/catalog.js |
| `update` | STORE MENU | Implemented (unit-tested module) | src/features/catalog.js |
| `jeda` | STORE MENU | Implemented (unit-tested module) | src/features/legacy-utilities.js |
| `tambah` | STORE MENU | Implemented (unit-tested module) | src/features/tools.js |
| `kurang` | STORE MENU | Implemented (unit-tested module) | src/features/tools.js |
| `kali` | STORE MENU | Implemented (unit-tested module) | src/features/tools.js |
| `bagi` | STORE MENU | Implemented (unit-tested module) | src/features/tools.js |
| `delsetdone` | STORE MENU | Implemented (unit-tested module) | src/features/groups.js |
| `changedone` | STORE MENU | Implemented (unit-tested module) | src/features/groups.js |
| `setdone` | STORE MENU | Implemented (unit-tested module) | src/features/groups.js |
| `delsetproses` | STORE MENU | Implemented (unit-tested module) | src/features/groups.js |
| `changeproses` | STORE MENU | Implemented (unit-tested module) | src/features/groups.js |
| `setproses` | STORE MENU | Implemented (unit-tested module) | src/features/groups.js |
| `inventory` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `mining` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `buy` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `sell` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `heal` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `hunt` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `adventure` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `luckyday` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `killslime` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `killgoblin` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `killdevil` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `killbehemoth` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `killdemon` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `killdemonking` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `joinrpg` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `sellikan` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `sellbesi` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `sellemas` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `jelajah` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `mancing` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `jualikan` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `jualcoal` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `lebur` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `jualstone` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `jualingot` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `jualkayu` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `nebang` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `goplanet` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `jualbahankimia` | RPG GAMES | Implemented (unit-tested module) | src/features/rpg.js |
| `play` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/network.js |
| `ytmp3` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `ytmp4` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `instagram` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `igphoto` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `igvideo` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `igreels` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `tiktok` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `tiktoknowm` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `tiktokaudio` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/downloaders.js |
| `mediafire` | DOWNLOADS MENU | Limited safe alternative | src/features/legacy-utilities.js (link/fingerprint only; not original provider) |
| `gitclone` | DOWNLOADS MENU | Implemented (unit-tested module) | src/features/network.js |
| `afk` | GROUP MENU | Implemented (unit-tested module) | src/commands.js |
| `welcome` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `left` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `pppanjanggc` | GROUP MENU | Implemented (unit-tested module) | src/features/profile.js |
| `setopen` | GROUP MENU | Implemented (unit-tested module) | src/features/moderation.js |
| `changesetopen` | GROUP MENU | Implemented (unit-tested module) | src/features/moderation.js |
| `delsetopen` | GROUP MENU | Implemented (unit-tested module) | src/features/moderation.js |
| `setclose` | GROUP MENU | Implemented (unit-tested module) | src/features/moderation.js |
| `changesetclose` | GROUP MENU | Implemented (unit-tested module) | src/features/moderation.js |
| `delsetclose` | GROUP MENU | Implemented (unit-tested module) | src/features/moderation.js |
| `setwelcome` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `changewelcome` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `delsetwelcome` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `setleft` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `changeleft` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `delsetleft` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `linkgc` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `setppgc` | GROUP MENU | Implemented (unit-tested module) | src/features/profile.js |
| `setppgc2` | GROUP MENU | Implemented (unit-tested module) | src/features/profile.js |
| `setnamegc` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `setdesc` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `antilink` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `antiwame` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `open` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `close` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `add` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `kick` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `promote` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `demote` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `revoke` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `hidetag` | GROUP MENU | Implemented (unit-tested module) | src/features/groups.js |
| `checksewa` | GROUP MENU | Implemented (unit-tested module) | src/features/rental.js |
| `tictactoe` | GAME MENU | Implemented (unit-tested module) | src/features/games.js |
| `delttt` | GAME MENU | Implemented (unit-tested module) | src/features/games.js |
| `casino` | GAME MENU | Deferred (consent/abuse risk) | Not enabled |
| `delcasino` | GAME MENU | Deferred (consent/abuse risk) | Not enabled |
| `lirik` | SEARCH MENU | Implemented (unit-tested module) | src/features/network.js |
| `grupwa` | SEARCH MENU | Limited safe alternative | src/features/legacy-utilities.js (link/fingerprint only; not original provider) |
| `pinterest` | SEARCH MENU | Limited safe alternative | src/features/legacy-utilities.js (link/fingerprint only; not original provider) |
| `ytsearch` | SEARCH MENU | Implemented (unit-tested module) | src/features/network.js |
| `searchbyimage` | SEARCH MENU | Limited safe alternative | src/features/legacy-utilities.js (link/fingerprint only; not original provider) |
| `cecan` | RANDOM MENU | Original local alternative | src/features/legacy-utilities.js (local original art) |
| `cogan` | RANDOM MENU | Original local alternative | src/features/legacy-utilities.js (local original art) |
| `waifu` | RANDOM MENU | Original local alternative | src/features/legacy-utilities.js (local original art) |
| `topglobal` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `toplocal` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `buylimit` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `buyglimit` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `transfer` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `limit` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `balance` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `addstik` | STORAGE | Implemented (unit-tested module) | src/features/media-library.js |
| `addvn` | STORAGE | Implemented (unit-tested module) | src/features/media-library.js |
| `addimg` | STORAGE | Implemented (unit-tested module) | src/features/media-library.js |
| `addvid` | STORAGE | Implemented (unit-tested module) | src/features/media-library.js |
| `liststik` | STORAGE | Implemented (unit-tested module) | src/features/media-library.js |
| `listvn` | STORAGE | Implemented (unit-tested module) | src/features/media-library.js |
| `listimg` | STORAGE | Implemented (unit-tested module) | src/features/media-library.js |
| `listvid` | STORAGE | Implemented (unit-tested module) | src/features/media-library.js |
| `fitnah` | BAILEYS | Deferred (consent/abuse risk) | Not enabled |
| `nowa` | BAILEYS | Limited safe alternative | src/features/legacy-utilities.js (link/fingerprint only; not original provider) |
| `getquoted` | BAILEYS | Implemented (unit-tested module) | src/features/legacy-utilities.js |
| `fakehidetag` | BAILEYS | Deferred (consent/abuse risk) | Not enabled |
| `react` | BAILEYS | Implemented (unit-tested module) | src/commands.js (quoted-message reaction) |
| `setcmd` | BAILEYS | Implemented (unit-tested module) | src/commands.js + moderation.js |
| `delcmd` | BAILEYS | Implemented (unit-tested module) | src/commands.js + moderation.js |
| `autoread` | OWNERS MENU | Implemented (unit-tested module) | src/features/owner-automation.js + index.js |
| `autobio` | OWNERS MENU | Implemented (unit-tested module) | src/features/owner-automation.js + index.js |
| `autorespond` | OWNERS MENU | Implemented (unit-tested module) | src/features/owner-automation.js + index.js |
| `anticall` | OWNERS MENU | Implemented (unit-tested module) | src/features/owner-automation.js + index.js |
| `autoblok212` | OWNERS MENU | Excluded (content/safety review) | Country-code blanket blocking deliberately not enabled; individual moderation only |
| `join` | OWNERS MENU | Implemented (unit-tested module) | src/features/profile.js |
| `self` | OWNERS MENU | Implemented (unit-tested module) | src/commands.js |
| `public` | OWNERS MENU | Implemented (unit-tested module) | src/commands.js |
| `setppbot2` | OWNERS MENU | Implemented (unit-tested module) | src/features/profile.js |
| `setppbot` | OWNERS MENU | Implemented (unit-tested module) | src/features/profile.js |
| `broadcast` | OWNERS MENU | Deferred (consent/abuse risk) | Not enabled |
| `bcimg` | OWNERS MENU | Deferred (consent/abuse risk) | Not enabled |
| `bcstik` | OWNERS MENU | Deferred (consent/abuse risk) | Not enabled |
| `bcvn` | OWNERS MENU | Deferred (consent/abuse risk) | Not enabled |
| `bcvideo` | OWNERS MENU | Deferred (consent/abuse risk) | Not enabled |
| `bcsewa` | OWNERS MENU | Deferred (consent/abuse risk) | Not enabled |
| `addpremium` | OWNERS MENU | Implemented (unit-tested module) | src/features/economy.js |
| `delpremium` | OWNERS MENU | Implemented (unit-tested module) | src/features/economy.js |
| `addsewa` | OWNERS MENU | Implemented (unit-tested module) | src/features/rental.js |
| `delsewa` | OWNERS MENU | Implemented (unit-tested module) | src/features/rental.js |
| `chika` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `delvira` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `ayu` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `bunga` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `aura` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `nisa` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `ziva` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `yana` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `viona` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `syania` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `riri` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `syifa` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `mama_gina` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `alcakenya` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `mangayutri` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `rikagusriani` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `asupan` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `bocil` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `geayubi` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `santuy` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `ukhty` | ASUPAN MENU | Excluded (content/safety review) | Not enabled |
| `baka` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `smug` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `neko_sfw` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `hentai_gif` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `spank` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `blowjob` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `cumarts` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `eroyuri` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `eroneko` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `erokemonomimi` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `erokitsune` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `ero` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `feet` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `erofeet` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `feetgif` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `femdom` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `futanari` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `hentai` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `holoero` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `holo` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `keta` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `kitsune` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `kemonomimi` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `pussyart` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `pussywankgif` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `girl_solo` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `girl_solo_gif` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `tits` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `trap` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `yuri` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `avatar2` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `anal` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `bj` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `boobs` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `classic` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `cumsluts` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `kuni` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `lesbian` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `neko` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `neko_gif` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `ahegao` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `bdsm` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `cuckold` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `cum` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `foot` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `gangbang` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `glasses` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `jahy` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `masturbation` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `nsfw_neko` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `orgy` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `panties` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `tentacles` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `thighs` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `zettai` | NSFW MENU | Excluded (content/safety review) | Not enabled |
| `halloween2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `horror` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `game8bit` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `layered` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glitch2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `coolg` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `coolwg` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `realistic` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `space3d` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `gtiktok` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `stone` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `marvel` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `marvel2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `pornhub` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `avengers` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `metalr` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `metalg` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `metalg2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `lion` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `wolf_bw` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `wolf_g` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `ninja` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `3dsteel` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `horror2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `lava` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `bagel` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `blackpink` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `rainbow2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `water_pipe` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `halloween` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `sketch` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `sircuit` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `discovery` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `metallic2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `fiction` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `demon` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `transformer` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `berry` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `thunder` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `magma` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `3dstone` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `neon` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `glitch` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `harry_potter` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `embossed` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `broken` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `papercut` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `gradient` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glossy` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `watercolor` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `multicolor` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `neon_devil` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `underwater` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `bear` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `wonderfulg` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `christmas` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `neon_light` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `snow` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `cloudsky` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `luxury2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `gradient2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `summer` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `writing` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `engraved` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `summery` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `3dglue` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `metaldark` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `neonlight` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `oscar` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `minion` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `holographic` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `purple` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `glossyb` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `deluxe2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glossyc` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `fabric` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `neonc` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `newyear` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `newyear2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `metals` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `xmas` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `blood` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `darkg` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `joker` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `wicker` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `natural` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `firework` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `skeleton` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `balloon` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `balloon2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `balloon3` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `balloon4` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `balloon5` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `balloon6` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `balloon7` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `steel` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `gloss` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `denim` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `decorate` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `decorate2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `peridot` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `rock` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glass` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glass2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glass3` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glass4` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glass5` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glass6` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glass7` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glass8` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `captain_as2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `robot` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `equalizer` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `toxic` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `sparkling` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `sparkling2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `sparkling3` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `sparkling4` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `sparkling5` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `sparkling6` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `sparkling7` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `decorative` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `chocolate` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `strawberry` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `koifish` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `bread` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `matrix` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `blood2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `neonligth2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `thunder2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `3dbox` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `neon2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `roadw` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `bokeh` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `gneon` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `advanced` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `dropwater` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `wall` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `chrismast` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `honey` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `drug` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `marble` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `marble2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `ice` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `juice` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `rusty` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `abstra` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `biscuit` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `wood` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `scifi` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `purpleg` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `shiny` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `jewelry` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `jewelry2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `jewelry3` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `jewelry4` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `jewelry5` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `jewelry6` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `jewelry7` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `jewelry8` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `metalh` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `golden` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glitter` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glitter2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glitter3` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glitter4` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glitter5` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glitter6` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `glitter7` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `metale` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `carbon` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `candy` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `metalb` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `gemb` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `3dchrome` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |
| `metalb2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (procedural original, not TextPro) |

## Interpretation

- **Implemented:** routed keyword in a readable module; unit tests cover the module; optional external tools (FFmpeg, yt-dlp) and live WhatsApp behavior still need setup/testing.
- **Original local alternative:** a similarly named text effect exists as an original SVG/Sharp design, not the original proprietary TextPro render.
- **Deferred:** requires opt-in/anti-spam, rights approval, other safety review or external provider investigation.
- **Excluded:** not auto-enabled because of safety, user consent, licensing or privacy; not treated as a missing software bug.
- **Limited safe alternative:** command returns a validated browser link or local fingerprint; it does **not** download MediaFire files, scrape Pinterest, join groups, enumerate WhatsApp numbers or perform internet reverse-image search.
- **Not yet migrated:** zero remaining without a disposition in this ledger; this does not mean every original feature is restored.
