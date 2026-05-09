@echo off
echo ==============================================
echo    CB-IMMOBILIER - Demarrage du serveur
echo ==============================================
echo.

cd /d "%~dp0backend"

:: Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo [1/3] Installation des dependances...
    call npm install
    echo.
)

:: Generate Prisma client and create/update the database
echo [2/3] Preparation de la base de donnees...
call npx prisma generate
call npx prisma db push
echo.

:: Start the server
echo [3/3] Demarrage du serveur...
echo.
node server.js

echo.
echo Le serveur s'est arrete. Appuyez sur une touche pour fermer.
pause > nul
