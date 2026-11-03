'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {renderStatusPage}=require('../src/status-page');

test('read-only status page shows connected state safely',()=>{
  const page=renderStatusPage({connected:true,uptimeSeconds:3679});
  assert.match(page,/<html lang="id">/);
  assert.match(page,/<h1>TERHUBUNG<\/h1>/);
  assert.match(page,/1 jam 1 menit/);
  assert.match(page,/Diperbarui otomatis setiap 20 detik/);
  assert.doesNotMatch(page,/QR code|PRIVATE KEY|data\/auth|ownerJid|pairing code/i);
  assert.doesNotMatch(page,/<form|<script|type="password"/i);
});
test('read-only status page shows offline and handles invalid uptime',()=>{
  const page=renderStatusPage({connected:false,uptimeSeconds:NaN});
  assert.match(page,/<h1>BELUM TERHUBUNG<\/h1>/);
  assert.match(page,/0 jam 0 menit/);
  assert.match(page,/class="badge offline">OFFLINE/);
});
