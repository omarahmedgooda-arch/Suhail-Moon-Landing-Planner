@echo off
setlocal
cd /d "%~dp0"
if not exist "SUHAIL-offline.html" ( echo  SUHAIL-offline.html is not next to this file. & pause & exit /b 1 )
set "PAGE=%~dp0SUHAIL-offline.html"
set "CH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CH%" set "CH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CH%" set "CH=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CH%" start "" "%CH%" "%PAGE%" & exit /b 0
set "ED=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%ED%" set "ED=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%ED%" start "" "%ED%" "%PAGE%" & exit /b 0
start "" "%PAGE%"
