import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DrillingIncident, DocumentItem, Formation } from '../types';
import {
  History,
  Search,
  Filter,
  Download,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Compass,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';

export const HistoricalIntelligencePage: React.FC = () => {
  const [incidents, setIncidents] = useState<DrillingIncident[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHazard, setSelectedHazard] = useState<string>('ALL');
  const [selectedFormation, setSelectedFormation] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'events' | 'library'>('events');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [incData, docData, formData] = await Promise.all([
          api.getIncidents(),
          api.getDocuments(),
          api.getFormations()
        ]);
        setIncidents(incData);
        setDocuments(docData);
        setFormations(formData);
      } catch (err) {
        console.error('Failed to load historical intelligence data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const hazardTypes = Array.from(new Set(incidents.map((i) => i.hazard_type)));

  const filteredIncidents = incidents.filter((inc) => {
    const matchQuery =
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.well_name && inc.well_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.formation_name && inc.formation_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inc.hazard_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchHazard = selectedHazard === 'ALL' || inc.hazard_type === selectedHazard;
    const matchFormation = selectedFormation === 'ALL' || inc.formation_name === selectedFormation;
    const matchSeverity = selectedSeverity === 'ALL' || inc.severity === selectedSeverity;

    return matchQuery && matchHazard && matchFormation && matchSeverity;
  });

  const filteredDocs = documents.filter((doc) => {
    return (
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.well_name && doc.well_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#ED1C24]/20 border border-[#ED1C24]/30 text-[#ED1C24]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                Historical Intelligence &amp; Hazard Retrieval
              </h1>
              <p className="text-xs text-[#A0AAB2] mt-0.5">
                Search verified historical offset well incidents, stratigraphic intervals, and remediation SOPs across legacy reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => api.exportHazardsCsv()}
            className="px-4 py-2 rounded-xl bg-[#231F20] hover:bg-[#2E343A] border border-[#2E343A] text-white text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4 text-[#ED1C24]" />
            <span>Export Hazards CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#2E343A] pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'events'
              ? 'bg-[#ED1C24] text-white shadow-md'
              : 'text-[#A0AAB2] hover:bg-[#1A1D20] hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Historical Drilling Events ({filteredIncidents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'library'
              ? 'bg-[#ED1C24] text-white shadow-md'
              : 'text-[#A0AAB2] hover:bg-[#1A1D20] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Report Document Library ({filteredDocs.length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AAB2]" />
          <input
            type="text"
            placeholder="Search keywords (e.g. differential sticking, LCM pill, Barail)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl pl-9 pr-3 py-2 text-white outline-none transition-colors"
          />
        </div>

        {activeTab === 'events' && (
          <>
            <div className="flex items-center space-x-2">
              <span className="text-[#A0AAB2] font-semibold">Hazard:</span>
              <select
                value={selectedHazard}
                onChange={(e) => setSelectedHazard(e.target.value)}
                className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none font-semibold"
              >
                <option value="ALL">All Hazard Types</option>
                {hazardTypes.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[#A0AAB2] font-semibold">Formation:</span>
              <select
                value={selectedFormation}
                onChange={(e) => setSelectedFormation(e.target.value)}
                className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none font-semibold"
              >
                <option value="ALL">All Formations</option>
                {formations.map((f) => (
                  <option key={f.formation_id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[#A0AAB2] font-semibold">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none font-semibold"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Main List */}
      {activeTab === 'events' ? (
        <div className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="p-12 text-center text-[#A0AAB2] bg-[#1A1D20] rounded-2xl border border-[#2E343A]">
              No historical incidents found matching criteria.
            </div>
          ) : (
            filteredIncidents.map((inc) => (
              <div
                key={inc.incident_id}
                className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] hover:border-[#4B5563] transition-all space-y-3 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-[#ED1C24] border border-red-500/40'
                          : inc.severity === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-amber-500/20 text-[#FFC72C] border border-amber-500/40'
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <h3 className="text-sm font-bold text-white">{inc.hazard_type}</h3>
                    <span className="text-xs text-[#A0AAB2]">in</span>
                    <span className="text-xs font-semibold text-white">{inc.formation_name || 'Upper Assam'}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-[#A0AAB2]">Well: <strong className="text-white">{inc.well_name}</strong></span>
                    <span className="text-[#ED1C24] font-bold">{inc.NPT_hours}h NPT</span>
                  </div>
                </div>

                {/* Depth & Normalized Coordinate */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-[#121416] border border-[#2E343A]">
                    <div className="text-[10px] text-[#A0AAB2] uppercase font-bold">Measured Depth</div>
                    <div className="font-mono font-bold text-white mt-0.5">
                      {inc.depth_start}m - {inc.depth_end}m MD
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121416] border border-[#2E343A]">
                    <div className="text-[10px] text-[#A0AAB2] uppercase font-bold">TVDSS Elevation</div>
                    <div className="font-mono font-bold text-[#27AE60] mt-0.5">
                      {inc.depth_tvdss}m MSL
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121416] border border-[#2E343A]">
                    <div className="text-[10px] text-[#A0AAB2] uppercase font-bold">Normalized Formation (η)</div>
                    <div className="font-mono font-bold text-[#2D9CDB] mt-0.5">
                      η = {inc.eta_norm.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121416] border border-[#2E343A]">
                    <div className="text-[10px] text-[#A0AAB2] uppercase font-bold">Source Report</div>
                    <div className="font-mono text-xs text-white truncate mt-0.5">
                      {inc.source_document || 'WCR Report'} (Pg {inc.page_number || 1})
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#A0AAB2] leading-relaxed">
                  {inc.description}
                </p>

                {/* Mitigations */}
                {inc.mitigations && inc.mitigations.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[#27AE60] font-semibold">
                      <span>Remediation Strategy: {inc.mitigations[0].strategy}</span>
                      <span className="text-[11px] font-mono text-[#A0AAB2]">{inc.mitigations[0].SOP_reference}</span>
                    </div>
                    {inc.mitigations[0].operational_remarks && (
                      <p className="text-[#A0AAB2] text-[11px] italic">
                        &ldquo;{inc.mitigations[0].operational_remarks}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Report Library Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] hover:border-[#ED1C24]/50 transition-all flex flex-col justify-between space-y-3 shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-[#ED1C24]/20 text-[#ED1C24] font-bold text-[10px] font-mono">
                    {doc.doc_type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      doc.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-[#27AE60]'
                        : 'bg-amber-500/20 text-[#FFC72C]'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-tight">{doc.filename}</h3>
                <div className="text-[11px] text-[#A0AAB2]">
                  Well: <strong className="text-white">{doc.well_name || 'OIL Offset'}</strong> • {doc.page_count} Pages
                </div>

                <p className="text-xs text-[#A0AAB2] line-clamp-3 leading-relaxed">
                  {doc.summary || 'Historical drilling record containing formation tops, casing specs, and hazard reports.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#2E343A] flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#6C7781] font-mono">
                  Confidence: {Math.round(doc.extraction_confidence * 100)}%
                </span>
                <button
                  onClick={() => api.exportVerificationReport(doc.id, 'csv')}
                  className="text-xs text-[#ED1C24] hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>Export CSV</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
