@echo off
echo ==============================================
echo    DEMARRAGE DU SERVEUR CB-IMMOBILIER
echo ==============================================
echo.

cd /d "%~dp0backend"

if not exist "node_modules" (
    echo [INFO] Installation des dependances backend...
    npm install
    echo.
)

start cmd /k "npm start"

echo [OK] Le serveur backend est en cours d'execution sur le port 3000.
echo [INFO] Ne fermez pas la fenetre noire qui vient de s'ouvrir.
pause
