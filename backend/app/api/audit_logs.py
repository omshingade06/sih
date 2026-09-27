from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import AuditLog
from app.schemas.schemas import AuditLogSchema

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogSchema])
def list_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_name: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type.upper())
    if user_name:
        query = query.filter(AuditLog.user_name.ilike(f"%{user_name}%"))
        
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs
