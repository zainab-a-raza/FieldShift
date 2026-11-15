@echo off
cd /d "%~dp0frontend"
if not exist "node_modules\next\package.json" (
    echo Frontend dependencies not found. Run run.bat first.
    exit /b 1
)
echo Starting FieldShift frontend at http://localhost:3000
call npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
