import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(50), default="DRILLING_ENGINEER")  # ADMIN, DRILLING_ENGINEER, GEOLOGIST, VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Well(Base):
    __tablename__ = "wells"

    well_id = Column(Integer, primary_key=True, index=True)
    UWI = Column(String(50), unique=True, index=True, nullable=False)
    well_name = Column(String(100), index=True, nullable=False)
    field_name = Column(String(100), index=True, nullable=False)  # e.g., Nahorkatiya, Moran, Digboi, Jorajan
    basin = Column(String(100), default="Upper Assam Basin")
    operator = Column(String(100), default="Oil India Limited (OIL)")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    surface_easting = Column(Float, nullable=True)
    surface_northing = Column(Float, nullable=True)
    total_depth_md = Column(Float, nullable=False)  # Measured Depth (m)
    total_depth_tvd = Column(Float, nullable=False)  # True Vertical Depth (m)
    KB_elevation = Column(Float, default=112.5)  # Kelly Bushing elevation above MSL (m)
    spud_date = Column(String(50))
    rig_id = Column(String(50), default="OIL-RIG-14")
    status = Column(String(50), default="ACTIVE")  # ACTIVE, DRILLING, COMPLETED, SUSPENDED, ABANDONED
    well_type = Column(String(50), default="DEVELOPMENT")  # EXPLORATION, DEVELOPMENT, WORKOVER
    trajectory_type = Column(String(50), default="DIRECTIONAL")  # VERTICAL, DIRECTIONAL, HORIZONTAL, S-CURVE
    mud_system = Column(String(100), default="WBM Potassium Chloride Polymer")
    casing_program = Column(JSON, nullable=True)
    current_bit_depth_md = Column(Float, default=2845.0)
    current_bit_depth_tvd = Column(Float, default=2680.0)

    # Relationships
    boreholes = relationship("Borehole", back_populates="well", cascade="all, delete-orphan")
    incidents = relationship("DrillingIncident", back_populates="well", cascade="all, delete-orphan")
    telemetry_records = relationship("Telemetry", back_populates="well", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="well", cascade="all, delete-orphan")
    formation_intervals = relationship("WellFormationInterval", back_populates="well", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="well")
    depth_readings = relationship("DepthReading", back_populates="well", cascade="all, delete-orphan")

class Borehole(Base):
    __tablename__ = "boreholes"

    borehole_id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey("wells.well_id"), nullable=False)
    hole_size = Column(Float, nullable=False)  # inches e.g. 12.25, 8.5, 6.0
    section_name = Column(String(50))  # Surface, Intermediate, Production
    max_inclination = Column(Float, default=0.0)  # degrees
    total_depth = Column(Float, nullable=False)  # MD
    trajectory = Column(JSON, nullable=True)  # List of {md, tvd, inc, azim, easting, northing}

    well = relationship("Well", back_populates="boreholes")

class Formation(Base):
    __tablename__ = "formations"

    formation_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    basin = Column(String(100), default="Upper Assam Basin")
    lithology = Column(String(100), nullable=False)  # Sandstone, Shale, Claystone, Limestone, Coal
    top_tvdss = Column(Float, nullable=False)  # Regional baseline Top TVDSS (m below MSL)
    base_tvdss = Column(Float, nullable=False)  # Regional baseline Base TVDSS (m below MSL)
    pressure_baseline = Column(Float, default=1.12)  # S.G. EMW baseline pore pressure
    fracture_gradient = Column(Float, default=1.65)  # S.G. EMW fracture gradient
    description = Column(Text, nullable=True)
    risk_level = Column(String(50), default="MODERATE")  # LOW, MODERATE, HIGH, CRITICAL

    incidents = relationship("DrillingIncident", back_populates="formation")
    well_intervals = relationship("WellFormationInterval", back_populates="formation")

class WellFormationInterval(Base):
    __tablename__ = "well_formation_intervals"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey("wells.well_id"), nullable=False)
    formation_id = Column(Integer, ForeignKey("formations.formation_id"), nullable=False)
    top_md = Column(Float, nullable=False)
    base_md = Column(Float, nullable=False)
    top_tvd = Column(Float, nullable=False)
    base_tvd = Column(Float, nullable=False)
    top_tvdss = Column(Float, nullable=False)
    base_tvdss = Column(Float, nullable=False)
    verification_status = Column(String(50), default="VERIFIED")  # VERIFIED, UNVERIFIED, ESTIMATED
    source_document = Column(String(200), nullable=True)

    well = relationship("Well", back_populates="formation_intervals")
    formation = relationship("Formation", back_populates="well_intervals")

