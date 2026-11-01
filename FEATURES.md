# Beauté. — Legacy + Modern Migration Ledger

**Branch:** feature/beaute-legacy-modern
**Upstream:** original v9.1. Original menu in command/help.js is readable, but main handler is obfuscated. Do not assume source feature parity.

## Implemented in this branch

| Area | Commands | Notes |
|---|---|---|
| No-prefix | keyword-based commands; legacy ! remains | Exact first keyword |
| Primary | menu, ping, owner, status, mode, QR reconnection | Established baseline |
| Premium jadibot | jadibot, subbot, cekjadibot, statusjadibot, listjadibot, stopjadibot | Global max 1 extra session; separate auth; premium restriction; private pairing code; expiry suspend |
| Group | groupinfo, welcome, left, goodbye, antilink, antiwame, tagall, hidetag, kick, add, promote, demote, open, close, linkgc, revoke, setnamegc, setdesc | Requires group admin role |
| Group templates | setwelcome, setleft, delsetwelcome, delsetleft | {user} and {group} placeholders |
| Economy | daily, balance, limit, buylimit, transfer, topglobal, toplocal, cekpremium, listpremium, addpremium, delpremium | Local virtual coin database; premium admin main owner |
| RPG | joinrpg, inventory, level, rpgshop, mining, nebang, mancing, hunt, adventure, heal, buy, sell | Persistent |
| Games | tictactoe, tttmove, delttt, tebakangka, jawab, nyerah | In memory |
| Media | sticker, toimg, ttp, smeme | Static-only converter and meme captions |
| Tools | say, reverse, count, calc, hitung, pilih, roll, coin, password, runtime, waktu | No eval |
| Search | github, gitclone, wiki, cuaca | Bounded allowlisted APIs |
| AFK | afk | In memory |

## Not yet implemented (requires new review and development)

- Sticker pack metadata, animated stickers/video-to-audio conversions and additional text effects
- TikTok, YouTube, Instagram and MediaFire downloaders
- Advanced group scheduled controls, group store messages, anti-spam and opt-in broadcast
- RPG bosses, planets, crafting, special inventory equipment and advanced leaderboards
- Pinterest, YouTube search, translation, lyrics and other external search integrations
- Payment/topup and adult-content legacy commands: not restored automatically due to external keys, account/security and user protection issues

## Windows PowerShell testing

    npm.cmd install
    npm.cmd test
    npm.cmd run check
    npm.cmd audit --omit=dev
    npm.cmd start

Test on a separate test WhatsApp number. A CI pass is not proof of successful pairing, group operation, or external API responses. Keep two sessions isolated, never reveal auth files, and leave PRs as drafts until WhatsApp verification.
