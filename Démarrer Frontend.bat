@echo off
echo ==============================================
echo    DEMARRAGE DU FRONTEND CB-IMMOBILIER
echo ==============================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [1/1] Installation des dependances...
    npm install
    echo.
) else (
    echo [INFO] Dependances deja installees.
    echo.
)

start cmd /k "npm run dev"

echo [OK] Le frontend est en cours d'execution.
echo [INFO] Ouverture automatique dans votre navigateur...
timeout /t 4 >nul
start http://localhost:5173

pause
