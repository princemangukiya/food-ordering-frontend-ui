@echo off
title Stop FoodExpress Tunnel
echo Stopping Cloudflare tunnel...
taskkill /F /IM cloudflared.exe >nul 2>&1
echo Done! Cloudflare tunnel stopped.
timeout /t 2 >nul
