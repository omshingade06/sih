import {
  WellSummary, WellDetail, Formation, DrillingIncident,
  OffsetWellSimilarity, TelemetryPoint, Alert, LookaheadSummary,
  DocumentItem, KnowledgeGraphData, AskNWISResponse, User, AuthToken,
  AuditLog, DepthReading, AlertReview
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://geolookahead.onrender.com/api').replace(/\/$/, '');

export const api = {
  // ==================== Auth & Users ====================
  async login(username: string, password: string): Promise<AuthToken> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Incorrect username or password');
    }
    return res.json();
  },

  async getCurrentUser(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me?token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error('Failed to fetch current user profile');
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch user list');
    return res.json();
  },

  async createUser(userData: { username: string; email: string; password: string; full_name?: string; role: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create user' }));
      throw new Error(err.detail || 'User registration failed');
    }
    return res.json();
  },

  async updateUser(userId: number, updateData: any): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  // ==================== Wells ====================
  async getWells(params?: { field?: string; status?: string; well_type?: string; search?: string }): Promise<WellSummary[]> {
    let url = `${API_BASE}/wells`;
    if (params) {
      const q = new URLSearchParams();
      if (params.field) q.append('field', params.field);
      if (params.status) q.append('status', params.status);
      if (params.well_type) q.append('well_type', params.well_type);
      if (params.search) q.append('search', params.search);
      const queryString = q.toString();
      if (queryString) url += `?${queryString}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch wells');
    return res.json();
  },

  async getWell(id: number): Promise<WellDetail> {
    const res = await fetch(`${API_BASE}/wells/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch well ${id}`);
    return res.json();
  },

  async createWell(wellData: any): Promise<WellSummary> {
    const res = await fetch(`${API_BASE}/wells`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wellData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create well' }));
      throw new Error(err.detail || 'Failed to create well record');
    }
    return res.json();
  },

  async updateWell(id: number, wellData: any): Promise<WellSummary> {
    const res = await fetch(`${API_BASE}/wells/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wellData)
    });
    if (!res.ok) throw new Error('Failed to update well');
    return res.json();
  },

  async deleteWell(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/wells/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete well');
    return res.json();
  },

  async enterManualDepth(wellId: number, depthData: { bit_depth: number; depth_reference?: string; depth_unit?: string; note?: string; recorded_by?: string }): Promise<DepthReading> {
    const res = await fetch(`${API_BASE}/wells/${wellId}/manual-depth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(depthData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to record manual bit depth' }));
      throw new Error(err.detail || 'Depth input validation failed');
    }
    return res.json();
  },

  async getDepthReadings(wellId: number): Promise<DepthReading[]> {
    const res = await fetch(`${API_BASE}/wells/${wellId}/depth-readings`);
    if (!res.ok) throw new Error('Failed to fetch depth readings history');
    return res.json();
  },

  async calculateGeology(params: { tvd: number; kb_elevation: number; top_tvdss: number; base_tvdss: number }): Promise<any> {
    const res = await fetch(`${API_BASE}/wells/calculate-geology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to evaluate geological formula');
    return res.json();
  },

  async getNearbyWells(id: number, radiusKm: number = 25): Promise<OffsetWellSimilarity[]> {
    const res = await fetch(`${API_BASE}/wells/${id}/nearby?radius_km=${radiusKm}`);
    if (!res.ok) throw new Error('Failed to fetch nearby wells');
    return res.json();
  },

  async getSimilarWellsCustom(id: number, weights: {
    weight_spatial: number;
    weight_trajectory: number;
    weight_stratigraphic: number;
    weight_architecture: number;
    max_radius_km: number;
  }): Promise<OffsetWellSimilarity[]> {
    const res = await fetch(`${API_BASE}/wells/${id}/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights)
    });
    if (!res.ok) throw new Error('Failed to calculate similarity');
    return res.json();
  },

  // ==================== Formations & Incidents ====================
  async getFormations(): Promise<Formation[]> {
    const res = await fetch(`${API_BASE}/formations`);
    if (!res.ok) throw new Error('Failed to fetch formations');
    return res.json();
  },

  async getIncidents(): Promise<DrillingIncident[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  // ==================== Telemetry ====================
  async getLatestTelemetry(wellId: number): Promise<TelemetryPoint> {
    const res = await fetch(`${API_BASE}/telemetry/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch telemetry');
    return res.json();
  },

  async controlTelemetry(wellId: number, action: string, speedMultiplier?: number, anomalyType?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/telemetry/${wellId}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        well_id: wellId,
        action,
        speed_multiplier: speedMultiplier || 1.0,
        anomaly_type: anomalyType
      })
    });
    if (!res.ok) throw new Error('Failed to control telemetry simulator');
    return res.json();
  },

  // ==================== Hazards & Lookahead ====================
  async getLookahead(wellId: number, lookaheadM: number = 50): Promise<LookaheadSummary> {
    const res = await fetch(`${API_BASE}/hazards/lookahead?well_id=${wellId}&lookahead_m=${lookaheadM}`);
    if (!res.ok) throw new Error('Failed to fetch lookahead summary');
    return res.json();
  },

  async getHazardPredictions(wellId: number, lookaheadM: number = 50): Promise<any> {
    const res = await fetch(`${API_BASE}/hazards/predictions/${wellId}?lookahead_m=${lookaheadM}`);
    if (!res.ok) throw new Error('Failed to fetch hazard predictions');
    return res.json();
  },

  // ==================== Alerts & Reviews ====================
  async getAlerts(wellId?: number, status?: string, severity?: string): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (wellId) params.append('well_id', wellId.toString());
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}/alerts?${queryString}` : `${API_BASE}/alerts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(alertId: number, acknowledgedBy: string = 'RTDC Lead Engineer', notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acknowledged_by: acknowledgedBy,
        status: 'ACKNOWLEDGED',
        notes
      })
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async submitAlertReview(alertId: number, reviewData: { review_decision: string; comments?: string; reviewer_name?: string }): Promise<AlertReview> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    if (!res.ok) throw new Error('Failed to submit alert review decision');
    return res.json();
  },

  // ==================== Documents & Verification Center ====================
  async getDocuments(params?: { well_id?: number; doc_type?: string; status?: string; search?: string }): Promise<DocumentItem[]> {
    let url = `${API_BASE}/documents`;
    if (params) {
      const q = new URLSearchParams();
      if (params.well_id) q.append('well_id', params.well_id.toString());
      if (params.doc_type) q.append('doc_type', params.doc_type);
      if (params.status) q.append('status', params.status);
      if (params.search) q.append('search', params.search);
      const qs = q.toString();
      if (qs) url += `?${qs}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(docId: number): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${docId}`);
    if (!res.ok) throw new Error(`Failed to fetch document ${docId}`);
    return res.json();
  },

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload document' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async createManualReport(reportData: any): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    if (!res.ok) throw new Error('Failed to create manual report');
    return res.json();
  },

  async correctExtraction(reqData: {
    extraction_id: number;
    entity_value: string;
    normalized_value?: string;
    unit?: string;
    verification_status?: string;
    is_verified?: boolean;
    verified_by?: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/extractions/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extraction_id: reqData.extraction_id,
        entity_value: reqData.entity_value,
        normalized_value: reqData.normalized_value,
        unit: reqData.unit,
        verification_status: reqData.verification_status || 'CORRECTED',
        is_verified: reqData.is_verified ?? true,
        verified_by: reqData.verified_by || 'Dr. Ananya Dutta (Geoscientist)',
        notes: reqData.notes
      })
    });
    if (!res.ok) throw new Error('Failed to verify/correct extraction');
    return res.json();
  },

  async verifyDocumentDecision(docId: number, decisionData: { decision: string; reviewer_name: string; notes?: string; rejection_reason?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${docId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decisionData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to process document decision' }));
      throw new Error(err.detail || 'Verification decision failed');
    }
    return res.json();
  },

  // ==================== Audit Logs ====================
  async getAuditLogs(params?: { action?: string; entity_type?: string; user_name?: string; limit?: number }): Promise<AuditLog[]> {
    let url = `${API_BASE}/audit-logs`;
    if (params) {
      const q = new URLSearchParams();
      if (params.action) q.append('action', params.action);
      if (params.entity_type) q.append('entity_type', params.entity_type);
      if (params.user_name) q.append('user_name', params.user_name);
      if (params.limit) q.append('limit', params.limit.toString());
      const qs = q.toString();
      if (qs) url += `?${qs}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // ==================== Knowledge Graph & AI Copilot ====================
  async getKnowledgeGraph(wellId?: number): Promise<KnowledgeGraphData> {
    const url = wellId ? `${API_BASE}/knowledge-graph/well/${wellId}` : `${API_BASE}/knowledge-graph/full`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch knowledge graph');
    return res.json();
  },

  async askNWIS(query: string, activeWellId: number = 1, currentFormation: string = 'Barail Sandstone', currentDepth: number = 2845): Promise<AskNWISResponse> {
    const res = await fetch(`${API_BASE}/ask-nwis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        active_well_id: activeWellId,
        current_formation: currentFormation,
        current_depth: currentDepth
      })
    });
    if (!res.ok) throw new Error('Failed to query NWIS assistant');
    return res.json();
  },

  // ==================== Analytics, Exports & Admin ====================
  async getAnalyticsSummary(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async exportVerificationReport(docId: number, format: 'json' | 'csv' = 'json'): Promise<any> {
    const res = await fetch(`${API_BASE}/exports/verification-report/${docId}?format=${format}`);
    if (!res.ok) throw new Error('Failed to export verification report');
    if (format === 'csv') {
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Verification_Report_Doc_${docId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    }
    return res.json();
  },

  async exportHazardsCsv(): Promise<void> {
    const res = await fetch(`${API_BASE}/exports/hazards-csv`);
    if (!res.ok) throw new Error('Failed to export hazards CSV');
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'OIL_Historical_Drilling_Hazards.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  async resetDemoDatabase(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/reset-demo`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset demo database');
    return res.json();
  },

  async getSystemHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  }
};
