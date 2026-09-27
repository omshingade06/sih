from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    full_name: str
    role: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool

# Borehole Schemas
class BoreholeBase(BaseModel):
    borehole_id: int
    well_id: int
    hole_size: float
    section_name: Optional[str] = None
    max_inclination: float
    total_depth: float
    trajectory: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

# Formation Interval Schemas
class WellFormationIntervalSchema(BaseModel):
    id: int
    formation_id: int
    formation_name: Optional[str] = None
    lithology: Optional[str] = None
    top_md: float
    base_md: float
    top_tvd: float
    base_tvd: float
    top_tvdss: float
    base_tvdss: float

    class Config:
        from_attributes = True

# Mitigation Schemas
class MitigationSchema(BaseModel):
    mitigation_id: int
    incident_id: int
    strategy: str
    material: Optional[str] = None
    volume: Optional[str] = None
    soaking_time: Optional[str] = None
    success: bool
    SOP_reference: Optional[str] = None
    operational_remarks: Optional[str] = None
    post_mitigation_npt_saved: Optional[float] = 0.0

    class Config:
        from_attributes = True

# Incident Schemas
class IncidentSchema(BaseModel):
    incident_id: int
    well_id: int
    well_name: Optional[str] = None
    formation_id: int
    formation_name: Optional[str] = None
    hazard_type: str
    depth_start: float
    depth_end: float
    depth_tvd: float
    depth_tvdss: float
    eta_norm: float
    severity: str
    NPT_hours: float
    volume_loss_m3: Optional[float] = 0.0
    influx_volume_bbl: Optional[float] = 0.0
    overpull_klbs: Optional[float] = 0.0
    description: str
    source_document: Optional[str] = None
    page_number: Optional[int] = 1
    timestamp: Optional[str] = None
    mitigations: List[MitigationSchema] = []

    class Config:
        from_attributes = True

# Well Schemas
class WellSummarySchema(BaseModel):
    well_id: int
    UWI: str
    well_name: str
    field_name: str
    basin: str
    operator: str
    latitude: float
    longitude: float
    total_depth_md: float
    total_depth_tvd: float
    KB_elevation: float
    spud_date: Optional[str] = None
    rig_id: str
    status: str
    well_type: str
    trajectory_type: str
    mud_system: str
    current_bit_depth_md: float
    current_bit_depth_tvd: float
    incident_count: Optional[int] = 0
    total_npt_hours: Optional[float] = 0.0

    class Config:
        from_attributes = True

class WellDetailSchema(WellSummarySchema):
    boreholes: List[BoreholeBase] = []
    formation_intervals: List[WellFormationIntervalSchema] = []
    incidents: List[IncidentSchema] = []
    casing_program: Optional[Any] = None

# Formation Schemas
class FormationSchema(BaseModel):
    formation_id: int
    name: str
    basin: str
    lithology: str
    top_tvdss: float
    base_tvdss: float
    pressure_baseline: float
    fracture_gradient: float
    description: Optional[str] = None
    risk_level: str
    incident_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Offset Well Similarity Schemas
class OffsetWellSimilarity(BaseModel):
    well_id: int
    UWI: str
    well_name: str
    field_name: str
    distance_meters: float
    overall_similarity_score: float  # 0.0 - 1.0
    spatial_similarity: float
    trajectory_similarity: float
    stratigraphic_similarity: float
    architecture_similarity: float
    relevance_explanation: str
    historical_hazards_count: int
    total_npt_hours: float
    encountered_hazards: List[str]
    latitude: float
    longitude: float
    trajectory: Optional[List[Dict[str, Any]]] = None

class SimilarityWeights(BaseModel):
    weight_spatial: float = 0.35
    weight_trajectory: float = 0.20
    weight_stratigraphic: float = 0.30
    weight_architecture: float = 0.15
    max_radius_km: float = 25.0

# Telemetry Schemas
class TelemetryPoint(BaseModel):
    timestamp: datetime
    well_id: int
    measured_depth: float
    true_vertical_depth: float
    WOB: float
    RPM: float
    ROP: float
    ECD: float
    SPP: float
    torque: float
    flow_in: float
    flow_out: float
    mud_weight: float
    gas: float
    differential_pressure: float
    hook_load: float
    vibration_radial: float
    is_anomaly: bool = False
    anomaly_type: Optional[str] = None

    class Config:
        from_attributes = True

class TelemetryStreamControl(BaseModel):
    well_id: int
    action: str  # start, pause, reset, step, set_speed, trigger_anomaly
    speed_multiplier: Optional[float] = 1.0
    anomaly_type: Optional[str] = None

