from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import Document, DocumentExtraction, Well
from app.schemas.schemas import (
    DocumentSchema,
    DocumentExtractionSchema,
    ExtractionCorrectionRequest,
    ManualReportCreateRequest
)
from app.services.document_engine import parse_and_extract_document

router = APIRouter(prefix="/documents", tags=["Document Intelligence"])

@router.get("", response_model=List[DocumentSchema])
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.upload_timestamp.desc()).all()
    results = []
    for d in docs:
        results.append({
            "id": d.id,
            "well_id": d.well_id,
            "well_name": d.well.well_name if d.well else "Generic Offset",
            "filename": d.filename,
            "doc_type": d.doc_type,
            "file_size_bytes": d.file_size_bytes,
            "upload_timestamp": d.upload_timestamp,
            "status": d.status,
            "page_count": d.page_count,
            "summary": d.summary,
            "extraction_confidence": d.extraction_confidence,
            "extractions": d.extractions
        })
    return results

@router.post("/upload", response_model=DocumentSchema)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("WCR"),
    well_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    # Parse and extract
    extraction_res = parse_and_extract_document(
        filename=file.filename,
        doc_type=doc_type
    )

    doc = Document(
        well_id=well_id,
        filename=file.filename,
        doc_type=doc_type,
        file_size_bytes=1024000,
        status="PROCESSED",
        page_count=extraction_res["page_count"],
        summary=extraction_res["summary"],
        extraction_confidence=extraction_res["extraction_confidence"]
    )
    db.add(doc)
    db.flush()

    for ext in extraction_res["extractions"]:
        d_ext = DocumentExtraction(
            document_id=doc.id,
            entity_type=ext["entity_type"],
            entity_key=ext["entity_key"],
            entity_value=ext["entity_value"],
            confidence=ext["confidence"],
            page_number=ext["page_number"],
            source_snippet=ext["source_snippet"],
            is_verified=False
        )
        db.add(d_ext)

    db.commit()
    db.refresh(doc)
    
    return {
        "id": doc.id,
        "well_id": doc.well_id,
        "well_name": doc.well.well_name if doc.well else "Uploaded Well",
        "filename": doc.filename,
        "doc_type": doc.doc_type,
        "file_size_bytes": doc.file_size_bytes,
        "upload_timestamp": doc.upload_timestamp,
        "status": doc.status,
        "page_count": doc.page_count,
        "summary": doc.summary,
        "extraction_confidence": doc.extraction_confidence,
        "extractions": doc.extractions
    }

@router.post("/extractions/correct")
def correct_extraction(
    req: ExtractionCorrectionRequest,
    db: Session = Depends(get_db)
):
    ext = db.query(DocumentExtraction).filter(DocumentExtraction.id == req.extraction_id).first()
    if not ext:
        raise HTTPException(status_code=404, detail="Extraction record not found")

    ext.entity_value = req.entity_value
    ext.is_verified = req.is_verified
    ext.verified_by = req.verified_by
    db.commit()
    return {"status": "success", "extraction_id": ext.id, "verified": ext.is_verified}

@router.post("/manual", response_model=DocumentSchema)
def create_manual_report(
    req: ManualReportCreateRequest,
    db: Session = Depends(get_db)
):
    well = db.query(Well).filter(Well.well_id == req.well_id).first() if req.well_id else None
    w_name = well.well_name if well else "OIL Offset Well"
    
    # 1. Create Document
    doc_summary = req.summary or (
        f"{req.doc_type} report for {w_name}. {req.hazard_type} encountered at {req.depth_start}m MD "
        f"in {req.formation_name} ({req.npt_hours}h NPT). Remediation: {req.mitigation_strategy}."
    )
    
    doc = Document(
        well_id=req.well_id,
        filename=req.filename if req.filename.endswith(('.pdf', '.txt', '.doc')) else f"{req.filename}.pdf",
        doc_type=req.doc_type,
        file_size_bytes=2450000,
        status="PROCESSED",
        page_count=req.page_count or 6,
        summary=doc_summary,
        extraction_confidence=0.97
    )
    db.add(doc)
    db.flush()

    # 2. Add extractions
    extractions_data = [
        ("WELL_INFO", "Well Identifier", w_name, 0.99, 1, f"Report for well {w_name}"),
        ("FORMATION_TOP", f"{req.formation_name} Interval", f"{req.depth_start}m MD", 0.96, 2, f"Encountered {req.formation_name}"),
        ("HAZARD_EVENT", req.hazard_type, f"Occurred at {req.depth_start}m - {req.depth_end}m MD ({req.npt_hours}h NPT)", 0.98, 3, req.operational_remarks or f"Encountered {req.hazard_type}"),
        ("MITIGATION", "Applied Strategy", req.mitigation_strategy, 0.95, 4, f"Mitigated via {req.mitigation_strategy} ({req.sop_reference})")
    ]
    
    for e_type, e_key, e_val, e_conf, e_pg, e_snip in extractions_data:
        d_ext = DocumentExtraction(
            document_id=doc.id,
            entity_type=e_type,
            entity_key=e_key,
            entity_value=e_val,
            confidence=e_conf,
            page_number=e_pg,
            source_snippet=e_snip,
            is_verified=True,
            verified_by="Manual Engineer Submission"
        )
        db.add(d_ext)

    # 3. If hazard is provided, link to DrillingIncident & Mitigation in Knowledge Graph
    from app.models.entities import Formation, DrillingIncident, Mitigation
    from app.services.stratigraphy import calculate_tvdss, calculate_eta_norm

    form_obj = db.query(Formation).filter(Formation.name.ilike(f"%{req.formation_name}%")).first()
    if not form_obj:
        form_obj = db.query(Formation).first()

    if well and form_obj:
        tvd = (req.depth_start or 2862.0) * 0.94
        tvdss = calculate_tvdss(tvd, well.KB_elevation)
        eta = calculate_eta_norm(tvdss, form_obj.top_tvdss, form_obj.base_tvdss)

        inc = DrillingIncident(
            well_id=well.well_id,
            formation_id=form_obj.formation_id,
            hazard_type=req.hazard_type or "Lost Circulation",
            depth_start=req.depth_start or 2862.0,
            depth_end=req.depth_end or 2874.0,
            depth_tvd=round(tvd, 1),
            depth_tvdss=round(tvdss, 1),
            eta_norm=eta,
            severity=req.severity or "HIGH",
            NPT_hours=req.npt_hours or 12.0,
            volume_loss_m3=req.volume_loss_m3 or 30.0,
            description=req.operational_remarks or f"Manual report incident: {req.hazard_type} in {req.formation_name}.",
            source_document=doc.filename,
            page_number=3,
            timestamp="2026-09-26"
        )
        db.add(inc)
        db.flush()

        mit = Mitigation(
            incident_id=inc.incident_id,
            strategy=req.mitigation_strategy or "Standard SOP Remediation Pill",
            material=req.mitigation_material or "LCM / Lubricant blend",
            volume="25 m³",
            soaking_time="4.0 hours",
            success=True,
            SOP_reference=req.sop_reference or "OIL-SOP-DRL-042 Rev.3",
            operational_remarks=req.operational_remarks or "Incident resolved successfully."
        )
        db.add(mit)

    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "well_id": doc.well_id,
        "well_name": w_name,
        "filename": doc.filename,
        "doc_type": doc.doc_type,
        "file_size_bytes": doc.file_size_bytes,
        "upload_timestamp": doc.upload_timestamp,
        "status": doc.status,
        "page_count": doc.page_count,
        "summary": doc.summary,
        "extraction_confidence": doc.extraction_confidence,
        "extractions": doc.extractions
    }
