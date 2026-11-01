@echo off
setlocal
cd /d "%~dp0.."
where node >nul 2>&1 || (echo Install Node.js 22+ from https://nodejs.org/ & pause & exit /b 1)
if not exist ".env" (
  echo ERROR: .env belum ada. Salin .env.example menjadi .env dan isi pengaturannya.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (pause & exit /b 1)
)
echo Starting Beauté. Local Panel...
node local-panel\server.cjs
pause
