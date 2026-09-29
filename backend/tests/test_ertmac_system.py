import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.seed_data import seed_database
from app.models.entities import Well, Document, DrillingIncident, Alert, User, AuditLog

client = TestClient(app)

def setup_module(module):
    """Seed database before tests"""
    seed_database()

def test_login_flow():
    # 1. Drilling engineer login
    resp = client.post("/api/auth/login", json={"username": "driller", "password": "oil123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "DRILLING_ENGINEER"

    # 2. Administrator login
    resp_admin = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert resp_admin.status_code == 200
    assert resp_admin.json()["role"] == "ADMIN"

    # 3. Geologist login
    resp_geo = client.post("/api/auth/login", json={"username": "geologist", "password": "oil123"})
    assert resp_geo.status_code == 200
    assert resp_geo.json()["role"] == "GEOLOGIST"

    # 4. Invalid credentials
    resp_invalid = client.post("/api/auth/login", json={"username": "driller", "password": "wrongpassword"})
    assert resp_invalid.status_code == 401

def test_wells_management():
    # 1. List wells
    resp = client.get("/api/wells")
    assert resp.status_code == 200
    wells = resp.json()
    assert len(wells) >= 25

    # 2. Check synthetic benchmark wells
    syn_uwis = [w["UWI"] for w in wells]
    assert "IN-SYN-001-DIFF-STICK" in syn_uwis
    assert "IN-SYN-002-PART-LOSS" in syn_uwis
    assert "IN-SYN-003-KICK-INFLUX" in syn_uwis

    # 3. Get well details with all relationships
    well_1 = client.get("/api/wells/1").json()
    assert well_1["well_id"] == 1
    assert len(well_1["formation_intervals"]) > 0
    assert len(well_1["boreholes"]) > 0

    # 4. Create new well
    new_uwi = f"IN-TEST-WELL-{int(datetime.datetime.now(datetime.timezone.utc).timestamp())}"
    resp_create = client.post("/api/wells", json={
        "UWI": new_uwi,
        "well_name": "TEST-EXPLORATION-01",
        "field_name": "Nahorkatiya",
        "basin": "Upper Assam Basin",
        "operator": "Oil India Limited (OIL)",
        "latitude": 27.3100,
        "longitude": 95.3400,
        "total_depth_md": 3700.0,
        "total_depth_tvd": 3450.0,
        "KB_elevation": 112.5,
        "status": "DRILLING",
        "well_type": "EXPLORATION",
        "trajectory_type": "DIRECTIONAL",
        "mud_system": "WBM KCl Polymer"
    })
    assert resp_create.status_code == 200
    created = resp_create.json()
    assert created["UWI"] == new_uwi

def test_manual_bit_depth_and_geology():
    # 1. Enter manual bit depth
    resp = client.post("/api/wells/1/manual-depth", json={
        "bit_depth": 2860.0,
        "depth_reference": "MD",
        "depth_unit": "m",
        "note": "Manual bit depth updated after connection",
        "recorded_by": "Er. Rajesh Sarmah (RTDC Lead)"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["bit_depth"] == 2860.0
    assert data["source_type"] == "MANUAL"

    # 2. Check depth readings history
    hist = client.get("/api/wells/1/depth-readings").json()
    assert len(hist) > 0
    assert hist[0]["bit_depth"] == 2860.0

    # 3. Deterministic geological calculations: TVDSS = TVD - KB, eta_norm
    calc_resp = client.post("/api/wells/calculate-geology", json={
        "tvd": 2680.0,
        "kb_elevation": 112.5,
        "top_tvdss": 2480.0,
        "base_tvdss": 2920.0
    })
    assert calc_resp.status_code == 200
    calc_data = calc_resp.json()
    assert calc_data["tvdss"] == round(2680.0 - 112.5, 1) # 2567.5
    assert 0.0 <= calc_data["eta_norm"] <= 1.0
    assert calc_data["is_valid"] is True

def test_document_verification_workflow():
    # 1. List documents
    docs = client.get("/api/documents").json()
    assert len(docs) > 0
    first_doc = docs[0]

    # 2. Correct extracted field
    if len(first_doc["extractions"]) > 0:
        ext = first_doc["extractions"][0]
        correct_resp = client.post("/api/documents/extractions/correct", json={
            "extraction_id": ext["id"],
            "entity_value": "2,480.0 m MD (Verified Top)",
            "verification_status": "CORRECTED",
            "is_verified": True,
            "verified_by": "Dr. Ananya Dutta (Geoscientist)",
            "notes": "Verified against geophysical log signature"
        })
        assert correct_resp.status_code == 200
        assert correct_resp.json()["verified"] is True

    # 3. Approve document
    decision_resp = client.post(f"/api/documents/{first_doc['id']}/decision", json={
        "decision": "APPROVE",
        "reviewer_name": "Dr. Ananya Dutta (Senior Geoscientist)",
        "notes": "All depth markers and hazard records cross-verified with official well log."
    })
    assert decision_resp.status_code == 200
    assert decision_resp.json()["document_status"] == "VERIFIED"

def test_proactive_hazard_prediction_and_alert_review():
    # 1. Get lookahead hazard prediction for active well 1
    pred_resp = client.get("/api/hazards/predictions/1?lookahead_m=50")
    assert pred_resp.status_code == 200
    pred = pred_resp.json()
    assert "predictions" in pred
    assert "overall_risk_score" in pred

    # 2. List active alerts
    alerts = client.get("/api/alerts?well_id=1").json()
    assert len(alerts) > 0
    alert_1 = alerts[0]

    # 3. Submit alert review decision
    review_resp = client.post(f"/api/alerts/{alert_1['alert_id']}/review", json={
        "review_decision": "CONFIRMED_RELEVANT",
        "comments": "Acknowledged. Rig crew informed to slow pump rate and prepare LCM pill.",
        "reviewer_name": "Er. Rajesh Sarmah (RTDC Lead)"
    })
    assert review_resp.status_code == 200
    assert review_resp.json()["review_decision"] == "CONFIRMED_RELEVANT"

def test_audit_logs_and_exports():
    # 1. Check audit log records
    audit_logs = client.get("/api/audit-logs").json()
    assert len(audit_logs) > 0
    actions = [a["action"] for a in audit_logs]
    assert any("LOGIN" in a or "SEED" in a or "DEPTH" in a or "VERIFY" in a or "DOCUMENT" in a for a in actions)

    # 2. Export verification report JSON
    docs = client.get("/api/documents").json()
    export_resp = client.get(f"/api/exports/verification-report/{docs[0]['id']}?format=json")
    assert export_resp.status_code == 200
    assert "report_title" in export_resp.json()

    # 3. Export hazards CSV
    csv_resp = client.get("/api/exports/hazards-csv")
    assert csv_resp.status_code == 200
    assert "Incident ID" in csv_resp.text

if __name__ == "__main__":
    setup_module(None)
    test_login_flow()
    print("[PASS] test_login_flow")
    test_wells_management()
    print("[PASS] test_wells_management")
    test_manual_bit_depth_and_geology()
    print("[PASS] test_manual_bit_depth_and_geology")
    test_document_verification_workflow()
    print("[PASS] test_document_verification_workflow")
    test_proactive_hazard_prediction_and_alert_review()
    print("[PASS] test_proactive_hazard_prediction_and_alert_review")
    test_audit_logs_and_exports()
    print("[PASS] test_audit_logs_and_exports")
    print("\nAll eRTMAC-NWIS backend tests completed successfully!")




