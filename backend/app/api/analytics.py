from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Well, Formation, DrillingIncident, Mitigation

router = APIRouter(prefix="/analytics", tags=["Analytics & NPT Intelligence"])

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    total_wells = db.query(Well).count()
    total_incidents = db.query(DrillingIncident).count()
    incidents = db.query(DrillingIncident).all()
    
    total_npt_hours = sum([i.NPT_hours for i in incidents])
    total_losses_m3 = sum([i.volume_loss_m3 for i in incidents if i.volume_loss_m3])
    
    # NPT by hazard type
    hazard_npt = {}
    hazard_counts = {}
    for inc in incidents:
        ht = inc.hazard_type
        hazard_npt[ht] = hazard_npt.get(ht, 0.0) + inc.NPT_hours
        hazard_counts[ht] = hazard_counts.get(ht, 0) + 1
        
    npt_by_hazard_chart = [
        {"hazard_type": k, "npt_hours": round(v, 1), "incident_count": hazard_counts[k]}
        for k, v in sorted(hazard_npt.items(), key=lambda x: x[1], reverse=True)
    ]

    # Formation risk aggregation
    formations = db.query(Formation).all()
    formation_risk_chart = []
    for f in formations:
        f_incidents = db.query(DrillingIncident).filter(DrillingIncident.formation_id == f.formation_id).all()
        f_npt = sum([i.NPT_hours for i in f_incidents])
        formation_risk_chart.append({
            "formation_name": f.name,
            "incident_count": len(f_incidents),
            "npt_hours": round(f_npt, 1),
            "risk_level": f.risk_level,
            "lithology": f.lithology
        })

    # Field-wise distribution
    field_counts = {}
    wells = db.query(Well).all()
    for w in wells:
        field_counts[w.field_name] = field_counts.get(w.field_name, 0) + 1
    
    field_chart = [{"field": k, "wells_count": v} for k, v in field_counts.items()]

    # Mitigation stats
    mits = db.query(Mitigation).all()
    total_mits = len(mits)
    successful_mits = len([m for m in mits if m.success])
    npt_saved = sum([m.post_mitigation_npt_saved for m in mits if m.post_mitigation_npt_saved])

    return {
        "kpis": {
            "total_wells": total_wells,
            "total_incidents": total_incidents,
            "total_npt_hours": round(total_npt_hours, 1),
            "total_mud_lost_m3": round(total_losses_m3, 1),
            "mitigation_success_rate_pct": round((successful_mits / total_mits * 100) if total_mits else 100, 1),
            "total_npt_saved_hours": round(npt_saved, 1)
        },
        "npt_by_hazard": npt_by_hazard_chart,
        "formation_risk": formation_risk_chart,
        "field_distribution": field_chart
    }
