from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.entities import Well
from app.schemas.schemas import LookaheadHazardSummary
from app.services.lookahead_engine import evaluate_lookahead_hazards
from app.services.hazard_predictor import predict_drilling_hazards
from app.services.telemetry_simulator import simulator

router = APIRouter(prefix="/hazards", tags=["Hazard Intelligence & Lookahead"])

@router.get("/lookahead", response_model=LookaheadHazardSummary)
def get_lookahead_evaluation(
    well_id: int = Query(1, description="Active well ID"),
    lookahead_m: float = Query(50.0, description="Lookahead distance in meters"),
    db: Session = Depends(get_db)
):
    active_well = db.query(Well).filter(Well.well_id == well_id).first()
    if not active_well:
        active_well = db.query(Well).first()
    
    sim_state = simulator.get_state(well_id)
    current_md = sim_state.get("current_md", active_well.current_bit_depth_md)
    
    offset_wells = db.query(Well).filter(Well.well_id != active_well.well_id).all()
    
    active_point = simulator.generate_telemetry_point(active_well.well_id)
    
    summary = evaluate_lookahead_hazards(
        active_well=active_well,
        offset_wells=offset_wells,
        current_md=current_md,
        lookahead_meters=lookahead_m,
        active_telemetry=active_point
    )
    return summary

@router.get("/predictions/{well_id}")
def get_hazard_predictions(
    well_id: int,
    lookahead_m: float = Query(50.0),
    db: Session = Depends(get_db)
):
    active_well = db.query(Well).filter(Well.well_id == well_id).first()
    if not active_well:
        active_well = db.query(Well).first()
        
    sim_state = simulator.get_state(well_id)
    current_md = sim_state.get("current_md", active_well.current_bit_depth_md)
    offset_wells = db.query(Well).filter(Well.well_id != active_well.well_id).all()
    active_point = simulator.generate_telemetry_point(active_well.well_id)
    
    lookahead_summary = evaluate_lookahead_hazards(
        active_well=active_well,
        offset_wells=offset_wells,
        current_md=current_md,
        lookahead_meters=lookahead_m,
        active_telemetry=active_point
    )
    
    predictions = predict_drilling_hazards(
        lookahead_summary=lookahead_summary,
        active_well_name=active_well.well_name,
        telemetry_state=sim_state
    )
    
    return {
        "well_id": active_well.well_id,
        "well_name": active_well.well_name,
        "current_depth_md": current_md,
        "lookahead_window_m": lookahead_m,
        "overall_risk_score": lookahead_summary["overall_risk_score"],
        "overall_risk_category": lookahead_summary["overall_risk_category"],
        "why_risk_increased": lookahead_summary["why_risk_increased"],
        "predictions": predictions
    }
