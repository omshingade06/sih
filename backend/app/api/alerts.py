from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.core.database import get_db
from app.models.entities import Alert, Well, AlertReview, AuditLog
from app.schemas.schemas import AlertSchema, AlertAcknowledgeRequest, AlertReviewCreateRequest, AlertReviewSchema

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
            "acknowledged_by": a.acknowledged_by,
            "notes": a.notes,
            "analysis_method": a.analysis_method,
            "analysis_version": a.analysis_version,
            "reviews": a.reviews
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
        
    # Log audit
    audit = AuditLog(
        user_id="driller",
        user_name=req.acknowledged_by,
        role="DRILLING_ENGINEER",
        action="ACKNOWLEDGE_ALERT",
        entity_type="ALERT",
        entity_id=str(alert.alert_id),
        after_state={"status": alert.status, "notes": req.notes},
        reason=f"Acknowledged look-ahead alert {alert.hazard_type} for well {alert.well.well_name if alert.well else alert.well_id}"
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return {"status": "success", "alert_id": alert.alert_id, "alert_status": alert.status}

@router.post("/{alert_id}/review", response_model=AlertReviewSchema)
def submit_alert_review(
    alert_id: int,
    req: AlertReviewCreateRequest,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    review = AlertReview(
        alert_id=alert.alert_id,
        reviewer_id="driller",
        reviewer_name=req.reviewer_name or "Er. Rajesh Sarmah (RTDC Lead)",
        review_decision=req.review_decision.upper(),
        comments=req.comments,
        reviewed_at=datetime.datetime.utcnow()
    )
    db.add(review)

    # Update alert status based on review decision
    if req.review_decision.upper() in ["CONFIRMED_RELEVANT", "REVIEWED"]:
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_by = req.reviewer_name
    elif req.review_decision.upper() in ["NOT_RELEVANT", "FLAGGED_INCORRECT"]:
        alert.status = "DISMISSED"

    # Log to audit
    audit = AuditLog(
        user_id="driller",
        user_name=req.reviewer_name or "Er. Rajesh Sarmah",
        role="DRILLING_ENGINEER",
        action="ALERT_REVIEW",
        entity_type="ALERT",
        entity_id=str(alert.alert_id),
        after_state={"decision": req.review_decision, "comments": req.comments},
        reason=f"Submitted review decision '{req.review_decision}' on alert {alert.hazard_type}"
    )
    db.add(audit)
    db.commit()
    db.refresh(review)

    return review
