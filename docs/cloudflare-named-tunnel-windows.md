# Beauté dashboard: persistent Cloudflare Named Tunnel on Windows

Quick Tunnels are temporary. The hostname changes when a new Quick Tunnel is created, and they have no uptime guarantee. For a stable URL, use a Cloudflare account, a domain managed by Cloudflare, and a Named Tunnel.

## Prerequisites

- A Cloudflare account.
- A domain added to Cloudflare with its DNS zone active.
- Beauté running locally on 127.0.0.1:3000.
- cloudflared installed on Windows and available in PATH.

Do not publish port 3000 directly on the router or bind the dashboard to 0.0.0.0. Keep the local app bound to 127.0.0.1 and expose it only through the tunnel.

## One-time setup (PowerShell)

1. Authenticate cloudflared with Cloudflare:

   `cloudflared tunnel login`

   A browser opens. Select the Cloudflare account and authorize the domain.

2. Create a named tunnel:

   `cloudflared tunnel create beaute-dashboard`

   Save the tunnel UUID printed by the command. cloudflared also creates a credentials JSON file under `%USERPROFILE%\.cloudflared\`. Treat that file as a secret; never commit or share it.

3. Create a DNS route for a hostname on your domain. Replace the example hostname with a subdomain in your own Cloudflare-managed domain:

   `cloudflared tunnel route dns beaute-dashboard dashboard.example.com`

4. Create `%USERPROFILE%\.cloudflared\config.yml` with the actual tunnel UUID and exact credentials file path:

   ```yaml
   tunnel: YOUR-TUNNEL-UUID
   credentials-file: C:\\Users\\YOUR-WINDOWS-USER\\.cloudflared\\YOUR-TUNNEL-UUID.json

   ingress:
     - hostname: dashboard.example.com
       service: http://127.0.0.1:3000
     - service: http_status:404
   ```

   Replace both example values. Protect the credentials JSON and config directory with Windows account permissions.

5. Start Beauté in one PowerShell window:

   `cd D:\\Beaute`
   
   `npm start`

6. Start the named tunnel in another PowerShell window:

   `cloudflared tunnel run beaute-dashboard`

7. Open `https://dashboard.example.com` and sign in with the dashboard password created by `npm run dashboard:setup`.

## Optional: run cloudflared as a Windows service

After confirming the named tunnel works interactively, install it as a Windows service from an elevated PowerShell:

`cloudflared service install`

The service uses the default cloudflared config directory for the current machine/service account. Make sure the config and credentials JSON are placed where that service account can read them. Do not install the service until the interactive command works.

Beauté itself must also be managed as a separate process/service if it should start automatically. Keep its working directory, environment file, and data/auth directories protected. Do not run multiple copies against the same WhatsApp auth directory.

## Security recommendations

- Keep the dashboard password unique and at least 16 characters.
- Use Cloudflare Access as an additional identity gate if available; keep the app password as a second layer.
- Do not share the tunnel credentials JSON, `.env`, WhatsApp `data/auth`, or browser session cookies.
- Restrict the hostname through Cloudflare Access policies if the dashboard should be reachable only by the owner.
- The dashboard's application password is still required even when Cloudflare Access is enabled.
- A Named Tunnel gives a stable hostname, not guaranteed uptime. The PC, Beauté process, internet connection, and cloudflared service must remain running.
- If the PC sleeps, shuts down, or loses internet, the dashboard and bot become unavailable.

## Verification

From the Windows machine:

`Invoke-WebRequest http://127.0.0.1:3000 -UseBasicParsing | Select-Object StatusCode`

From an external device/network, open the HTTPS hostname and verify that:
- the login page loads;
- an incorrect password is rejected;
- the correct password opens the dashboard;
- logout locks the dashboard again.

Never expose an unauthenticated status endpoint or the WhatsApp auth directory through the tunnel.
