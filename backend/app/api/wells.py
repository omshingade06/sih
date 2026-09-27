from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import Well
from app.schemas.schemas import WellSummarySchema, WellDetailSchema, OffsetWellSimilarity, SimilarityWeights
from app.services.similarity_engine import calculate_offset_similarity

router = APIRouter(prefix="/wells", tags=["Wells"])

@router.get("", response_model=List[WellSummarySchema])
def list_wells(
    field: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Well)
    if field:
        query = query.filter(Well.field_name.ilike(f"%{field}%"))
    if status:
        query = query.filter(Well.status == status.upper())
    
    wells = query.all()
    results = []
    for w in wells:
        inc_count = len(w.incidents)
        npt_sum = sum([inc.NPT_hours for inc in w.incidents])
        w_dict = {
            "well_id": w.well_id,
            "UWI": w.UWI,
            "well_name": w.well_name,
            "field_name": w.field_name,
            "basin": w.basin,
            "operator": w.operator,
            "latitude": w.latitude,
            "longitude": w.longitude,
            "total_depth_md": w.total_depth_md,
            "total_depth_tvd": w.total_depth_tvd,
            "KB_elevation": w.KB_elevation,
            "spud_date": w.spud_date,
            "rig_id": w.rig_id,
            "status": w.status,
            "well_type": w.well_type,
            "trajectory_type": w.trajectory_type,
            "mud_system": w.mud_system,
            "current_bit_depth_md": w.current_bit_depth_md,
            "current_bit_depth_tvd": w.current_bit_depth_tvd,
            "incident_count": inc_count,
            "total_npt_hours": round(npt_sum, 1)
        }
        results.append(w_dict)
    return results

@router.get("/{well_id}", response_model=WellDetailSchema)
def get_well(well_id: int, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
    
    # Enrich incidents with well_name and formation_name
    incidents_enriched = []
    for inc in well.incidents:
        inc_dict = {
            "incident_id": inc.incident_id,
            "well_id": inc.well_id,
            "well_name": well.well_name,
            "formation_id": inc.formation_id,
            "formation_name": inc.formation.name if inc.formation else "Unknown",
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
        }
        incidents_enriched.append(inc_dict)

    # Formation intervals
    intervals_enriched = []
    for iv in well.formation_intervals:
        intervals_enriched.append({
            "id": iv.id,
            "formation_id": iv.formation_id,
            "formation_name": iv.formation.name if iv.formation else "Unknown",
            "lithology": iv.formation.lithology if iv.formation else "Unknown",
            "top_md": iv.top_md,
            "base_md": iv.base_md,
            "top_tvd": iv.top_tvd,
            "base_tvd": iv.base_tvd,
            "top_tvdss": iv.top_tvdss,
            "base_tvdss": iv.base_tvdss
        })

    return {
        "well_id": well.well_id,
        "UWI": well.UWI,
        "well_name": well.well_name,
        "field_name": well.field_name,
        "basin": well.basin,
        "operator": well.operator,
        "latitude": well.latitude,
        "longitude": well.longitude,
        "total_depth_md": well.total_depth_md,
        "total_depth_tvd": well.total_depth_tvd,
        "KB_elevation": well.KB_elevation,
        "spud_date": well.spud_date,
        "rig_id": well.rig_id,
        "status": well.status,
        "well_type": well.well_type,
        "trajectory_type": well.trajectory_type,
        "mud_system": well.mud_system,
        "current_bit_depth_md": well.current_bit_depth_md,
        "current_bit_depth_tvd": well.current_bit_depth_tvd,
        "incident_count": len(well.incidents),
        "total_npt_hours": round(sum([i.NPT_hours for i in well.incidents]), 1),
        "boreholes": well.boreholes,
        "formation_intervals": intervals_enriched,
        "incidents": incidents_enriched,
        "casing_program": well.casing_program
    }

@router.get("/{well_id}/nearby", response_model=List[OffsetWellSimilarity])
def get_nearby_wells(
    well_id: int,
    radius_km: float = Query(25.0, description="Search radius in kilometers"),
    db: Session = Depends(get_db)
):
    active_well = db.query(Well).filter(Well.well_id == well_id).first()
    if not active_well:
        raise HTTPException(status_code=404, detail="Active well not found")
    
    all_wells = db.query(Well).filter(Well.well_id != well_id).all()
    results = []
    
    weights = {
        "spatial": 0.35,
        "trajectory": 0.20,
        "stratigraphic": 0.30,
        "architecture": 0.15,
        "max_radius_km": radius_km
    }

    for ow in all_wells:
        sim = calculate_offset_similarity(active_well, ow, weights)
        if sim["distance_meters"] <= radius_km * 1000:
            results.append(sim)

    # Sort descending by similarity score
    results.sort(key=lambda x: x["overall_similarity_score"], reverse=True)
    return results

@router.post("/{well_id}/similar", response_model=List[OffsetWellSimilarity])
def get_similar_wells_custom_weights(
    well_id: int,
    weights_req: SimilarityWeights,
    db: Session = Depends(get_db)
):
    active_well = db.query(Well).filter(Well.well_id == well_id).first()
    if not active_well:
        raise HTTPException(status_code=404, detail="Active well not found")
    
    all_wells = db.query(Well).filter(Well.well_id != well_id).all()
    results = []
    
    weights = {
        "spatial": weights_req.weight_spatial,
        "trajectory": weights_req.weight_trajectory,
        "stratigraphic": weights_req.weight_stratigraphic,
        "architecture": weights_req.weight_architecture,
        "max_radius_km": weights_req.max_radius_km
    }

    for ow in all_wells:
        sim = calculate_offset_similarity(active_well, ow, weights)
        if sim["distance_meters"] <= weights_req.max_radius_km * 1000:
            results.append(sim)

    results.sort(key=lambda x: x["overall_similarity_score"], reverse=True)
    return results
