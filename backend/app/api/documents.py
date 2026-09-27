from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.core.database import get_db
from app.models.entities import Document, DocumentExtraction, Well, VerificationRecord, AuditLog
from app.schemas.schemas import (
    DocumentSchema,
    DocumentExtractionSchema,
    ExtractionCorrectionRequest,
    DocumentVerificationDecisionRequest,
    ManualReportCreateRequest,
    VerificationRecordSchema
)
from app.services.document_engine import parse_and_extract_document

router = APIRouter(prefix="/documents", tags=["Document Intelligence & Verification"])

@router.get("", response_model=List[DocumentSchema])
def list_documents(
    well_id: Optional[int] = None,
    doc_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if well_id:
        query = query.filter(Document.well_id == well_id)
    if doc_type:
        query = query.filter(Document.doc_type == doc_type.upper())
    if status:
        query = query.filter(Document.status == status.upper())
    if search:
        query = query.filter(
            (Document.filename.ilike(f"%{search}%")) |
            (Document.document_title.ilike(f"%{search}%")) |
            (Document.summary.ilike(f"%{search}%"))
        )
    
    docs = query.order_by(Document.upload_timestamp.desc()).all()
    results = []
    for d in docs:
        results.append({
            "id": d.id,
            "well_id": d.well_id,
            "well_name": d.well.well_name if d.well else "OIL Archive Well",
            "document_title": d.document_title or d.filename,
            "filename": d.filename,
            "doc_type": d.doc_type,
            "file_size_bytes": d.file_size_bytes,
            "upload_timestamp": d.upload_timestamp,
            "status": d.status,
            "page_count": d.page_count,
            "summary": d.summary,
            "extraction_confidence": d.extraction_confidence,
            "uploaded_by": d.uploaded_by or "Data Ingestion Pipeline",
            "document_version": d.document_version or "1.0",
            "document_source": d.document_source or "Oil India Limited (OIL) Archive",
            "rejection_reason": d.rejection_reason,
            "verified_by": d.verified_by,
            "verified_at": d.verified_at,
            "extractions": d.extractions,
            "verification_records": d.verification_records
        })
    return results

@router.get("/{doc_id}", response_model=DocumentSchema)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    d = db.query(Document).filter(Document.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": d.id,
        "well_id": d.well_id,
        "well_name": d.well.well_name if d.well else "OIL Archive Well",
        "document_title": d.document_title or d.filename,
        "filename": d.filename,
        "doc_type": d.doc_type,
        "file_size_bytes": d.file_size_bytes,
        "upload_timestamp": d.upload_timestamp,
        "status": d.status,
        "page_count": d.page_count,
        "summary": d.summary,
        "extraction_confidence": d.extraction_confidence,
        "uploaded_by": d.uploaded_by or "Data Ingestion Pipeline",
        "document_version": d.document_version or "1.0",
        "document_source": d.document_source or "Oil India Limited (OIL) Archive",
        "rejection_reason": d.rejection_reason,
        "verified_by": d.verified_by,
        "verified_at": d.verified_at,
        "extractions": d.extractions,
        "verification_records": d.verification_records
    }

@router.post("/upload", response_model=DocumentSchema)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("WCR"),
    well_id: Optional[int] = Form(None),
    document_title: Optional[str] = Form(None),
    uploaded_by: Optional[str] = Form("Data Reviewer"),
    db: Session = Depends(get_db)
):
    # Parse and extract
    extraction_res = parse_and_extract_document(
        filename=file.filename,
        doc_type=doc_type
    )

    doc = Document(
        well_id=well_id,
        document_title=document_title or file.filename.replace(".pdf", "").replace("_", " "),
        filename=file.filename,
        doc_type=doc_type.upper(),
        file_size_bytes=1024000,
        status="NEEDS_REVIEW",
        page_count=extraction_res["page_count"],
        summary=extraction_res["summary"],
        extraction_confidence=extraction_res["extraction_confidence"],
        uploaded_by=uploaded_by,
        document_version="1.0",
        document_source="Oil India Limited (OIL) Digital Archive"
    )
    db.add(doc)
    db.flush()

    for ext in extraction_res["extractions"]:
        # Assign field_group based on entity_type
        f_group = "WELL_METADATA"
        if ext["entity_type"] in ["DRILLING_PARAM", "CASING"]:
            f_group = "DRILLING_PARAMETERS"
        elif ext["entity_type"] in ["FORMATION_TOP"]:
            f_group = "GEOLOGICAL_INFO"
        elif ext["entity_type"] in ["HAZARD_EVENT"]:
            f_group = "DRILLING_EVENTS"
        elif ext["entity_type"] in ["MITIGATION"]:
            f_group = "MITIGATION"

        d_ext = DocumentExtraction(
            document_id=doc.id,
            field_group=f_group,
            entity_type=ext["entity_type"],
            entity_key=ext["entity_key"],
            entity_value=ext["entity_value"],
            confidence=ext["confidence"],
            page_number=ext["page_number"],
            source_snippet=ext["source_snippet"],
            is_verified=False,
            verification_status="NOT_REVIEWED"
        )
        db.add(d_ext)

    # Log audit trail
    audit = AuditLog(
        user_id="reviewer",
        user_name=uploaded_by or "Data Reviewer",
        role="GEOLOGIST",
        action="UPLOAD_DOCUMENT",
        entity_type="DOCUMENT",
        entity_id=str(doc.id),
        after_state={"filename": doc.filename, "doc_type": doc.doc_type, "extractions_count": len(extraction_res["extractions"])},
        reason=f"Uploaded and parsed {doc.filename} ({len(extraction_res['extractions'])} structured fields extracted)"
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)
    
    return {
        "id": doc.id,
        "well_id": doc.well_id,
        "well_name": doc.well.well_name if doc.well else "Uploaded Well",
        "document_title": doc.document_title,
        "filename": doc.filename,
        "doc_type": doc.doc_type,
        "file_size_bytes": doc.file_size_bytes,
        "upload_timestamp": doc.upload_timestamp,
        "status": doc.status,
        "page_count": doc.page_count,
        "summary": doc.summary,
        "extraction_confidence": doc.extraction_confidence,
        "uploaded_by": doc.uploaded_by,
        "document_version": doc.document_version,
        "document_source": doc.document_source,
        "rejection_reason": doc.rejection_reason,
        "verified_by": doc.verified_by,
        "verified_at": doc.verified_at,
        "extractions": doc.extractions,
        "verification_records": doc.verification_records
    }

