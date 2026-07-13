@echo off
setlocal
title Revolution Street Launcher
cd /d "%~dp0"

set "BUNDLED_ROOT=C:\Users\xiaoqiu\.cache\codex-runtimes\codex-primary-runtime\dependencies"
set "PATH=C:\Program Files\nodejs;%BUNDLED_ROOT%\node\bin;%PATH%"
set "VINEXT=%~dp0node_modules\.bin\vinext.cmd"

if /i "%~1"=="--check" (
  if not exist "%VINEXT%" (
    echo launcher-missing-dependencies
    exit /b 2
  )
  where node >nul 2>nul
  if errorlevel 1 (
    echo launcher-missing-node
    exit /b 3
  )
  echo launcher-ok
  exit /b 0
)

if not exist "%VINEXT%" (
  set "PNPM="
  if exist "%BUNDLED_ROOT%\bin\fallback\pnpm.cmd" set "PNPM=%BUNDLED_ROOT%\bin\fallback\pnpm.cmd"
  if not defined PNPM (
    where pnpm >nul 2>nul
    if not errorlevel 1 set "PNPM=pnpm"
  )

  echo.
  echo First launch: installing game dependencies...
  if defined PNPM (
    call "%PNPM%" install --ignore-scripts --prefer-offline
  ) else (
    where npm >nul 2>nul
    if errorlevel 1 (
      echo [ERROR] Node.js package manager was not found.
      echo Open Codex and ask: Start D:\G1-next
      pause
      exit /b 1
    )
    call npm install --ignore-scripts
  )
  if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed. Check the network and try again.
    pause
    exit /b 1
  )
)

if not exist "%VINEXT%" (
  echo [ERROR] Game runtime is incomplete. Delete node_modules and try again.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo Game is already running. Opening browser...
  start "" "http://localhost:3000/"
  exit /b 0
)

echo.
echo Starting Revolution Street...
start "Revolution Street Local Server" cmd /k ""%VINEXT%" dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000/"

echo.
echo Game opened in your browser.
echo Close the Local Server window to stop the game.
timeout /t 2 /nobreak >nul
exit /b 0
