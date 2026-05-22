@echo off
echo ==============================================
echo    CB-IMMOBILIER - Reinitialisation de la Base de Donnees
echo ==============================================
echo.
echo ATTENTION : Cette action va effacer TOUTES les donnees de l'application !
echo (Clients, Biens, Transactions, Documents, etc.)
echo.
echo Appuyez sur CTRL+C pour annuler, ou sur n'importe quelle autre touche pour continuer.
pause
echo.

cd /d "%~dp0backend"

echo [1/2] Reinitialisation de la base de donnees...
call npx prisma migrate reset --force
echo.

echo [2/2] Suppression des fichiers telecharges (uploads)...
if exist "uploads\" (
    del /q /s "uploads\*.*"
    echo Fichiers supprimes.
)
echo.

echo La base de donnees et les fichiers ont ete reinitialises avec succes !
echo.
echo Appuyez sur une touche pour fermer cette fenetre.
pause > nul
