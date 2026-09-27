from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
import csv
import io
import datetime
from app.core.database import get_db
from app.models.entities import Well, Document, DrillingIncident, AuditLog

router = APIRouter(prefix="/exports", tags=["Reports & Data Exports"])

@router.get("/verification-report/{doc_id}")
def export_verification_report(doc_id: int, format: str = Query("json", enum=["json", "csv"]), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    w_name = doc.well.well_name if doc.well else "Generic Offset"
    uwi = doc.well.UWI if doc.well else "N/A"

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Report Title", doc.document_title or doc.filename])
        writer.writerow(["Well Name", w_name])
        writer.writerow(["UWI", uwi])
        writer.writerow(["Doc Type", doc.doc_type])
        writer.writerow(["Verification Status", doc.status])
        writer.writerow(["Verified By", doc.verified_by or "N/A"])
        writer.writerow(["Verified At", str(doc.verified_at or "N/A")])
        writer.writerow([])
        writer.writerow(["Field Group", "Entity Type", "Key", "Extracted Value", "Confidence", "Page", "Status", "Verified By"])
        for ext in doc.extractions:
            writer.writerow([
                ext.field_group,
                ext.entity_type,
                ext.entity_key,
                ext.entity_value,
                ext.confidence,
                ext.page_number,
                ext.verification_status,
                ext.verified_by or "Pending"
            ])
        
        csv_data = output.getvalue()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=Verification_Report_{doc.filename}.csv"}
        )

    return {
        "report_title": doc.document_title or doc.filename,
        "well_name": w_name,
        "UWI": uwi,
        "doc_type": doc.doc_type,
        "status": doc.status,
        "page_count": doc.page_count,
        "summary": doc.summary,
        "extraction_confidence": doc.extraction_confidence,
        "uploaded_by": doc.uploaded_by,
        "verified_by": doc.verified_by,
        "verified_at": str(doc.verified_at),
        "extractions": [
            {
                "field_group": ext.field_group,
                "entity_type": ext.entity_type,
                "key": ext.entity_key,
                "value": ext.entity_value,
                "unit": ext.unit,
                "confidence": ext.confidence,
                "page": ext.page_number,
                "status": ext.verification_status,
                "snippet": ext.source_snippet
            } for ext in doc.extractions
        ],
        "audit_verification_records": [
            {
                "reviewer": vr.reviewer_name,
                "status": vr.review_status,
                "note": vr.review_note,
                "timestamp": str(vr.reviewed_at)
            } for vr in doc.verification_records
        ]
    }

@router.get("/hazards-csv")
def export_hazards_csv(db: Session = Depends(get_db)):
    incidents = db.query(DrillingIncident).order_by(DrillingIncident.incident_id.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Incident ID", "Well Name", "Formation", "Hazard Type", "Depth Start (MD)",
        "Depth End (MD)", "Depth (TVDSS)", "Normalized Eta", "Severity", "NPT Hours",
        "Loss Vol (m3)", "Overpull (klbs)", "Source Document", "Page Number"
    ])
    for inc in incidents:
        writer.writerow([
            inc.incident_id,
            inc.well.well_name if inc.well else "N/A",
            inc.formation.name if inc.formation else "N/A",
            inc.hazard_type,
            inc.depth_start,
            inc.depth_end,
            inc.depth_tvdss,
            inc.eta_norm,
            inc.severity,
            inc.NPT_hours,
            inc.volume_loss_m3,
            inc.overpull_klbs,
            inc.source_document,
            inc.page_number
        ])
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=OIL_Historical_Drilling_Hazards.csv"}
    )
