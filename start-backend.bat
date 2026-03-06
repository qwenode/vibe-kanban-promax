@echo off
cd /d "%~dp0"
pnpm run backend:dev:watch
pause
