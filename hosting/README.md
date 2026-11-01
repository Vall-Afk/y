# Beauté. Free Hosting (Android Termux)

This is an **opt-in**, loopback-only panel. It does not replace the bot, change dependencies, or deploy a cloud server.

## Important compatibility warning
The legacy `v9.1` README says the original script does **not** support Termux. The panel can be installed, but the original bot may fail to start. First migrate/test the bot's Node.js dependencies on Android or use the newer compatible Beauté branch.

## Setup
1. Install Termux from F-Droid. In Termux:
   ```sh
   pkg update && pkg upgrade
   pkg install git nodejs
   git clone -b feat/beaute-free-hosting https://github.com/Vall-Afk/y.git beaute
   cd beaute
   npm install
   node hosting/panel.cjs
   ```
2. Read the access token using `cat .beaute-panel-token` (keep it private).
3. Open **http://127.0.0.1:8787** in the same phone's browser. Paste the token, then start the bot.
4. In a separate Termux session, optionally run `termux-wake-lock` and disable battery optimization for Termux. These reduce sleep issues but cannot guarantee uptime.
5. Keep Termux running. If Android kills it or the phone powers off, the panel and bot stop.

## Security
- Panel listens **only** on 127.0.0.1. Do not expose it using port forwarding or public tunnels.
- Token is randomly generated and saved in `.beaute-panel-token`, ignored by Git.
- Never commit WhatsApp session credentials, API keys or the panel token.
- No remote browser access in this free local edition.
- On Android, install failures may result from old native packages; do not bypass errors with untrusted scripts.

## Uptime
Free phone hosting has **no 24/7 SLA**. GitHub Actions is for CI, not long-running bots. A cloud VM with persistent storage is needed for uptime independent of the phone.
