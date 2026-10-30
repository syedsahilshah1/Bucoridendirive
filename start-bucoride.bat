@echo off
echo ========================================================
echo   BUCORIDE - RIDE-HAILING & PARCEL DELIVERY PLATFORM
echo   Theme: Yellow & Dark Grey with Live Topology Canvas
echo ========================================================
echo.

echo [1/3] Starting Laravel API Server on http://localhost:8005 ...
start "BUCORIDE Backend API" cmd /k "cd /d %~dp0backend && php artisan serve --port=8005"

echo [2/3] Starting Laravel Reverb WebSocket Server on port 8080 ...
start "BUCORIDE Reverb WebSockets" cmd /k "cd /d %~dp0backend && php artisan reverb:start --port=8080"

echo [3/3] Starting React Vite Frontend on http://localhost:5173 ...
start "BUCORIDE Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All BUCORIDE platform services launched!
echo Open http://localhost:5173 in browser.
echo Demo Accounts:
echo   - Customer: customer@bucoride.com / password
echo   - Boda Driver: driver.boda@bucoride.com / password
echo   - Car Driver: driver.car@bucoride.com / password
echo   - Admin: admin@bucoride.com / password
echo ========================================================
pause
