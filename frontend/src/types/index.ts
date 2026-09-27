export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'ADMIN' | 'DRILLING_ENGINEER' | 'GEOLOGIST' | 'VIEWER';
  is_active: boolean;
  created_at?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  full_name: string;
  role: string;
}

export interface WellSummary {
  well_id: number;
  UWI: string;
  well_name: string;
  field_name: string;
  basin: string;
  operator: string;
  latitude: number;
  longitude: number;
  total_depth_md: number;
  total_depth_tvd: number;
  KB_elevation: number;
  spud_date: string;
  rig_id: string;
  status: string;
  well_type: string;
  trajectory_type: string;
  mud_system: string;
  current_bit_depth_md: number;
  current_bit_depth_tvd: number;
  incident_count: number;
  total_npt_hours: number;
}

export interface Borehole {
  borehole_id: number;
  well_id: number;
  hole_size: number;
  section_name?: string;
  max_inclination: number;
  total_depth: number;
  trajectory?: {
    md: number;
    tvd: number;
    inclination: number;
    azimuth: number;
    easting?: number;
    northing?: number;
  }[];
}

export interface FormationInterval {
  id: number;
  formation_id: number;
  formation_name: string;
  lithology: string;
  top_md: number;
  base_md: number;
  top_tvd: number;
  base_tvd: number;
  top_tvdss: number;
  base_tvdss: number;
  verification_status?: string;
  source_document?: string;
}

export interface Mitigation {
  mitigation_id: number;
  incident_id: number;
  strategy: string;
  material?: string;
  volume?: string;
  soaking_time?: string;
  success: boolean;
  SOP_reference?: string;
  operational_remarks?: string;
  post_mitigation_npt_saved?: number;
}

export interface DrillingIncident {
  incident_id: number;
  well_id: number;
  well_name?: string;
  formation_id: number;
  formation_name?: string;
  hazard_type: string;
  depth_start: number;
  depth_end: number;
  depth_tvd: number;
  depth_tvdss: number;
  eta_norm: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  NPT_hours: number;
  volume_loss_m3?: number;
  influx_volume_bbl?: number;
  overpull_klbs?: number;
  description: string;
  source_document?: string;
  page_number?: number;
  timestamp?: string;
  verification_status?: string;
  mitigations: Mitigation[];
}

export interface WellDetail extends WellSummary {
  boreholes: Borehole[];
  formation_intervals: FormationInterval[];
  incidents: DrillingIncident[];
  casing_program?: {
    section?: string;
    size_in?: number;
    shoe_md: number;
    shoe_tvd?: number;
    size?: string;
    weight?: string;
    grade?: string;
  }[];
}

export interface DepthReading {
  id: number;
  well_id: number;
  bit_depth: number;
  depth_reference: string;
  depth_unit: string;
  source_type: string;
  recorded_by: string;
  recorded_at: string;
  note?: string;
}

export interface Formation {
  formation_id: number;
  name: string;
  basin: string;
  lithology: string;
  top_tvdss: number;
  base_tvdss: number;
  pressure_baseline: number;
  fracture_gradient: number;
  description?: string;
  risk_level: string;
  incident_count: number;
}

export interface OffsetWellSimilarity {
  well_id: number;
  UWI: string;
  well_name: string;
  field_name: string;
  distance_meters: number;
  overall_similarity_score: number;
  spatial_similarity: number;
  trajectory_similarity: number;
  stratigraphic_similarity: number;
  architecture_similarity: number;
  relevance_explanation: string;
  historical_hazards_count: number;
  total_npt_hours: number;
  encountered_hazards: string[];
  latitude: number;
  longitude: number;
  trajectory?: {
    md: number;
    tvd: number;
    inclination: number;
    azimuth: number;
  }[];
}