@router.post("/extractions/correct")
def correct_extraction(
    req: ExtractionCorrectionRequest,
    db: Session = Depends(get_db)
):
    ext = db.query(DocumentExtraction).filter(DocumentExtraction.id == req.extraction_id).first()
    if not ext:
        raise HTTPException(status_code=404, detail="Extraction record not found")

    old_val = ext.entity_value
    ext.entity_value = req.entity_value
    if req.normalized_value:
        ext.normalized_value = req.normalized_value
    if req.unit:
        ext.unit = req.unit
    ext.is_verified = req.is_verified
    ext.verification_status = req.verification_status
    ext.verified_by = req.verified_by
    if req.notes:
        ext.notes = req.notes

    # Create VerificationRecord
    v_rec = VerificationRecord(
        document_id=ext.document_id,
        extracted_field_id=ext.id,
        reviewer_id="reviewer",
        reviewer_name=req.verified_by,
        original_value=old_val,
        corrected_value=req.entity_value,
        review_status=req.verification_status,
        review_note=req.notes or f"Field {ext.entity_key} corrected from '{old_val}' to '{req.entity_value}'",
        source_page=ext.page_number,
        reviewed_at=datetime.datetime.utcnow()
    )
    db.add(v_rec)

    # Log to Audit
    audit = AuditLog(
        user_id="reviewer",
        user_name=req.verified_by,
        role="GEOLOGIST",
        action="VERIFY_FIELD",
        entity_type="EXTRACTION",
        entity_id=str(ext.id),
        before_state={"value": old_val},
        after_state={"value": req.entity_value, "status": req.verification_status},
        reason=f"Corrected extracted value for {ext.entity_key}"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "extraction_id": ext.id,
        "verified": ext.is_verified,
        "verification_status": ext.verification_status,
        "entity_value": ext.entity_value
    }

