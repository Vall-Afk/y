# Beauté. — Legacy Command Migration Matrix

**Source:** `v9.1/command/help.js` · **Target:** `feature/beaute-legacy-modern` · **Recode:** Vall / @Vall-Afk

This is an audit of **428 distinct advertised legacy keywords**, not proof that every old command actually worked. An entry marked *Implemented* means the new module has a command handler and relevant automated module tests—not that it was individually verified against live WhatsApp or third-party APIs. New feature commands not present in v9.1 are documented in FEATURES.md.

| Status | Count |
|---|---:|
| Implemented (unit-tested module) | 135 |
| Not yet migrated | 175 |
| Deferred (consent/abuse risk) | 11 |
| Excluded (content/safety review) | 76 |
| Original local alternative | 31 |

Commands with remote-provider behavior, fake/spoofing, adult material or unavailable secrets remain deliberately pending or disabled. **Do not claim 428/428 feature parity.**

| Legacy keyword | Original section | Current status | Location / note |
|---|---|---|---|
| `menu` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `infobot` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `donate` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `dashboard` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `owner` | MAIN MENU | Implemented (unit-tested module) | src/commands.js |
| `cekdrive` | MAIN MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `cekbandwidth` | MAIN MENU | Not yet migrated | External dependency/legacy behavior needs review |
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
| `attp` | CONVERTER/TOOLS | Not yet migrated | External dependency/legacy behavior needs review |
| `emojimix` | CONVERTER/TOOLS | Not yet migrated | External dependency/legacy behavior needs review |
| `nuliskiri` | CONVERTER/TOOLS | Not yet migrated | External dependency/legacy behavior needs review |
| `nuliskanan` | CONVERTER/TOOLS | Not yet migrated | External dependency/legacy behavior needs review |
| `foliokiri` | CONVERTER/TOOLS | Not yet migrated | External dependency/legacy behavior needs review |
| `foliokanan` | CONVERTER/TOOLS | Not yet migrated | External dependency/legacy behavior needs review |
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
| `jeda` | STORE MENU | Not yet migrated | Workflow compatibility requires review |
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
| `jualbahankimia` | RPG GAMES | Not yet migrated | External dependency/legacy behavior needs review |
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
| `mediafire` | DOWNLOADS MENU | Not yet migrated | External dependency/legacy behavior needs review |
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
| `tictactoe` | GAME MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `delttt` | GAME MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `casino` | GAME MENU | Deferred (consent/abuse risk) | Not enabled |
| `delcasino` | GAME MENU | Deferred (consent/abuse risk) | Not enabled |
| `lirik` | SEARCH MENU | Implemented (unit-tested module) | src/features/network.js |
| `grupwa` | SEARCH MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `pinterest` | SEARCH MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `ytsearch` | SEARCH MENU | Implemented (unit-tested module) | src/features/network.js |
| `searchbyimage` | SEARCH MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `cecan` | RANDOM MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `cogan` | RANDOM MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `waifu` | RANDOM MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `topglobal` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `toplocal` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `buylimit` | BALANCE MENU | Implemented (unit-tested module) | src/features/economy.js |
| `buyglimit` | BALANCE MENU | Not yet migrated | External dependency/legacy behavior needs review |
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
| `nowa` | BAILEYS | Not yet migrated | External dependency/legacy behavior needs review |
| `getquoted` | BAILEYS | Not yet migrated | External dependency/legacy behavior needs review |
| `fakehidetag` | BAILEYS | Deferred (consent/abuse risk) | Not enabled |
| `react` | BAILEYS | Not yet migrated | External dependency/legacy behavior needs review |
| `setcmd` | BAILEYS | Not yet migrated | External dependency/legacy behavior needs review |
| `delcmd` | BAILEYS | Not yet migrated | External dependency/legacy behavior needs review |
| `autoread` | OWNERS MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `autobio` | OWNERS MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `autorespond` | OWNERS MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `anticall` | OWNERS MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `autoblok212` | OWNERS MENU | Not yet migrated | External dependency/legacy behavior needs review |
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
| `game8bit` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `layered` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glitch2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `coolg` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `coolwg` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `realistic` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `space3d` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `gtiktok` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `stone` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `marvel` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `marvel2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `pornhub` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `avengers` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `metalr` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `metalg` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `metalg2` | TEXTPRO MENU | Not yet migrated | Not among implemented local SVG effect aliases |
| `lion` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `wolf_bw` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `wolf_g` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `ninja` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `3dsteel` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `horror2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `lava` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `bagel` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `blackpink` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `rainbow2` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `water_pipe` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `halloween` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `sketch` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `sircuit` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `discovery` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `metallic2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `fiction` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `demon` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `transformer` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `berry` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `thunder` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `magma` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `3dstone` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `neon` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `glitch` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `harry_potter` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `embossed` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `broken` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `papercut` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `gradient` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glossy` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `watercolor` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `multicolor` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `neon_devil` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `underwater` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `bear` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `wonderfulg` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `christmas` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `neon_light` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `snow` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `cloudsky` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `luxury2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `gradient2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `summer` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `writing` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `engraved` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `summery` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `3dglue` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `metaldark` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `neonlight` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `oscar` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `minion` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `holographic` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `purple` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `glossyb` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `deluxe2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glossyc` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `fabric` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `neonc` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `newyear` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `newyear2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `metals` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `xmas` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `blood` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `darkg` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `joker` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `wicker` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `natural` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `firework` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `skeleton` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `balloon` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `balloon2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `balloon3` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `balloon4` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `balloon5` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `balloon6` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `balloon7` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `steel` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `gloss` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `denim` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `decorate` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `decorate2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `peridot` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `rock` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glass` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glass2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glass3` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glass4` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glass5` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glass6` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glass7` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glass8` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `captain_as2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `robot` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `equalizer` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `toxic` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `sparkling` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `sparkling2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `sparkling3` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `sparkling4` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `sparkling5` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `sparkling6` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `sparkling7` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `decorative` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `chocolate` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `strawberry` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `koifish` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `bread` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `matrix` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `blood2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `neonligth2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `thunder2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `3dbox` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `neon2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `roadw` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `bokeh` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `gneon` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `advanced` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `dropwater` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `wall` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `chrismast` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `honey` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `drug` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `marble` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `marble2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `ice` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `juice` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `rusty` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `abstra` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `biscuit` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `wood` | TEXTPRO MENU | Original local alternative | src/features/textfx.js (not an identical TextPro effect) |
| `scifi` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `purpleg` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `shiny` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `jewelry` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `jewelry2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `jewelry3` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `jewelry4` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `jewelry5` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `jewelry6` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `jewelry7` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `jewelry8` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `metalh` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `golden` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glitter` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glitter2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glitter3` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glitter4` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glitter5` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glitter6` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `glitter7` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `metale` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `carbon` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `candy` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `metalb` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `gemb` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `3dchrome` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |
| `metalb2` | TEXTPRO MENU | Not yet migrated | External dependency/legacy behavior needs review |

## Interpretation

- **Implemented:** routed keyword in a readable module; unit tests cover the module; optional external tools (FFmpeg, yt-dlp) and live WhatsApp behavior still need setup/testing.
- **Original local alternative:** a similarly named text effect exists as an original SVG/Sharp design, not the original proprietary TextPro render.
- **Deferred:** requires opt-in/anti-spam, rights approval, other safety review or external provider investigation.
- **Excluded:** not auto-enabled because of safety, user consent, licensing or privacy; not treated as a missing software bug.
- **Not yet migrated:** absent from the target; no fake/inert entry is advertised as working in the bot menu.
