import {
  WellSummary, WellDetail, Formation, DrillingIncident,
  OffsetWellSimilarity, TelemetryPoint, Alert, LookaheadSummary,
  DocumentItem, KnowledgeGraphData, AskNWISResponse
} from '../types';

const API_BASE = '/api';

export const api = {
  // Wells
  async getWells(): Promise<WellSummary[]> {
    const res = await fetch(`${API_BASE}/wells`);
    if (!res.ok) throw new Error('Failed to fetch wells');
    return res.json();
  },

  async getWell(id: number): Promise<WellDetail> {
    const res = await fetch(`${API_BASE}/wells/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch well ${id}`);
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

  // Formations
  async getFormations(): Promise<Formation[]> {
    const res = await fetch(`${API_BASE}/formations`);
    if (!res.ok) throw new Error('Failed to fetch formations');
    return res.json();
  },

  // Incidents
  async getIncidents(): Promise<DrillingIncident[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  // Telemetry
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

  // Hazards & Lookahead
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

  // Alerts
  async getAlerts(wellId?: number): Promise<Alert[]> {
    const url = wellId ? `${API_BASE}/alerts?well_id=${wellId}` : `${API_BASE}/alerts`;
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

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
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

  async verifyExtraction(extractionId: number, correctedValue: string, verifiedBy: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/extractions/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extraction_id: extractionId,
        entity_value: correctedValue,
        is_verified: true,
        verified_by: verifiedBy
      })
    });
    if (!res.ok) throw new Error('Failed to verify extraction');
    return res.json();
  },

  // Knowledge Graph
  async getKnowledgeGraph(wellId?: number): Promise<KnowledgeGraphData> {
    const url = wellId ? `${API_BASE}/knowledge-graph/well/${wellId}` : `${API_BASE}/knowledge-graph/full`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch knowledge graph');
    return res.json();
  },

  // Ask NWIS Assistant
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

  // Analytics
  async getAnalyticsSummary(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  }
};
