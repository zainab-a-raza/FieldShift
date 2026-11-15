@echo off

start cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

start cmd /k "cd /d %~dp0frontend && npm run dev"

echo FieldShift Backend and Frontend started!
