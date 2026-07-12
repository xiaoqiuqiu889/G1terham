@echo off
setlocal
title Revolution Street Launcher
cd /d "%~dp0"

if /i "%~1"=="--check" (
  echo launcher-ok
  exit /b 0
)

set "PNPM="
where pnpm >nul 2>nul
if not errorlevel 1 set "PNPM=pnpm"

if not defined PNPM (
  set "BUNDLED_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
  if exist "%BUNDLED_PNPM%" set "PNPM=%BUNDLED_PNPM%"
)

if not defined PNPM (
  echo.
  echo [ERROR] pnpm was not found.
  echo Please install Node.js and pnpm, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\." (
  echo.
  echo First launch: installing game dependencies...
  call "%PNPM%" install --prefer-offline
  if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed. Check the network and try again.
    pause
    exit /b 1
  )
)

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo Game is already running. Opening browser...
  start "" "http://localhost:3000/"
  exit /b 0
)

echo.
echo Starting Revolution Street...
start "Revolution Street Local Server" cmd /k ""%PNPM%" exec vinext dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000/"

echo.
echo Game opened in your browser.
echo Close the Local Server window to stop the game.
timeout /t 2 /nobreak >nul
exit /b 0
