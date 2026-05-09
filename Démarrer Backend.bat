@echo off
echo ==============================================
echo    DEMARRAGE DU SERVEUR CB-IMMOBILIER
echo ==============================================
echo.

cd /d "%~dp0backend"
start cmd /k "npm start"

echo [OK] Le serveur backend est en cours d'execution sur le port 3000.
echo [INFO] Ne fermez pas la fenetre noire qui vient de s'ouvrir.
pause
