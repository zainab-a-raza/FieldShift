@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
    echo Backend virtual environment not found. Run run.bat first.
    exit /b 1
)
echo Starting FieldShift backend at http://localhost:8000
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
