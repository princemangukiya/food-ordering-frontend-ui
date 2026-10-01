@echo off
title FoodExpress Live Server ^& Tunnel
color 0A
cd /d "E:\project\food-ordering-ui"

echo =======================================================
echo    FoodExpress Live Server ^& Cloudflare Tunnel
echo =======================================================
echo.

:: Check if Vite is running on port 5180
netstat -ano | findstr :5180 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [*] Starting Vite Frontend Server...
    start /min "FoodExpress-Vite" cmd /c "npm run dev"
    timeout /t 3 >nul
) else (
    echo [OK] Vite Frontend Server is already running on port 5180.
)

echo [*] Starting Cloudflare Live Tunnel...
echo [*] Mobile link will appear below:
echo.
node tunnel-runner.js
pause
