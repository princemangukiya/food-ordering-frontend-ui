@echo off
title FoodExpress - Live Online Sharing Tunnel
cd /d "%~dp0"
echo ========================================================
echo Starting FoodExpress Public Live Tunnel Manager...
echo Automatically captures live URL, updates QR code in app,
echo and keeps connection alive to prevent Error 1033!
echo ========================================================
echo.
node tunnel-runner.js
pause
