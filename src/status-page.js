'use strict';
// Read-only status page. Cloudflare protected tunnel handles public authentication.
// Never expose WhatsApp auth, account identifiers, QR or administrative controls.
function renderStatusPage({connected=false,uptimeSeconds=0}={}){
  const online=connected===true;
  const status=online?'TERHUBUNG':'BELUM TERHUBUNG';
  const explanation=online?'Bot terhubung ke WhatsApp.':'Bot sedang mencoba menghubungkan WhatsApp.';
  const uptime=Math.max(0,Math.floor(Number.isFinite(uptimeSeconds)?uptimeSeconds:0));
  const duration=Math.floor(uptime/3600)+' jam '+Math.floor((uptime%3600)/60)+' menit';
  return [
    '<!doctype html><html lang="id"><head>',
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta http-equiv="refresh" content="20"><meta name="theme-color" content="#101019">',
    '<title>Beauté · Status Bot</title>',
    '<style>',
    ':root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif}',
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 85% 0,#3c224a 0,transparent 34%),linear-gradient(135deg,#101019,#141322 60%,#090b12);color:#f6f2fc;display:grid;place-items:center;padding:20px}',
    '.panel{width:100%;max-width:530px;background:#1f2030;border:1px solid #39364c;border-radius:26px;box-shadow:0 24px 80px #05050999;padding:36px}',
    '.brand{display:flex;align-items:center;gap:14px;margin-bottom:35px}.glyph{width:56px;height:56px;display:grid;place-items:center;border-radius:18px;background:#433052;font-size:28px}.name{font-weight:800;font-size:25px;letter-spacing:-.05em}.sub{color:#bdb7c9;font-size:12px;letter-spacing:.08em;text-transform:uppercase}',
    '.eyebrow{color:#b9afc6;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 11px}h1{font-size:clamp(25px,6vw,39px);line-height:1.16;letter-spacing:-.04em;margin:0 0 13px}.desc{font-size:14px;color:#c5bed0;line-height:1.6;margin:0 0 24px}',
    '.badge{display:inline-flex;gap:9px;align-items:center;border-radius:100px;padding:10px 14px;font-size:12px;letter-spacing:.04em;font-weight:750}.badge:before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}.connected{color:#75e5b6;background:#103e33}.offline{color:#ffd192;background:#463321}',
    '.info{border-top:1px solid #393648;padding-top:22px;margin-top:33px;display:flex;justify-content:space-between;align-items:center}.small{font-size:12px;color:#a9a1b6}.value{font-size:15px;font-weight:650;font-variant-numeric:tabular-nums}footer{font-size:12px;color:#9991ab;margin-top:25px;line-height:1.7}',
    '</style></head><body><main class="panel">',
    '<div class="brand"><div class="glyph" aria-hidden="true">✦</div><div><div class="name">Beauté.</div><div class="sub">WhatsApp Bot · Status</div></div></div>',
    '<p class="eyebrow">Kondisi layanan</p><h1>'+status+'</h1>',
    '<p class="desc">'+explanation+'</p>',
    '<div class="badge '+(online?'connected':'offline')+'">'+(online?'ONLINE':'OFFLINE')+'</div>',
    '<div class="info"><div class="small">Uptime proses</div><div class="value">'+duration+'</div></div>',
    '<footer>Halaman hanya-baca · Diperbarui otomatis setiap 20 detik.<br>Tanpa akses ke QR, kredensial, atau administrasi bot.</footer>',
    '</main></body></html>'
  ].join('\n');
}
module.exports={renderStatusPage};
