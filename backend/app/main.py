import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.seed_data import seed_database
from app.services.telemetry_simulator import simulator
from app.api import (
    auth, wells, formations, incidents, mitigations,
    telemetry, hazards, alerts, documents,
    knowledge_graph, ask_nwis, analytics,
    audit_logs, exports, admin
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed demo data
    Base.metadata.create_all(bind=engine)
    seed_database()
    # Start telemetry simulator broadcast task in background
    sim_task = asyncio.create_task(simulator.broadcast_loop())
    yield
    # Shutdown
    sim_task.cancel()

app = FastAPI(
    title="eRTMAC-NWIS API",
    description="AI-Powered Nearby Wells Intelligence & Proactive Drilling Risk Decision Support Platform — Oil India Limited (OIL)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(wells.router, prefix=settings.API_V1_STR)
app.include_router(formations.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(mitigations.router, prefix=settings.API_V1_STR)
app.include_router(telemetry.router, prefix=settings.API_V1_STR)
app.include_router(hazards.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(knowledge_graph.router, prefix=settings.API_V1_STR)
app.include_router(ask_nwis.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(audit_logs.router, prefix=settings.API_V1_STR)
app.include_router(exports.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "title": settings.PROJECT_TITLE,
        "operator": settings.OPERATOR,
        "status": "ONLINE",
        "docs_url": "/docs",
        "telemetry_stream": "SIMULATED eRTMAC STREAM",
        "version": "1.0.0"
    }

@app.websocket("/ws/telemetry/{well_id}")
async def websocket_telemetry_endpoint(websocket: WebSocket, well_id: int):
    await simulator.connect(websocket, well_id)
    try:
        while True:
            # Handle incoming control commands over WebSocket if any
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        simulator.disconnect(websocket, well_id)
    except Exception:
        simulator.disconnect(websocket, well_id)

@app.websocket("/ws/alerts/{well_id}")
async def websocket_alerts_endpoint(websocket: WebSocket, well_id: int):
    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(5.0)
            # Periodic heartbeats for alert updates
            await websocket.send_json({
                "type": "ALERT_SYNC",
                "well_id": well_id,
                "timestamp": "now"
            })
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
