# Beauté. WhatsApp Bot — clean audited baseline

This branch replaces legacy obfuscated files with a smaller, readable WhatsApp bot. Legacy RPG/premium/downloaders/top-up are NOT preserved; they need separate verified implementations. Attribution for the original repository: ZeeoneOfc / Vall-Afk.

## Run and scan
Requirements: Node.js 22+, npm, WhatsApp mobile account, internet access.
1. Checkout branch rebuild/beaute-secure-20261101.
2. Run npm install.
3. Copy .env.example to .env and set OWNER_NUMBER to your international number without + or spaces.
4. Run npm test && npm run check && npm start.
5. On phone: WhatsApp > Settings > Linked devices > Link a device; scan the QR printed in terminal.
6. Test !ping and !menu from a separate number.

Commands: !menu, !ping, !status, !owner, !sticker (image/caption or reply), !toimg (reply to sticker), !groupinfo. Group admins: !welcome on|off, !antilink on|off, !kick @user (requires bot admin). Owner: !mode public|private.

## Docker
Create .env, then run docker compose up --build -d, and show QR using docker compose logs -f bot. Persistent volume /app/data retains the WhatsApp session.

## Security
Never commit .env or data/auth. All old Telegram/RapidAPI keys and cookie secrets were exposed in the previous branch/history and MUST be revoked by their owners. Session files grant access; run only one instance per session. Settings use atomic file replacement. Health endpoint on 127.0.0.1:3000/healthz returns no secrets. Run npm audit --omit=dev, review installed dependencies, and test real WhatsApp pairing before production.

## Verification limitations
This is a tested-by-design baseline, not a guarantee of real WhatsApp compatibility. The authoring environment has no npm network access and cannot pair with your phone, so actual npm installation, QR scanning, media processing and live group moderation still require testing by the operator. CI is provided for automated install, tests and audit.
