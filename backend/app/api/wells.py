from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.core.database import get_db
from app.models.entities import (
    Well, Borehole, Formation, WellFormationInterval, DrillingIncident,
    Document, DocumentExtraction, VerificationRecord, AuditLog, DepthReading
)
from app.schemas.schemas import (
    WellSummarySchema, WellDetailSchema, WellCreateRequest, WellUpdateRequest,
    OffsetWellSimilarity, SimilarityWeights, ManualDepthInputRequest, DepthReadingSchema,
    GeologicalCalculationRequest, GeologicalCalculationResponse
)
from app.services.similarity_engine import calculate_offset_similarity
from app.services.stratigraphy import calculate_tvdss, calculate_eta_norm

router = APIRouter(prefix="/wells", tags=["Well Management & Offsets"])

@router.get("", response_model=List[WellSummarySchema])
def list_wells(
    field: Optional[str] = None,
    status: Optional[str] = None,
    well_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Well)
    if field:
        query = query.filter(Well.field_name.ilike(f"%{field}%"))
    if status:
        query = query.filter(Well.status == status.upper())
    if well_type:
        query = query.filter(Well.well_type == well_type.upper())
    if search:
        query = query.filter(
            (Well.well_name.ilike(f"%{search}%")) |
            (Well.UWI.ilike(f"%{search}%")) |
            (Well.field_name.ilike(f"%{search}%"))
        )
    
    wells = query.order_by(Well.well_id.asc()).all()
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

@router.post("", response_model=WellSummarySchema)
def create_well(req: WellCreateRequest, db: Session = Depends(get_db)):
    # Validate coordinate bounds (India latitude ~8-37, longitude ~68-98)
    if not (5.0 <= req.latitude <= 40.0 and 65.0 <= req.longitude <= 100.0):
        raise HTTPException(
            status_code=400,
            detail="Geographic coordinates are outside valid regional bounds for Indian oilfields."
        )
    
    existing = db.query(Well).filter(Well.UWI == req.UWI).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Well with UWI {req.UWI} already registered.")

    well = Well(
        UWI=req.UWI,
        well_name=req.well_name,
        field_name=req.field_name,
        basin=req.basin or "Upper Assam Basin",
        operator=req.operator or "Oil India Limited (OIL)",
        latitude=req.latitude,
        longitude=req.longitude,
        total_depth_md=req.total_depth_md,
        total_depth_tvd=req.total_depth_tvd,
        KB_elevation=req.KB_elevation or 112.5,
        spud_date=req.spud_date or "2026-01-10",
        rig_id=req.rig_id or "OIL-RIG-14",
        status=req.status or "ACTIVE",
        well_type=req.well_type or "DEVELOPMENT",
        trajectory_type=req.trajectory_type or "DIRECTIONAL",
        mud_system=req.mud_system or "WBM Potassium Chloride Polymer",
        current_bit_depth_md=req.current_bit_depth_md or 0.0,
        current_bit_depth_tvd=req.current_bit_depth_tvd or 0.0
    )
    db.add(well)
    db.flush()

    # Log audit
    audit = AuditLog(
        user_id="admin",
        user_name="Administrator",
        role="ADMIN",
        action="CREATE_WELL",
        entity_type="WELL",
        entity_id=str(well.well_id),
        after_state={"UWI": well.UWI, "name": well.well_name, "field": well.field_name, "td_md": well.total_depth_md},
        reason=f"Created well record {well.well_name} ({well.UWI})"
    )
    db.add(audit)
    db.commit()
    db.refresh(well)

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
        "incident_count": 0,
        "total_npt_hours": 0.0
    }

