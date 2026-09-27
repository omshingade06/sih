@echo off
echo =========================================================================
echo Starting eRTMAC-NWIS (Oil India Limited - RTDC Decision Support Platform)
echo =========================================================================

echo Starting FastAPI Backend on http://localhost:8000 ...
start cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Vite React Frontend on http://localhost:5173 ...
start cmd /k "cd frontend && npm run dev"

echo.
echo Application successfully launched!
echo Open your browser at: http://localhost:5173
echo API Documentation available at: http://localhost:8000/docs
echo =========================================================================
pause
