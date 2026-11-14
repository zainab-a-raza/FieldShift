@echo off
echo ========================================================
echo Starting FieldShift Backend API (FastAPI)
echo NASA Space Apps Challenge 2026
echo ========================================================
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
