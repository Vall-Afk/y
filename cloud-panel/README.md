# Beauté. Cloud Web Control Panel (development)

Target: `feature/beaute-legacy-modern` (v1.5.0, Node.js 22+). Panel files live in `cloud-panel/` and do not modify existing bot modules.

## Railway deploy from Android browser
1. Review and merge this PR into `feature/beaute-legacy-modern` after tests.
2. Open https://railway.com/ and create a project from GitHub repo `Vall-Afk/y`; select branch `feature/beaute-legacy-modern` after merge, or this PR branch for a test deployment.
3. Railway service settings: build with the root `Dockerfile.cloud` (Railway Dockerfile path `Dockerfile.cloud`); port is supplied through `PORT`.
4. Add private environment variables: `PANEL_TOKEN` (random 32+ characters), `OWNER_NUMBER` (owner WhatsApp number), `BOT_AUTOSTART=true`, and any required bot configuration from `.env.example`. Never commit secrets. `PANEL_TOKEN` must be at least 24 characters.
5. Configure a Railway persistent volume mounted at `/app/data` **if available on your plan**. The bot must store its auth and database inside that directory; inspect `src/config.js` and verify paths before production. Without persistent storage, redeploy may lose the WhatsApp session.
6. Deploy, generate a public HTTPS domain from Railway networking, open it from the phone, enter `PANEL_TOKEN` and inspect logs. HTTPS is required when accessing the public panel.
7. Run `npm test` and `npm run check` in CI or locally before merging. Actual WhatsApp pairing and uptime must be tested on the provider.

## Limits and security
- This panel runs as a single service alongside the bot, not a separate always-on control plane.
- Dashboard shows Node child-process status, **not** confirmed WhatsApp connection. Review logs to check pairing.
- Admin endpoints require a strong bearer token; use HTTPS and don't share the token. Avoid posting raw logs/screenshots because they can contain QR/session data. Automated log redaction is best effort only.
- Never run two bot instances with the same WhatsApp session. Do not enable horizontal scaling.
- Do not add unauthenticated update-code or shell-execution endpoints. GitHub sync should be done through reviewed commits and Railway redeploy.
- Railway Free credit and RAM limits can stop a continuously running service; no 24/7 guarantee.
