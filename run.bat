@echo off

start cmd /k "cd /d D:\FieldShift\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

start cmd /k "cd /d D:\FieldShift\frontend && npm run dev"

echo FieldShift Backend and Frontend started!