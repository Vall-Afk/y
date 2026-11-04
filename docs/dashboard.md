# Beauté Owner Dashboard

The web root (PORT, default 3000) is now a password-gated owner control panel. The old read-only status page is not exposed publicly. All API status and control routes require an authenticated session.

## First-time setup on Windows / PowerShell

1. Update the working tree to this feature branch and install dependencies:
   npm install
2. Make sure the local .env exists and is not tracked by Git.
3. Generate a password hash and session secret interactively:
   npm run dashboard:setup
   - Choose a password of at least 16 characters.
   - Input is hidden in an interactive terminal.
   - The helper writes only a scrypt hash and a random session secret to local .env; it never prints either value.
4. Restart Beauté:
   npm start
5. Start Cloudflare Tunnel in a second PowerShell:
   cloudflared tunnel --protocol http2 --url http://127.0.0.1:3000
6. Open the newly generated HTTPS URL. The Quick Tunnel URL changes when the tunnel is recreated.

## Authentication and security

- Required environment values: DASHBOARD_PASSWORD_HASH and DASHBOARD_SESSION_SECRET.
- Missing or invalid credentials fail closed: the web server returns HTTP 503 and does not expose bot status.
- Passwords are verified with Node.js scrypt (N=16384, r=8, p=1, 64-byte key) and constant-time comparison.
- Successful login creates a random, in-memory, HttpOnly, SameSite=Strict cookie; Secure is added for HTTPS / Cloudflare requests.
- Session idle expiry is 8 hours. Sessions are invalidated when the process restarts.
- Login attempts are limited to five failures per IP per 15-minute window.
- State-changing API calls require same-origin requests; no CORS access is enabled.
- Content Security Policy, frame denial, no-store caching, nosniff and no-referrer headers are sent.
- The dashboard is bound to 127.0.0.1; use Cloudflare Tunnel for remote access. Do not bind this control panel to all network interfaces.
- Never commit .env, WhatsApp auth files, API keys, password hashes or session secrets.

## Available controls

- Live WhatsApp connection state, process uptime, RAM, downloader counters and jadibot state.
- Owner automation toggles: autoread, autobio, autorespond and anticall.
- Request a reconnect of the main WhatsApp session.
- Logout / lock the browser session.

The dashboard deliberately does not expose arbitrary shell commands, raw WhatsApp credentials, QR codes, auth files, unrestricted message sending, or destructive database controls. Additional controls should be added as explicit allowlisted actions with tests and audit logging.

## Cloudflare

Quick Tunnel provides a temporary public URL and has no uptime guarantee. Keep the bot and cloudflared processes running. For production, create a Named Tunnel on a Cloudflare account and attach a domain. Consider adding Cloudflare Access as a second authentication layer in front of the application password.

## Troubleshooting

- HTTP 503 at /: run npm run dashboard:setup, then restart the bot.
- HTTP 401 from /api/status: log in again; the session may have expired or the bot restarted.
- HTTP 403 on an action: use the dashboard from its own origin; cross-origin actions are rejected.
- HTTP 502 from the public URL: verify Beauté is listening on the local port before checking the tunnel.
