@echo off
echo ==============================================
echo    DEMARRAGE DU SERVEUR CB-IMMOBILIER
echo ==============================================
echo.

cd /d "%~dp0backend"

if not exist "node_modules" (
    echo [1/3] Installation des dependances...
    npm install
    echo.
    echo [2/3] Generation du client Prisma...
    call npx prisma generate
    echo.
    echo [3/3] Initialisation de la base de donnees...
    call npx prisma db push
    echo.
) else (
    echo [INFO] Dependances deja installees.
    echo.
)

start cmd /k "npm start"

echo [OK] Le serveur backend est en cours d'execution sur le port 3001.
echo [INFO] Ne fermez pas la fenetre noire qui vient de s'ouvrir.
pause
