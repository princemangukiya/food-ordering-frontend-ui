@echo off
title FoodExpress Cloudflare Public Tunnel
cd /d "%~dp0"
echo ===================================================
echo Starting Cloudflare Public Internet Tunnel Manager
echo Local Port: http://localhost:5180
echo ===================================================
node tunnel-runner.js
pause
