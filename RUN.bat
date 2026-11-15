@echo off
setlocal
title SUHAIL - local run
cd /d "%~dp0"
echo.
echo  SUHAIL local run
echo  ----------------
where node >nul 2>nul
if %errorlevel%==0 goto node
where python >nul 2>nul
if %errorlevel%==0 goto py
where py >nul 2>nul
if %errorlevel%==0 goto pyl
echo  Node.js and Python are not installed - opening the offline version.
call "%~dp0OPEN-OFFLINE.bat"
exit /b 0
:node
if not exist node_modules (
  echo  First run: installing packages ^(needs internet, 1-2 minutes^)...
  call npm install
  if errorlevel 1 ( echo  npm install failed. & pause & exit /b 1 )
)
echo  Starting SUHAIL at http://localhost:5173  ^(close this window to stop^)
call npm run dev -- --port 5173 --open
pause
exit /b 0
:py
echo  Serving SUHAIL at http://localhost:5173  ^(close this window to stop^)
start "" http://localhost:5173
python -m http.server 5173 --directory dist
pause
exit /b 0
:pyl
echo  Serving SUHAIL at http://localhost:5173  ^(close this window to stop^)
start "" http://localhost:5173
py -m http.server 5173 --directory dist
pause
