@echo off
setlocal
cd /d "%~dp0"

echo FieldShift setup
echo.
where py >nul 2>&1
if not errorlevel 1 (
    set "FIELD_SHIFT_PYTHON=py -3"
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python 3.10 or newer was not found. Install Python and add it to PATH.
        exit /b 1
    )
    set "FIELD_SHIFT_PYTHON=python"
)
%FIELD_SHIFT_PYTHON% -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)"
if errorlevel 1 (
    echo ERROR: Python 3.10 or newer is required.
    exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js 20.9 or newer was not found. Install Node.js and npm.
    exit /b 1
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found. Reinstall Node.js with npm and add it to PATH.
    exit /b 1
)
node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 20 || (major === 20 && minor >= 9) ? 0 : 1)"
if errorlevel 1 (
    echo ERROR: Node.js 20.9 or newer is required by Next.js.
    exit /b 1
)
if not exist "backend\.venv\Scripts\python.exe" (
    echo Creating backend virtual environment...
    %FIELD_SHIFT_PYTHON% -m venv "backend\.venv"
    if errorlevel 1 (
        echo ERROR: Could not create the Python virtual environment.
        exit /b 1
    )
)
if not exist "backend\.env" (
    copy /y "backend\.env.example" "backend\.env" >nul
    if errorlevel 1 (
        echo ERROR: Could not create backend\.env.
        exit /b 1
    )
    echo Created backend\.env with sample data enabled.
)
echo Installing backend dependencies...
"%~dp0backend\.venv\Scripts\python.exe" -m pip install -r "%~dp0backend\requirements.txt"
if errorlevel 1 (
    echo ERROR: Backend dependency installation failed. Check your internet connection and Python environment.
    exit /b 1
)
echo Installing frontend dependencies...
pushd "%~dp0frontend"
call npm.cmd install
if errorlevel 1 (
    popd
    echo ERROR: Frontend dependency installation failed. Check your internet connection and Node.js installation.
    exit /b 1
)
popd
if /i "%~1"=="--setup-only" (
    echo Setup completed. Servers were not started.
    exit /b 0
)
echo Starting the backend and frontend in separate terminal windows...
start "FieldShift Backend" cmd /k call "%~dp0run_backend.bat"
start "FieldShift Frontend" cmd /k call "%~dp0run_frontend.bat"
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo Check the new terminal windows for startup errors. Stop each server with Ctrl+C.
exit /b 0