export interface TelemetryPoint {
  timestamp: string;
  well_id: number;
  measured_depth: number;
  true_vertical_depth: number;
  WOB: number;
  RPM: number;
  ROP: number;
  ECD: number;
  SPP: number;
  torque: number;
  flow_in: number;
  flow_out: number;
  mud_weight: number;
  gas: number;
  differential_pressure: number;
  hook_load: number;
  vibration_radial: number;
  is_anomaly: boolean;
  anomaly_type?: string | null;
  stream_source?: string;
}

export interface AlertReview {
  id: number;
  alert_id: number;
  reviewer_id: string;
  reviewer_name: string;
  review_decision: string;
  comments?: string;
  reviewed_at: string;
}

export interface Alert {
  alert_id: number;
  well_id: number;
  well_name?: string;
  hazard_type: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  current_depth: number;
  predicted_depth_start: number;
  predicted_depth_end: number;
  formation: string;
  eta_norm_predicted: number;
  risk_score: number;
  confidence: number;
  evidence: {
    well_name?: string;
    distance_m?: number;
    loss_volume?: string;
    npt_hours?: string;
    eta_norm?: number;
    source_doc?: string;
    summary?: string;
  }[];
  recommended_action: string;
  mitigation_options?: {
    strategy: string;
    material?: string;
    volume?: string;
    soaking_time?: string;
    SOP_reference?: string;
    operational_remarks?: string;
    success_rate?: string;
  }[];
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  acknowledged_by?: string;
  notes?: string;
  analysis_method?: string;
  analysis_version?: string;
  reviews?: AlertReview[];
}

export interface LookaheadSummary {
  current_depth_md: number;
  current_depth_tvdss: number;
  lookahead_window_m: number;
  target_interval_start_md: number;
  target_interval_end_md: number;
  current_formation: string;
  target_formations: string[];
  current_eta_norm: number;
  overall_risk_score: number;
  overall_risk_category: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  detected_hazards: any[];
  why_risk_increased: string;
  offset_wells_evaluated: number;
  relevant_offsets_count: number;
}

export interface VerificationRecord {
  id: number;
  document_id: number;
  extracted_field_id?: number;
  reviewer_id: string;
  reviewer_name: string;
  original_value?: string;
  corrected_value?: string;
  review_status: string;
  review_note?: string;
  source_page: number;
  reviewed_at: string;
}

export interface DocumentExtraction {
  id: number;
  document_id: number;
  field_group: string;
  entity_type: string;
  entity_key: string;
  entity_value: string;
  normalized_value?: string;
  unit?: string;
  confidence: number;
  page_number: number;
  source_snippet?: string;
  is_verified: boolean;
  verification_status: string;
  verified_by?: string;
  notes?: string;
}

export interface DocumentItem {
  id: number;
  well_id?: number;
  well_name?: string;
  document_title?: string;
  filename: string;
  doc_type: string;
  file_size_bytes: number;
  upload_timestamp: string;
  status: string;
  page_count: number;
  summary?: string;
  extraction_confidence: number;
  uploaded_by?: string;
  document_version?: string;
  document_source?: string;
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  extractions: DocumentExtraction[];
  verification_records?: VerificationRecord[];
}

export interface AuditLog {
  id: number;
  user_id: string;
  user_name: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  timestamp: string;
  reason?: string;
}

export interface KnowledgeGraphData {
  nodes: {
    id: string;
    label: string;
    node_type: 'Well' | 'Borehole' | 'Formation' | 'Incident' | 'Mitigation';
    properties?: Record<string, any>;
  }[];
  edges: {
    id: number;
    source: string;
    target: string;
    relation_type: string;
    properties?: Record<string, any>;
  }[];
}

export interface AskNWISCitation {
  well_name: string;
  formation: string;
  hazard_type?: string;
  depth_interval?: string;
  eta_norm?: number;
  mitigation_applied?: string;
  npt_hours?: number;
  source_document: string;
  page_number: number;
  snippet: string;
  confidence: number;
}

export interface AskNWISResponse {
  query: string;
  answer: string;
  confidence: number;
  grounded_in_data: boolean;
  citations: AskNWISCitation[];
  relevant_wells: string[];
  suggested_followups: string[];
}