# Alert Schemas
class AlertSchema(BaseModel):
    alert_id: int
    well_id: int
    well_name: Optional[str] = None
    hazard_type: str
    severity: str
    current_depth: float
    predicted_depth_start: float
    predicted_depth_end: float
    formation: str
    eta_norm_predicted: float
    risk_score: float
    confidence: float
    evidence: List[Dict[str, Any]]
    recommended_action: str
    mitigation_options: Optional[List[Dict[str, Any]]] = None
    status: str
    created_at: datetime
    acknowledged_by: Optional[str] = None

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str
    status: str = "ACKNOWLEDGED"
    notes: Optional[str] = None

# Look-Ahead & Hazard Prediction Schemas
class LookaheadHazardSummary(BaseModel):
    current_depth_md: float
    current_depth_tvdss: float
    lookahead_window_m: float
    target_interval_start_md: float
    target_interval_end_md: float
    current_formation: str
    target_formations: List[str]
    current_eta_norm: float
    overall_risk_score: float
    overall_risk_category: str  # LOW, MODERATE, HIGH, CRITICAL
    detected_hazards: List[Dict[str, Any]]
    why_risk_increased: str
    offset_wells_evaluated: int
    relevant_offsets_count: int

# Document Schemas
class DocumentExtractionSchema(BaseModel):
    id: int
    entity_type: str
    entity_key: str
    entity_value: str
    confidence: float
    page_number: int
    source_snippet: Optional[str] = None
    is_verified: bool = False
    verified_by: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentSchema(BaseModel):
    id: int
    well_id: Optional[int] = None
    well_name: Optional[str] = None
    filename: str
    doc_type: str
    file_size_bytes: int
    upload_timestamp: datetime
    status: str
    page_count: int
    summary: Optional[str] = None
    extraction_confidence: float
    extractions: List[DocumentExtractionSchema] = []

    class Config:
        from_attributes = True

class ExtractionCorrectionRequest(BaseModel):
    extraction_id: int
    entity_value: str
    is_verified: bool = True
    verified_by: str = "Drilling Engineer (OIL-RTDC)"

class ManualReportCreateRequest(BaseModel):
    well_id: Optional[int] = 2
    filename: str
    doc_type: str = "WCR"  # WCR, DDR, MudLog, DirectionalSurvey
    page_count: Optional[int] = 8
    summary: Optional[str] = None
    formation_name: Optional[str] = "Barail Arenaceous (Sandstone)"
    hazard_type: Optional[str] = "Lost Circulation"
    severity: Optional[str] = "HIGH"
    depth_start: Optional[float] = 2862.0
    depth_end: Optional[float] = 2874.0
    npt_hours: Optional[float] = 14.5
    volume_loss_m3: Optional[float] = 35.0
    mitigation_strategy: Optional[str] = "High-Permeability LCM Pill (Nut Plug 20 ppb + Mica 15 ppb + coarse CaCO3 10 ppb)"
    mitigation_material: Optional[str] = "Nut Plug + Mica + Calcium Carbonate"
    sop_reference: Optional[str] = "OIL-SOP-DRL-042 Rev.3"
    operational_remarks: Optional[str] = "Pill soaked 4.0 hours, returns restored cleanly."
    raw_text: Optional[str] = None

# Knowledge Graph Schemas
class GraphNodeSchema(BaseModel):
    id: str
    label: str
    node_type: str
    properties: Optional[Dict[str, Any]] = None

class GraphEdgeSchema(BaseModel):
    id: int
    source: str
    target: str
    relation_type: str
    properties: Optional[Dict[str, Any]] = None

class KnowledgeGraphResponse(BaseModel):
    nodes: List[GraphNodeSchema]
    edges: List[GraphEdgeSchema]

# Ask NWIS RAG Schemas
class AskNWISRequest(BaseModel):
    query: str
    active_well_id: Optional[int] = 1
    current_formation: Optional[str] = "Barail Sandstone"
    current_depth: Optional[float] = 2845.0

class CitationSource(BaseModel):
    well_name: str
    formation: str
    hazard_type: Optional[str] = None
    depth_interval: Optional[str] = None
    eta_norm: Optional[float] = None
    mitigation_applied: Optional[str] = None
    npt_hours: Optional[float] = None
    source_document: str
    page_number: int
    snippet: str
    confidence: float

class AskNWISResponse(BaseModel):
    query: str
    answer: str
    confidence: float
    grounded_in_data: bool
    citations: List[CitationSource]
    relevant_wells: List[str]
    suggested_followups: List[str]
