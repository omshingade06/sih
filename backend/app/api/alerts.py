from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import Alert, Well
from app.schemas.schemas import AlertSchema, AlertAcknowledgeRequest

router = APIRouter(prefix="/alerts", tags=["Proactive Hazard Alerts"])

@router.get("", response_model=List[AlertSchema])
def list_alerts(
    well_id: Optional[int] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if well_id:
        query = query.filter(Alert.well_id == well_id)
    if status:
        query = query.filter(Alert.status == status.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
        
    alerts = query.order_by(Alert.created_at.desc()).all()
    results = []
    for a in alerts:
        results.append({
            "alert_id": a.alert_id,
            "well_id": a.well_id,
            "well_name": a.well.well_name if a.well else "OIL-DEMO-001",
            "hazard_type": a.hazard_type,
            "severity": a.severity,
            "current_depth": a.current_depth,
            "predicted_depth_start": a.predicted_depth_start,
            "predicted_depth_end": a.predicted_depth_end,
            "formation": a.formation,
            "eta_norm_predicted": a.eta_norm_predicted,
            "risk_score": a.risk_score,
            "confidence": a.confidence,
            "evidence": a.evidence or [],
            "recommended_action": a.recommended_action,
            "mitigation_options": a.mitigation_options or [],
            "status": a.status,
            "created_at": a.created_at,
            "acknowledged_by": a.acknowledged_by
        })
    return results

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    req: AlertAcknowledgeRequest,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = req.status
    alert.acknowledged_by = req.acknowledged_by
    if req.notes:
        alert.notes = req.notes
        
    db.commit()
    db.refresh(alert)
    return {"status": "success", "alert_id": alert.alert_id, "alert_status": alert.status}
