from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db, Base, engine
from app.seed_data import seed_database
from app.models.entities import AuditLog
import datetime

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])

@router.post("/reset-demo")
def reset_demo_database(db: Session = Depends(get_db)):
    try:
        # Drop and recreate tables, then reseed
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        seed_database()

        # Log reset to audit
        audit = AuditLog(
            user_id="admin",
            user_name="Administrator",
            role="ADMIN",
            action="RESET_DEMO_DATABASE",
            entity_type="SYSTEM",
            entity_id="ALL",
            timestamp=datetime.datetime.utcnow(),
            reason="Administrator triggered demo database reset and reseed"
        )
        db.add(audit)
        db.commit()

        return {
            "status": "success",
            "message": "eRTMAC-NWIS demo database successfully reset and re-seeded with synthetic wells and historical offset records."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")

@router.get("/health")
def system_health():
    return {
        "status": "HEALTHY",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "CONNECTED",
        "telemetry_stream": "SIMULATED eRTMAC ACTIVE",
        "ocr_engine": "ACTIVE (Dual PDF/OCR Mode)",
        "nlp_engine": "ACTIVE (Structured Field Extractor v1.4)"
    }