class DrillingIncident(Base):
    __tablename__ = "drilling_incidents"

    incident_id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey("wells.well_id"), nullable=False)
    formation_id = Column(Integer, ForeignKey("formations.formation_id"), nullable=False)
    hazard_type = Column(String(100), index=True, nullable=False)  
    # Lost Circulation, Differential Sticking, Mechanical Sticking, Gas Kick, Tight Hole, Torque Spike, Packing Off
    depth_start = Column(Float, nullable=False)  # MD (m)
    depth_end = Column(Float, nullable=False)    # MD (m)
    depth_tvd = Column(Float, nullable=False)    # TVD (m)
    depth_tvdss = Column(Float, nullable=False)  # TVDSS (m)
    eta_norm = Column(Float, nullable=False)     # Normalized formation coordinate (0.0 to 1.0)
    severity = Column(String(50), default="HIGH")  # LOW, MODERATE, HIGH, CRITICAL
    NPT_hours = Column(Float, default=0.0)       # Non-Productive Time in hours
    volume_loss_m3 = Column(Float, default=0.0)  # If lost circulation
    influx_volume_bbl = Column(Float, default=0.0) # If kick
    overpull_klbs = Column(Float, default=0.0)   # If sticking/tight hole
    description = Column(Text, nullable=False)
    source_document = Column(String(200), nullable=True)  # WCR, DDR, MudLog
    page_number = Column(Integer, default=1)
    timestamp = Column(String(50), nullable=True)
    verification_status = Column(String(50), default="VERIFIED")  # VERIFIED, UNVERIFIED, SYNTHETIC

    well = relationship("Well", back_populates="incidents")
    formation = relationship("Formation", back_populates="incidents")
    mitigations = relationship("Mitigation", back_populates="incident", cascade="all, delete-orphan")

class Mitigation(Base):
    __tablename__ = "mitigations"

    mitigation_id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("drilling_incidents.incident_id"), nullable=False)
    strategy = Column(String(200), nullable=False)  # e.g., High Permeability LCM Pill, Cement Squeeze, Acid Wash, Free Point & Jarring
    material = Column(String(200))                  # e.g., Nut Plug + Mica + Calcium Carbonate 40 ppb
    volume = Column(String(100))                    # e.g., 25 m3 pill
    soaking_time = Column(String(100))              # e.g., 4.5 hours
    success = Column(Boolean, default=True)
    SOP_reference = Column(String(200), default="OIL-SOP-DRL-042 Rev.3")
    operational_remarks = Column(Text, nullable=True)
    post_mitigation_npt_saved = Column(Float, default=0.0)

    incident = relationship("DrillingIncident", back_populates="mitigations")

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey("wells.well_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    measured_depth = Column(Float, nullable=False, index=True)
    true_vertical_depth = Column(Float, nullable=False)
    WOB = Column(Float, nullable=False)      # Weight on Bit (kN or klbs)
    RPM = Column(Float, nullable=False)      # Rotary Speed (RPM)
    ROP = Column(Float, nullable=False)      # Rate of Penetration (m/hr)
    ECD = Column(Float, nullable=False)      # Equivalent Circulating Density (S.G. or ppg)
    SPP = Column(Float, nullable=False)      # Standpipe Pressure (psi or bar)
    torque = Column(Float, nullable=False)   # Surface/Downhole Torque (kN.m or ft.lbs)
    flow_in = Column(Float, nullable=False)  # Flow In (LPM or gpm)
    flow_out = Column(Float, nullable=False) # Flow Out (% or LPM)
    mud_weight = Column(Float, nullable=False) # In density (S.G.)
    gas = Column(Float, nullable=False)      # Total Gas (units or %)
    differential_pressure = Column(Float, default=0.0)
    hook_load = Column(Float, default=180.0)
    vibration_radial = Column(Float, default=1.2)
    is_anomaly = Column(Boolean, default=False)
    anomaly_type = Column(String(100), nullable=True)

    well = relationship("Well", back_populates="telemetry_records")

class DepthReading(Base):
    __tablename__ = "depth_readings"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey("wells.well_id"), nullable=False)
    bit_depth = Column(Float, nullable=False)
    depth_reference = Column(String(50), default="MD")  # MD, TVD, TVDSS
    depth_unit = Column(String(20), default="m")
    source_type = Column(String(50), default="MANUAL")  # MANUAL, SIMULATED_TELEMETRY, LIVE_WITSML
    recorded_by = Column(String(100), default="Drilling Engineer")
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    note = Column(String(255), nullable=True)

    well = relationship("Well", back_populates="depth_readings")

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey("wells.well_id"), nullable=False)
    hazard_type = Column(String(100), nullable=False)
    severity = Column(String(50), default="HIGH")  # LOW, MODERATE, HIGH, CRITICAL
    current_depth = Column(Float, nullable=False)
    predicted_depth_start = Column(Float, nullable=False)
    predicted_depth_end = Column(Float, nullable=False)
    formation = Column(String(100), nullable=False)
    eta_norm_predicted = Column(Float, default=0.0)
    risk_score = Column(Float, nullable=False)  # 0.0 - 1.0
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    evidence = Column(JSON, nullable=False)     # Structured evidence list
    recommended_action = Column(Text, nullable=False)
    mitigation_options = Column(JSON, nullable=True) # Recommended successful mitigations
    status = Column(String(50), default="ACTIVE")   # ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED, REVIEWED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    acknowledged_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    analysis_method = Column(String(100), default="4-Factor Offset Spatial-Stratigraphic Analysis")
    analysis_version = Column(String(50), default="v1.4.2")

    well = relationship("Well", back_populates="alerts")
    reviews = relationship("AlertReview", back_populates="alert", cascade="all, delete-orphan")