@router.put("/{well_id}", response_model=WellSummarySchema)
def update_well(well_id: int, req: WellUpdateRequest, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
    
    before_state = {
        "well_name": well.well_name,
        "status": well.status,
        "current_bit_depth_md": well.current_bit_depth_md,
        "total_depth_md": well.total_depth_md
    }

    if req.well_name is not None:
        well.well_name = req.well_name
    if req.field_name is not None:
        well.field_name = req.field_name
    if req.basin is not None:
        well.basin = req.basin
    if req.operator is not None:
        well.operator = req.operator
    if req.latitude is not None:
        well.latitude = req.latitude
    if req.longitude is not None:
        well.longitude = req.longitude
    if req.total_depth_md is not None:
        well.total_depth_md = req.total_depth_md
    if req.total_depth_tvd is not None:
        well.total_depth_tvd = req.total_depth_tvd
    if req.KB_elevation is not None:
        well.KB_elevation = req.KB_elevation
    if req.status is not None:
        well.status = req.status.upper()
    if req.well_type is not None:
        well.well_type = req.well_type.upper()
    if req.trajectory_type is not None:
        well.trajectory_type = req.trajectory_type.upper()
    if req.mud_system is not None:
        well.mud_system = req.mud_system
    if req.current_bit_depth_md is not None:
        well.current_bit_depth_md = req.current_bit_depth_md
    if req.current_bit_depth_tvd is not None:
        well.current_bit_depth_tvd = req.current_bit_depth_tvd

    audit = AuditLog(
        user_id="engineer",
        user_name="Drilling Engineer",
        role="DRILLING_ENGINEER",
        action="UPDATE_WELL",
        entity_type="WELL",
        entity_id=str(well.well_id),
        before_state=before_state,
        after_state={"well_name": well.well_name, "status": well.status, "current_md": well.current_bit_depth_md},
        reason=f"Updated parameters for well {well.well_name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(well)

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
        "total_npt_hours": round(sum([inc.NPT_hours for inc in well.incidents]), 1)
    }

@router.delete("/{well_id}")
def delete_well(well_id: int, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
    
    well_name = well.well_name
    db.delete(well)

    audit = AuditLog(
        user_id="admin",
        user_name="Administrator",
        role="ADMIN",
        action="DELETE_WELL",
        entity_type="WELL",
        entity_id=str(well_id),
        reason=f"Deactivated/Deleted well {well_name}"
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "message": f"Well {well_name} deleted successfully"}

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
            "verification_status": inc.verification_status,
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
            "base_tvdss": iv.base_tvdss,
            "verification_status": iv.verification_status,
            "source_document": iv.source_document
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

@router.post("/{well_id}/manual-depth", response_model=DepthReadingSchema)
def enter_manual_bit_depth(
    well_id: int,
    req: ManualDepthInputRequest,
    db: Session = Depends(get_db)
):
    well = db.query(Well).filter(Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
    
    # Validate depth values
    if req.bit_depth < 0:
        raise HTTPException(status_code=400, detail="Bit depth cannot be negative.")
    if req.bit_depth > well.total_depth_md + 200.0:
        raise HTTPException(
            status_code=400,
            detail=f"Bit depth {req.bit_depth}m exceeds well planned total depth {well.total_depth_md}m by an unrealistic margin."
        )

    # Calculate TVD approximation based on trajectory ratio
    ratio = (well.total_depth_tvd / well.total_depth_md) if well.total_depth_md > 0 else 0.94
    calc_tvd = round(req.bit_depth * ratio, 1)

    old_md = well.current_bit_depth_md
    well.current_bit_depth_md = req.bit_depth
    well.current_bit_depth_tvd = calc_tvd

    # Record DepthReading record
    reading = DepthReading(
        well_id=well.well_id,
        bit_depth=req.bit_depth,
        depth_reference=req.depth_reference,
        depth_unit=req.depth_unit,
        source_type="MANUAL",
        recorded_by=req.recorded_by or "Drilling Engineer",
        recorded_at=datetime.datetime.utcnow(),
        note=req.note or f"Manual bit depth update from {old_md}m to {req.bit_depth}m MD"
    )
    db.add(reading)
    db.flush()

    # Log to audit trail
    audit = AuditLog(
        user_id="driller",
        user_name=req.recorded_by or "Drilling Engineer",
        role="DRILLING_ENGINEER",
        action="MANUAL_DEPTH_ENTRY",
        entity_type="DEPTH_READING",
        entity_id=str(reading.id),
        before_state={"bit_depth_md": old_md},
        after_state={"bit_depth_md": req.bit_depth, "depth_ref": req.depth_reference},
        reason=f"Updated current bit depth on {well.well_name} to {req.bit_depth}m MD"
    )
    db.add(audit)
    db.commit()
    db.refresh(reading)

    return reading

@router.get("/{well_id}/depth-readings", response_model=List[DepthReadingSchema])
def get_depth_readings(well_id: int, db: Session = Depends(get_db)):
    return db.query(DepthReading).filter(DepthReading.well_id == well_id).order_by(DepthReading.recorded_at.desc()).limit(50).all()

@router.post("/calculate-geology", response_model=GeologicalCalculationResponse)
def calculate_geological_parameters(req: GeologicalCalculationRequest):
    """
    Deterministic geological formula calculation:
    TVDSS = TVD - KB_elevation
    eta_norm = (TVDSS - TVDSS_top) / (TVDSS_base - TVDSS_top)
    """
    tvdss = calculate_tvdss(req.tvd, req.kb_elevation)
    
    if req.base_tvdss <= req.top_tvdss:
        return {
            "tvd": req.tvd,
            "kb_elevation": req.kb_elevation,
            "tvdss": round(tvdss, 1),
            "eta_norm": 0.0,
            "is_valid": False,
            "status_message": "Invalid stratigraphic interval: Base TVDSS must be strictly greater than Top TVDSS."
        }
    
    eta = calculate_eta_norm(tvdss, req.top_tvdss, req.base_tvdss)
    is_in_formation = 0.0 <= eta <= 1.0
    status = "Within Formation Interval" if is_in_formation else ("Above Formation Top" if eta < 0 else "Below Formation Base")

    return {
        "tvd": req.tvd,
        "kb_elevation": req.kb_elevation,
        "tvdss": round(tvdss, 1),
        "eta_norm": eta,
        "is_valid": True,
        "status_message": status
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
