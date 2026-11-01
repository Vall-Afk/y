# Beauté. — WhatsApp Bot Legacy + Modern

**Owner:** Vall | **WhatsApp:** 6287721373781 | **Instagram:** @v4lonenonly
**Development branch:** feature/beaute-legacy-modern

This repository incrementally reconstructs trusted features of the original Vall-Afk/y. Core WhatsApp QR auth, group settings and local economy remain readable and maintainable. Not every original command has been migrated. See FEATURES.md.

## Windows PowerShell: updating your already-working bot

Use npm.cmd, not npm, in PowerShell. No execution-policy changes are needed.

Stop the currently running bot with Ctrl+C, then enter its folder and run:

    git switch feature/beaute-legacy-modern
    git fetch origin
    git pull --ff-only origin feature/beaute-legacy-modern
    npm.cmd install
    npm.cmd test
    npm.cmd run check
    npm.cmd audit --omit=dev
    npm.cmd start

Keep your existing .env and data/auth! Never delete the WhatsApp main session folder during an update.

If cloning from scratch:

    git clone --branch feature/beaute-legacy-modern https://github.com/Vall-Afk/y.git
    cd y
    Copy-Item .env.example .env
    notepad .env
    npm.cmd install
    npm.cmd start

The .env file includes OWNER_NUMBER=6287721373781, OWNER_NAME=Vall, OWNER_INSTAGRAM=v4lonenonly, BOT_NAME=Beauté., PREFIX=!. The prefix remains for backward compatibility but is no longer required.

## Commands no longer require !

Send "menu", "ping", "daily", "inventory", "menugroup", "menurpg", "menumedia", "menupremium" or "calc 10+5*2". The same commands with ! are still supported. The FIRST word must be an exact command keyword; normal chat text that contains a command in the middle is ignored.

Other migrated features: custom group greetings (setwelcome Halo {user} di {group}; setleft Sampai jumpa {user}; welcome on; left on), image meme stickers (smeme ATAS | BAWAH with image/reply), text sticker (ttp Halo Beauté.), group administration, premium economy, RPG, games and public searches.

## Premium Jadibot — global maximum ONE additional session

Only premium members and the main bot owner may start the extra WhatsApp session. All premium users share ONE slot globally, not one slot each. Jadibot runs inside the same Node.js process and on the same Windows computer as the primary bot; it does not run independently.

The MAIN BOT and the secondary bot use different WhatsApp accounts and different auth directories:

- Main bot: data/auth
- Secondary session: data/jadibot/auth
- Secondary session metadata: data/jadibot/session.json
- Secondary independent group settings: data/jadibot/settings.json

The main owner grants premium by private chat:

    addpremium 6281111111111 30

That grants 30 days. The premium member then privately messages the MAIN BOT:

    jadibot 6282222222222

Replace 6282222222222 with a DIFFERENT, digits-only secondary WhatsApp number that the requester owns/controls. The bot sends a pairing code to the requesting user in private chat, never to a group. On the SECOND phone/account: WhatsApp → Linked devices → Link a device → Link with phone number; enter the received pairing code. Do not send the code to anyone else or pair an account that you do not own/control.

Check or close the secondary connection through private chat:

    cekjadibot
    stopjadibot

Only the renter or the primary bot owner can stop it. Stopping removes the child's credentials and metadata, NEVER the main bot's data/auth folder. After a stop the one slot becomes free. The child credentials are retained when stopping the overall Node process with Ctrl+C; on next launch linked sessions attempt to reconnect. If pairing is interrupted, the renter must send jadibot with the same number again.

If premium expires, the secondary socket suspends. Renew premium and send jadibot with the same number to resume; if you want to release the slot, send stopjadibot. Revoking premium through delpremium suspends the secondary bot immediately. The child bot cannot spawn more subbots. Renters are NOT automatically allowed to issue premium management commands.

## Security and operational caveats

The pairing code is sensitive. Neither the app nor user should post .env, auth files, or pairing codes. Only one Windows process should use these files at a time. WhatsApp itself can change the pairing workflow; automated GitHub unit tests do not verify actual account linking.

Do not copy original obfuscated command/case.js, exposed tokens, unsafe scrapers, or old Telegram/RapidAPI credentials. Rotate compromised historical API keys. A passing CI validates syntax, unit tests and npm audit; new commands and group moderation still require WhatsApp testing.

This development PR stays draft until its Jadibot pairing and group features are tested on a spare WhatsApp account.

If a stop happens while the child account is offline, the server may not complete a remote logout. For safety, the child account holder should also remove the old linked device from WhatsApp → Linked devices to revoke its access.
