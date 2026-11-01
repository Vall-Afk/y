# Beauté. Cloud — Windows 11 Home local hosting

This is a **local development panel**, not a remote cloud service. No Termux, Docker, VPS, Railway or Heroku required.

## Installation
1. Install Node.js 22+ and Git on Windows 11.
2. Clone `https://github.com/Vall-Afk/y.git`, then `git switch feat/beaute-windows-local-host` (or merge PR into `feature/beaute-legacy-modern`).
3. In the repository root, copy `.env.example` to `.env` and configure the bot. Never commit `.env`.
4. Double-click `local-panel/start-windows.bat`. It installs dependencies if needed and starts the panel.
5. Open `http://127.0.0.1:8787` in the laptop browser. Copy the randomly generated admin token printed in the command window, paste into the dashboard, then click Start.
6. For WhatsApp pairing, follow the bot's terminal logs. Some terminal QR output may not render correctly in the browser; use the bot's supported pairing mechanism.

## Limits
- Laptop must stay on while the bot runs. Sleep, shutdown, or closing the panel window stops hosting.
- Panel defaults to loopback-only `127.0.0.1` for security. Phone access over Wi-Fi is **not enabled by default**; do not expose port 8787 to the internet.
- Panel shows child-process state, not verified WhatsApp connection.
- Panel logs can contain pairing or session secrets; do not share them.
- GitHub updates are intentionally manual: `git pull` while bot is stopped, followed by dependency install if required. No unauthenticated remote command execution.
- `BEAUTE_PANEL_TOKEN` may be set to a long secret to persist login across restarts; otherwise a new token is printed at startup.
- The bot's `.env`, auth/session and database paths remain those of the existing development SC. Confirm they are persistent and not committed.
