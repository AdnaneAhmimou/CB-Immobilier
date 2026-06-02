@echo off
echo ==============================================
echo    DEMARRAGE DU FRONTEND CB-IMMOBILIER
echo ==============================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [INFO] Installation des dependances frontend...
    npm install
    echo.
)

start cmd /k "npm run dev"

echo [OK] Le frontend est en cours d'execution.
echo [INFO] Ouverture automatique dans votre navigateur...
timeout /t 3 >nul
start http://localhost:5173

pause