@router.post("/{doc_id}/decision")
def document_verification_decision(
    doc_id: int,
    req: DocumentVerificationDecisionRequest,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if req.decision.upper() == "APPROVE":
        doc.status = "VERIFIED"
        doc.verified_by = req.reviewer_name
        doc.verified_at = datetime.datetime.utcnow()
        doc.rejection_reason = None
        # Mark all extractions as verified
        for ext in doc.extractions:
            ext.is_verified = True
            ext.verification_status = "VERIFIED"
            ext.verified_by = req.reviewer_name
    elif req.decision.upper() == "REJECT":
        if not req.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is mandatory when rejecting a document.")
        doc.status = "REJECTED"
        doc.rejection_reason = req.rejection_reason
        doc.verified_by = req.reviewer_name
        doc.verified_at = datetime.datetime.utcnow()
    elif req.decision.upper() == "REQUEST_CORRECTION":
        doc.status = "NEEDS_REVIEW"
        doc.rejection_reason = req.notes or "Corrections requested by reviewer"

    # Create document-level verification record
    v_rec = VerificationRecord(
        document_id=doc.id,
        extracted_field_id=None,
        reviewer_id="reviewer",
        reviewer_name=req.reviewer_name,
        original_value=None,
        corrected_value=None,
        review_status=f"DOCUMENT_{req.decision.upper()}",
        review_note=req.notes or req.rejection_reason or f"Document {req.decision.lower()}ed by reviewer",
        source_page=1,
        reviewed_at=datetime.datetime.utcnow()
    )
    db.add(v_rec)

    # Log to Audit
    audit = AuditLog(
        user_id="reviewer",
        user_name=req.reviewer_name,
        role="GEOLOGIST",
        action=f"{req.decision.upper()}_DOCUMENT",
        entity_type="DOCUMENT",
        entity_id=str(doc.id),
        after_state={"status": doc.status, "reviewer": req.reviewer_name},
        reason=req.notes or req.rejection_reason or f"Reviewer {req.decision.lower()}ed document {doc.filename}"
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)

    return {
        "status": "success",
        "doc_id": doc.id,
        "document_status": doc.status,
        "verified_by": doc.verified_by,
        "verified_at": doc.verified_at
    }

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
        document_title=req.document_title or f"{req.doc_type} - {w_name}",
        filename=req.filename if req.filename.endswith(('.pdf', '.txt', '.doc')) else f"{req.filename}.pdf",
        doc_type=req.doc_type,
        file_size_bytes=2450000,
        status="VERIFIED",
        page_count=req.page_count or 6,
        summary=doc_summary,
        extraction_confidence=0.98,
        uploaded_by=req.uploaded_by or "Drilling Engineer",
        document_version="1.0",
        document_source="Manual Engineer Submission",
        verified_by=req.uploaded_by or "Drilling Engineer",
        verified_at=datetime.datetime.utcnow()
    )
    db.add(doc)
    db.flush()

    # 2. Add extractions
    extractions_data = [
        ("WELL_METADATA", "WELL_INFO", "Well Identifier", w_name, 0.99, 1, f"Report for well {w_name}"),
        ("GEOLOGICAL_INFO", "FORMATION_TOP", f"{req.formation_name} Interval", f"{req.depth_start}m MD", 0.96, 2, f"Encountered {req.formation_name}"),
        ("DRILLING_EVENTS", "HAZARD_EVENT", req.hazard_type or "Lost Circulation", f"Occurred at {req.depth_start}m - {req.depth_end}m MD ({req.npt_hours}h NPT)", 0.98, 3, req.operational_remarks or f"Encountered {req.hazard_type}"),
        ("MITIGATION", "MITIGATION", "Applied Strategy", req.mitigation_strategy or "Standard SOP Pill", 0.95, 4, f"Mitigated via {req.mitigation_strategy} ({req.sop_reference})")
    ]
    
    for f_grp, e_type, e_key, e_val, e_conf, e_pg, e_snip in extractions_data:
        d_ext = DocumentExtraction(
            document_id=doc.id,
            field_group=f_grp,
            entity_type=e_type,
            entity_key=e_key,
            entity_value=e_val,
            confidence=e_conf,
            page_number=e_pg,
            source_snippet=e_snip,
            is_verified=True,
            verification_status="VERIFIED",
            verified_by=req.uploaded_by or "Manual Engineer Submission"
        )
        db.add(d_ext)

    # 3. If hazard is provided, link to DrillingIncident & Mitigation
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
            timestamp="2026-09-26",
            verification_status="VERIFIED"
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

    # Log to audit
    audit = AuditLog(
        user_id="engineer",
        user_name=req.uploaded_by or "Drilling Engineer",
        role="DRILLING_ENGINEER",
        action="MANUAL_REPORT_CREATE",
        entity_type="DOCUMENT",
        entity_id=str(doc.id),
        after_state={"filename": doc.filename, "hazard": req.hazard_type, "well": w_name},
        reason=f"Created manual report and linked incident to {w_name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "well_id": doc.well_id,
        "well_name": w_name,
        "document_title": doc.document_title,
        "filename": doc.filename,
        "doc_type": doc.doc_type,
        "file_size_bytes": doc.file_size_bytes,
        "upload_timestamp": doc.upload_timestamp,
        "status": doc.status,
        "page_count": doc.page_count,
        "summary": doc.summary,
        "extraction_confidence": doc.extraction_confidence,
        "uploaded_by": doc.uploaded_by,
        "document_version": doc.document_version,
        "document_source": doc.document_source,
        "rejection_reason": doc.rejection_reason,
        "verified_by": doc.verified_by,
        "verified_at": doc.verified_at,
        "extractions": doc.extractions,
        "verification_records": doc.verification_records
    }
