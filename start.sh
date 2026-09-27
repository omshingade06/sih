#!/bin/bash
echo "========================================================================="
echo "Starting eRTMAC-NWIS (Oil India Limited - RTDC Decision Support Platform)"
echo "========================================================================="

# Start backend
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Application launched."
echo "Frontend: http://localhost:5173"
echo "Backend Docs: http://localhost:8000/docs"

wait $BACKEND_PID $FRONTEND_PID
