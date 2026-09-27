from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import DrillingIncident
from app.schemas.schemas import IncidentSchema

router = APIRouter(prefix="/incidents", tags=["Drilling Incidents"])

@router.get("", response_model=List[IncidentSchema])
def list_incidents(
    hazard_type: Optional[str] = None,
    formation_id: Optional[int] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DrillingIncident)
    if hazard_type:
        query = query.filter(DrillingIncident.hazard_type.ilike(f"%{hazard_type}%"))
    if formation_id:
        query = query.filter(DrillingIncident.formation_id == formation_id)
    if severity:
        query = query.filter(DrillingIncident.severity == severity.upper())

    incidents = query.all()
    results = []
    for inc in incidents:
        results.append({
            "incident_id": inc.incident_id,
            "well_id": inc.well_id,
            "well_name": inc.well.well_name if inc.well else None,
            "formation_id": inc.formation_id,
            "formation_name": inc.formation.name if inc.formation else None,
            "hazard_type": inc.hazard_type,
            "depth_start": inc.depth_start,
            "depth_end": inc.depth_end,
            "depth_tvd": inc.depth_tvd,
            "depth_tvdss": inc.depth_tvdss,
            "eta_norm": inc.eta_norm,
            "severity": inc.severity,
            "NPT_hours": inc.NPT_hours,
            "volume_loss_m3": inc.volume_loss_m3,
            "influx_volume_bbl": inc.influx_volume_bbl,
            "overpull_klbs": inc.overpull_klbs,
            "description": inc.description,
            "source_document": inc.source_document,
            "page_number": inc.page_number,
            "timestamp": inc.timestamp,
            "mitigations": [
                {
                    "mitigation_id": m.mitigation_id,
                    "incident_id": m.incident_id,
                    "strategy": m.strategy,
                    "material": m.material,
                    "volume": m.volume,
                    "soaking_time": m.soaking_time,
                    "success": m.success,
                    "SOP_reference": m.SOP_reference,
                    "operational_remarks": m.operational_remarks,
                    "post_mitigation_npt_saved": m.post_mitigation_npt_saved
                } for m in inc.mitigations
            ]
        })
    return results
