from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.entities import Formation
from app.schemas.schemas import FormationSchema

router = APIRouter(prefix="/formations", tags=["Formations"])

@router.get("", response_model=List[FormationSchema])
def list_formations(db: Session = Depends(get_db)):
    formations = db.query(Formation).all()
    results = []
    for f in formations:
        f_dict = {
            "formation_id": f.formation_id,
            "name": f.name,
            "basin": f.basin,
            "lithology": f.lithology,
            "top_tvdss": f.top_tvdss,
            "base_tvdss": f.base_tvdss,
            "pressure_baseline": f.pressure_baseline,
            "fracture_gradient": f.fracture_gradient,
            "description": f.description,
            "risk_level": f.risk_level,
            "incident_count": len(f.incidents)
        }
        results.append(f_dict)
    return results

@router.get("/{formation_id}", response_model=FormationSchema)
def get_formation(formation_id: int, db: Session = Depends(get_db)):
    f = db.query(Formation).filter(Formation.formation_id == formation_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Formation not found")
    return {
        "formation_id": f.formation_id,
        "name": f.name,
        "basin": f.basin,
        "lithology": f.lithology,
        "top_tvdss": f.top_tvdss,
        "base_tvdss": f.base_tvdss,
        "pressure_baseline": f.pressure_baseline,
        "fracture_gradient": f.fracture_gradient,
        "description": f.description,
        "risk_level": f.risk_level,
        "incident_count": len(f.incidents)
    }
