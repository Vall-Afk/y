#requires -Version 5.1
<#
.SYNOPSIS
  Expose read-only Beauté status using a free Cloudflare Quick Tunnel with email OTP.
.EXAMPLE
  .\scripts\start-cloudflare-https.ps1
.EXAMPLE
  .\scripts\start-cloudflare-https.ps1 -AllowedEmail "you@example.com"
#>
[CmdletBinding()]
param(
    [string]$AllowedEmail = "",
    [int]$Port = 0
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($AllowedEmail)) {
    $AllowedEmail = (Read-Host "Email pemilik Beauté untuk OTP Cloudflare").Trim()
}
if ($AllowedEmail -notmatch '^[A-Za-z0-9.!#$%&''+/=?^_~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' -or
    $AllowedEmail.Length -gt 254) {
    throw "Email tidak valid. Gunakan satu email pribadi, bukan wildcard."
}
if ($Port -eq 0) {
    $Port = 3000
    $envFile = Join-Path $root ".env"
    if (Test-Path -LiteralPath $envFile) {
        foreach ($line in [System.IO.File]::ReadAllLines($envFile)) {
            if ($line -match '^\s*PORT\s*=\s*["'']?([0-9]+)') { $Port = [int]$Matches[1] }
        }
    }
}
if ($Port -lt 1 -or $Port -gt 65535) { throw "PORT harus di antara 1 dan 65535." }
$origin = "http://127.0.0.1:$Port"
try {
    $health = Invoke-RestMethod -Uri "$origin/healthz" -Method Get -TimeoutSec 5
} catch {
    throw "Bot belum berjalan di $origin. Jalankan npm.cmd start pada PowerShell lain."
}
if ($health.alive -ne $true -or $null -eq $health.connected) {
    throw "Endpoint di $origin bukan status resmi Beauté. Tunnel dibatalkan."
}
$cloudflared = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
if (-not $cloudflared) { $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue }
if (-not $cloudflared) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "cloudflared belum tersedia. Install: https://developers.cloudflare.com/tunnel/downloads/"
    }
    Write-Host "Memasang cloudflared resmi menggunakan winget..." -ForegroundColor Cyan
    & winget install --id Cloudflare.cloudflared --exact --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) { throw "Gagal memasang cloudflared lewat winget." }
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
        [Environment]::GetEnvironmentVariable('Path','User')
    $cloudflared = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
    if (-not $cloudflared) { $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue }
    if (-not $cloudflared) {
        foreach ($possible in @(
            (Join-Path $env:ProgramFiles 'cloudflared\cloudflared.exe'),
            (Join-Path ([Environment]::GetFolderPath('ProgramFilesX86')) 'cloudflared\cloudflared.exe')
        )) {
            if (Test-Path -LiteralPath $possible) {
                $cloudflared = Get-Item -LiteralPath $possible
                break
            }
        }
    }
}
if (-not $cloudflared) { throw "cloudflared tidak ditemukan. Buka ulang PowerShell." }
$exe = if ($cloudflared.PSObject.Properties['Source']) { $cloudflared.Source } else { $cloudflared.FullName }
$versionOutput = (& $exe --version 2>&1 | Out-String)
if ($versionOutput -notmatch '(\d{4})\.(\d{1,2})\.(\d{1,2})') {
    throw "Versi cloudflared tidak dapat dibaca. Update terlebih dahulu."
}
$version = New-Object System.Version([int]$Matches[1],[int]$Matches[2],[int]$Matches[3])
if ($version -lt [version]'2026.10.2') {
    throw "Cloudflared $version terlalu lama untuk --allowed-mail. Jalankan: winget upgrade --id Cloudflare.cloudflared"
}
Write-Host ""
Write-Host "Beauté · Secure HTTPS" -ForegroundColor Magenta
Write-Host "Target lokal: $origin" -ForegroundColor Gray
Write-Host "Akses email OTP: $AllowedEmail" -ForegroundColor Green
Write-Host "Salin alamat https://....trycloudflare.com yang muncul berikut ini." -ForegroundColor Cyan
Write-Host "Ctrl+C untuk menutup tunnel. Link baru dibuat setiap kali tunnel dijalankan." -ForegroundColor Yellow
Write-Host ""
& $exe tunnel --url $origin --allowed-mail $AllowedEmail
if ($LASTEXITCODE -ne 0) { throw "Cloudflare Tunnel berhenti dengan kode $LASTEXITCODE." }
