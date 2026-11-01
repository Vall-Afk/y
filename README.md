# Beauté. — WhatsApp bot (Legacy + Modern)

**Owner:** Vall | **WhatsApp:** 6287721373781 | **Instagram:** @v4lonenonly
**Current development branch:** feature/beaute-legacy-modern

This is a readable modular rebuild of Vall-Afk/y, not the original obfuscated script. A growing subset of legacy commands is implemented alongside new tools, games and bounded public APIs. See [FEATURES.md](FEATURES.md) for the exact status of every category; *not all legacy functions have been migrated*. Do not blindly merge old command/case.js or copy leaked API keys.

## Install on Windows with PowerShell or CMD

Requires Node.js 22+, Git, and the WhatsApp mobile app. No VPS, Docker or Termux required.

Existing local checkout (keep .env and data/auth, do not delete the session folder):

    git fetch origin
    git switch --track origin/feature/beaute-legacy-modern
    npm install
    npm test
    npm run check
    npm audit --omit=dev
    npm start

If you already created the branch locally, use git switch feature/beaute-legacy-modern instead of the --track command. For a fresh clone:

    git clone --branch feature/beaute-legacy-modern https://github.com/Vall-Afk/y.git
    cd y
    copy .env.example .env
    notepad .env
    npm install
    npm start

Set in .env: OWNER_NUMBER=6287721373781, OWNER_NAME=Vall, OWNER_INSTAGRAM=v4lonenonly, BOT_NAME=Beauté. and PREFIX=! . Do not commit .env.

On first successful connection, a QR is displayed in terminal. On the phone: WhatsApp > Linked devices > Link a device; scan the QR. Existing connected sessions are reused automatically; no QR is shown if already connected.

To stop the bot, press Ctrl+C. Keep only one process using the same session folder and keep the terminal running while using the bot.

## Feature selection
Send !menu to view the commands actually implemented; category menus include !menugroup, !menutools, !menugame, !menurpg, !menuekonomi, !menudownload, !menumedia and !menuowner. Admin commands require actual WhatsApp group admin privileges. Owner commands use the configured owner number. Network commands have limited free quotas, optional premium and max response sizes. All balances and RPG items are virtual and have no cash value.

## Security / reliability
- Revoke all historical exposed Telegram/RapidAPI keys, cookies and BotKey. Historical Git commits remain accessible; rotating old keys is mandatory.
- .env and data/auth contain secrets: do not share, upload or commit them.
- Back up the data directory while the bot is stopped. data/economy.json holds economy and RPG; data/settings.json holds group flags.
- QR connectivity and new group mutations still require live testing; GitHub Actions only validates installation, unit tests, syntax and npm audit.
- External APIs (GitHub, Wikipedia and Open-Meteo) are not controlled by us and may change or fail.
- Do not merge into v9.1 until tests and trial group permissions are verified.