class AlertReview(Base):
    __tablename__ = "alert_reviews"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.alert_id"), nullable=False)
    reviewer_id = Column(String(100), nullable=False)
    reviewer_name = Column(String(100), nullable=False)
    review_decision = Column(String(50), nullable=False)  # CONFIRMED_RELEVANT, NOT_RELEVANT, FLAGGED_INCORRECT, REVIEWED, ESCALATED
    comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.datetime.utcnow)

    alert = relationship("Alert", back_populates="reviews")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    well_id = Column(Integer, ForeignKey("wells.well_id"), nullable=True)
    document_title = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=False)
    doc_type = Column(String(100), default="WCR")  # WCR, DDR, MudLog, DirectionalSurvey, GeologicalReport
    file_size_bytes = Column(Integer, default=102400)
    upload_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="PROCESSED")  # UPLOADED, PROCESSING, PROCESSED, NEEDS_REVIEW, UNDER_VERIFICATION, VERIFIED, REJECTED, FAILED
    page_count = Column(Integer, default=12)
    raw_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    extraction_confidence = Column(Float, default=0.94)
    uploaded_by = Column(String(100), default="Data Ingestion Pipeline")
    document_version = Column(String(50), default="1.0")
    document_source = Column(String(100), default="Oil India Limited (OIL) Archive")
    rejection_reason = Column(Text, nullable=True)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    well = relationship("Well", back_populates="documents")
    extractions = relationship("DocumentExtraction", back_populates="document", cascade="all, delete-orphan")
    verification_records = relationship("VerificationRecord", back_populates="document", cascade="all, delete-orphan")

class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    field_group = Column(String(100), default="WELL_METADATA")  # WELL_METADATA, DRILLING_PARAMETERS, GEOLOGICAL_INFO, DRILLING_EVENTS, MITIGATION
    entity_type = Column(String(100), nullable=False)  # WELL_INFO, FORMATION_TOP, CASING, DRILLING_PARAM, HAZARD_EVENT, MITIGATION
    entity_key = Column(String(100), nullable=False)
    entity_value = Column(String(500), nullable=False)
    normalized_value = Column(String(500), nullable=True)
    unit = Column(String(50), nullable=True)
    confidence = Column(Float, default=0.92)
    page_number = Column(Integer, default=1)
    source_snippet = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String(50), default="NOT_REVIEWED")  # NOT_REVIEWED, VERIFIED, CORRECTED, MISSING, CONFLICTING, REJECTED
    verified_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    document = relationship("Document", back_populates="extractions")
    verification_records = relationship("VerificationRecord", back_populates="extraction", cascade="all, delete-orphan")

class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    extracted_field_id = Column(Integer, ForeignKey("document_extractions.id"), nullable=True)
    reviewer_id = Column(String(100), nullable=False)
    reviewer_name = Column(String(100), nullable=False)
    original_value = Column(String(500), nullable=True)
    corrected_value = Column(String(500), nullable=True)
    review_status = Column(String(50), nullable=False)  # VERIFIED, CORRECTED, REJECTED, APPROVED_DOCUMENT, REJECTED_DOCUMENT
    review_note = Column(Text, nullable=True)
    source_page = Column(Integer, default=1)
    reviewed_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="verification_records")
    extraction = relationship("DocumentExtraction", back_populates="verification_records")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, default="system")
    user_name = Column(String(100), nullable=False, default="System User")
    role = Column(String(50), nullable=False, default="SYSTEM")
    action = Column(String(100), nullable=False)  # LOGIN, LOGOUT, CREATE_WELL, UPDATE_WELL, UPLOAD_DOCUMENT, EXTRACT_DOCUMENT, VERIFY_FIELD, APPROVE_DOCUMENT, REJECT_DOCUMENT, MANUAL_DEPTH_ENTRY, ALERT_REVIEW
    entity_type = Column(String(100), nullable=False)  # USER, WELL, DOCUMENT, EXTRACTION, DEPTH_READING, ALERT, CONFIG
    entity_id = Column(String(100), nullable=True)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    reason = Column(Text, nullable=True)

class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(String(100), primary_key=True)
    label = Column(String(100), nullable=False)
    node_type = Column(String(50), nullable=False)  # Well, Borehole, Formation, Incident, Mitigation, Rig, SOP
    properties = Column(JSON, nullable=True)

class KnowledgeEdge(Base):
    __tablename__ = "knowledge_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(String(100), nullable=False, index=True)
    target_id = Column(String(100), nullable=False, index=True)
    relation_type = Column(String(100), nullable=False)  
    # HAS_BOREHOLE, INTERSECTS_FORMATION, EXPERIENCED_EVENT, MITIGATED_BY, OPERATED_BY, REFERENCES_SOP
    properties = Column(JSON, nullable=True)
