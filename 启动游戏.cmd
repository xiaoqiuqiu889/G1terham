@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Revolution Street Launcher
cd /d "%~dp0"

set "PORT=3000"
set "GAME_URL=http://localhost:%PORT%/"
set "BUNDLED_ROOT=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies"
set "VINEXT=%~dp0node_modules\.bin\vinext.cmd"

rem Prefer a recent Codex-bundled Node runtime when available, then normal installs.
if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
if exist "%BUNDLED_ROOT%\node\bin\node.exe" set "PATH=%BUNDLED_ROOT%\node\bin;%PATH%"

set "NODE_OK="
where node.exe >nul 2>nul
if not errorlevel 1 (
  node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)" >nul 2>nul
  if not errorlevel 1 set "NODE_OK=1"
)

set "PACKAGE_MANAGER="
set "PACKAGE_COMMAND="
for /f "delims=" %%P in ('where npm.cmd 2^>nul') do if not defined PACKAGE_COMMAND set "PACKAGE_COMMAND=%%P"
if defined PACKAGE_COMMAND set "PACKAGE_MANAGER=npm"
if not defined PACKAGE_COMMAND if exist "%BUNDLED_ROOT%\bin\fallback\pnpm.cmd" (
  set "PACKAGE_MANAGER=pnpm"
  set "PACKAGE_COMMAND=%BUNDLED_ROOT%\bin\fallback\pnpm.cmd"
)
if not defined PACKAGE_COMMAND (
  for /f "delims=" %%P in ('where pnpm.cmd 2^>nul') do if not defined PACKAGE_COMMAND set "PACKAGE_COMMAND=%%P"
  if defined PACKAGE_COMMAND set "PACKAGE_MANAGER=pnpm"
)

if /i "%~1"=="--check" (
  if not exist "%VINEXT%" (
    echo launcher-missing-dependencies
    exit /b 2
  )
  if not defined NODE_OK (
    echo launcher-missing-node
    exit /b 3
  )
  echo launcher-ok
  exit /b 0
)

if /i "%~1"=="--bootstrap-check" (
  if not defined NODE_OK (
    echo launcher-missing-node
    exit /b 3
  )
  if not defined PACKAGE_COMMAND (
    echo launcher-missing-package-manager
    exit /b 4
  )
  call "!PACKAGE_COMMAND!" --version >nul 2>nul
  if errorlevel 1 (
    echo launcher-package-manager-failed
    exit /b 5
  )
  echo launcher-package-manager=!PACKAGE_MANAGER!
  exit /b 0
)

if not exist "%VINEXT%" (
  if not defined NODE_OK (
    echo.
    echo [ERROR] Node.js 22.13 or newer was not found.
    echo Install the current Node.js LTS release, then double-click this file again:
    echo https://nodejs.org/
    pause
    exit /b 1
  )

  set "WRITE_PROBE=%~dp0.launcher-write-test-!RANDOM!.tmp"
  echo launcher-write-test>"!WRITE_PROBE!" 2>nul
  if not exist "!WRITE_PROBE!" (
    echo.
    echo [ERROR] This game folder is read-only for the current Windows account.
    echo Move the whole folder out of Program Files and into Desktop or Documents.
    echo Then double-click this file again. Administrator mode is not required.
    pause
    exit /b 1
  )
  del /q "!WRITE_PROBE!" >nul 2>nul

  if not defined PACKAGE_COMMAND (
    echo.
    echo [ERROR] A Node.js package manager was not found.
    echo Reinstall the current Node.js LTS release, then try again:
    echo https://nodejs.org/
    pause
    exit /b 1
  )

  echo.
  echo First launch: installing game dependencies...
  echo Package manager: !PACKAGE_MANAGER!
  if /i "!PACKAGE_MANAGER!"=="npm" (
    call "!PACKAGE_COMMAND!" ci --ignore-scripts --no-audit --no-fund
  ) else (
    call "!PACKAGE_COMMAND!" install --ignore-scripts --prefer-offline --frozen-lockfile
  )
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    echo Check the network and try again.
    echo If this folder is under Program Files, move it to Desktop or Documents and retry.
    pause
    exit /b 1
  )
)

if not exist "%VINEXT%" (
  echo.
  echo [ERROR] Game runtime is incomplete.
  echo Delete the node_modules folder, then double-click this file again.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  echo Game is already running. Opening browser...
  start "" "%GAME_URL%"
  exit /b 0
)

echo.
echo Starting Revolution Street...
start "Revolution Street Local Server" "%ComSpec%" /d /k call "%VINEXT%" dev
set "SERVER_READY="
for /l %%I in (1,1,20) do (
  if not defined SERVER_READY (
    netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
    if not errorlevel 1 (
      set "SERVER_READY=1"
    ) else (
      timeout /t 1 /nobreak >nul
    )
  )
)

if not defined SERVER_READY echo The server is still starting; the page will refresh when ready.
start "" "%GAME_URL%"
echo.
echo Game opened in your browser.
echo Close the Local Server window to stop the game.
timeout /t 2 /nobreak >nul
exit /b 0
