@echo off
cd /d "%~dp0website"
start cmd /k "npm run dev"
echo Website lancé sur http://localhost:5174
