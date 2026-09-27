import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { DocumentItem, DocumentExtraction } from '../types';
import {
  FileText,
  Upload,
  PlusCircle,
  CheckCircle2,
  Edit3,
  BookOpen,
  X,
  Layers,
  ShieldAlert,
  Sliders,
  Sparkles
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { wells } = useApp();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [editingExtraction, setEditingExtraction] = useState<DocumentExtraction | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Manual Report Modal State
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    well_id: 2,
    filename: 'WCR_OIL_NHK_415_Operations.pdf',
    doc_type: 'WCR',
    page_count: 12,
    formation_name: 'Barail Arenaceous (Sandstone)',
    hazard_type: 'Lost Circulation',
    severity: 'HIGH',
    depth_start: 2865.0,
    depth_end: 2878.0,
    npt_hours: 16.5,
    volume_loss_m3: 42.0,
    mitigation_strategy: 'High-Permeability LCM Pill (Nut Plug 20 ppb + Mica 15 ppb + CaCO3 10 ppb)',
    mitigation_material: 'Nut Plug + Mica + Calcium Carbonate blend',
    sop_reference: 'OIL-SOP-DRL-042 Rev.3',
    operational_remarks: 'Total losses encountered in depleted Barail member. Spotted 25 m3 LCM pill, soaked 4.5h. Full returns established.',
    summary: 'Comprehensive Well Completion Report covering 8-1/2 section operations, loss zone penetration, and successful LCM remediation.'
  });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', file.name.includes('DDR') ? 'DDR' : 'WCR');

      const newDoc = await api.uploadDocument(formData);
      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingManual(true);
      const newDoc = await api.createManualReport(manualForm);
      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
      setShowManualModal(false);
    } catch (err) {
      console.error('Failed to manually submit report', err);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!editingExtraction) return;
    try {
      await api.verifyExtraction(
        editingExtraction.id,
        editValue,
        'Er. Rajesh Sarmah (RTDC Lead)'
      );
      // Update local state
      setDocuments((prev) =>
        prev.map((doc) => ({
          ...doc,
          extractions: doc.extractions.map((ext) =>
            ext.id === editingExtraction.id
              ? { ...ext, entity_value: editValue, is_verified: true, verified_by: 'Er. Rajesh Sarmah' }
              : ext
          )
        }))
      );
      if (selectedDoc) {
        setSelectedDoc({
          ...selectedDoc,
          extractions: selectedDoc.extractions.map((ext) =>
            ext.id === editingExtraction.id
              ? { ...ext, entity_value: editValue, is_verified: true, verified_by: 'Er. Rajesh Sarmah' }
              : ext
          )
        });
      }
      setEditingExtraction(null);
    } catch (err) {
      console.error('Failed to verify extraction', err);
    }
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Top Header & Ingestion Actions */}
      <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#ED1C24]" />
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              Document Intelligence Hub &amp; Human Verification
            </h1>
          </div>
          <p className="text-xs text-[#A0AAB2] mt-0.5">
            Automated entity &amp; hazard extraction from Well Completion Reports (WCR) and Daily Drilling Reports (DDR).
          </p>
        </div>

        {/* Action Buttons: Upload or Manual Entry */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2 rounded-lg bg-[#231F20] hover:bg-[#2E343A] border border-[#2E343A] text-white text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#27AE60]" />
            <span>+ Manually Add Report</span>
          </button>

          <label className="px-4 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-lg shadow-[#ED1C24]/20 transition-all">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Ingesting...' : 'Upload File (PDF/TXT)'}</span>
            <input
              type="file"
              accept=".pdf,.txt,.csv,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Main Grid: Document List + Extraction Reviewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Document Ingestion Feed (4 Cols) */}
        <div className="lg:col-span-4 bg-[#1A1D20] border border-[#2E343A] rounded-2xl p-4 flex flex-col space-y-3 h-[600px] shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#2E343A]">
            <span className="text-xs font-bold text-white uppercase">Ingested Reports</span>
            <span className="text-[10px] font-mono text-[#A0AAB2]">{documents.length} Files</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#231F20] border-[#ED1C24] shadow-md'
                      : 'bg-[#15181B] border-[#2E343A] hover:border-[#3A424A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#2E343A] text-[#2D9CDB]">
                      {doc.doc_type}
                    </span>
                    <span className="text-[10px] text-[#27AE60] font-mono flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{(doc.extraction_confidence * 100).toFixed(0)}% Conf</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mt-1.5 truncate">{doc.filename}</h4>
                  <p className="text-[11px] text-[#A0AAB2] line-clamp-2 mt-1">{doc.summary}</p>

                  <div className="flex items-center justify-between text-[10px] text-[#6C7781] mt-2 pt-2 border-t border-[#2E343A]/50 font-mono">
                    <span>{doc.page_count} Pages</span>
                    <span>{doc.extractions?.length || 0} Entities</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Structured Entity Extraction & Engineer Verification (8 Cols) */}
        <div className="lg:col-span-8 bg-[#1A1D20] border border-[#2E343A] rounded-2xl p-5 shadow-2xl flex flex-col space-y-4 h-[600px] overflow-y-auto">
          {selectedDoc ? (
            <div className="space-y-4">
              {/* Document Overview Strip */}
              <div className="p-4 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedDoc.filename}</h3>
                    <div className="text-xs text-[#A0AAB2]">Well: {selectedDoc.well_name || 'OIL Offset'}</div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#27AE60]/20 text-[#27AE60]">
                    Status: {selectedDoc.status}
                  </span>
                </div>
                <p className="text-xs text-[#A0AAB2] leading-relaxed">{selectedDoc.summary}</p>
              </div>

              {/* Extractions Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#A0AAB2] uppercase">
                  <span>Structured Extracted Entities &amp; Citations ({selectedDoc.extractions?.length || 0})</span>
                  <span className="text-[10px] text-[#6C7781]">Human-in-the-Loop Verification</span>
                </div>

                <div className="space-y-2">
                  {selectedDoc.extractions?.map((ext) => (
                    <div
                      key={ext.id}
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        ext.is_verified
                          ? 'bg-[#15181B] border-[#27AE60]/40'
                          : 'bg-[#15181B] border-[#2E343A]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#231F20] text-[#FFC72C] font-bold">
                            {ext.entity_type}
                          </span>
                          <span className="font-bold text-white">{ext.entity_key}</span>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] font-mono">
                          <span className="text-[#2D9CDB] flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>Page {ext.page_number}</span>
                          </span>
                          <span className="text-[#27AE60]">
                            {(ext.confidence * 100).toFixed(0)}% Conf
                          </span>
                        </div>
                      </div>

                      {/* Value Display or Edit Box */}
                      {editingExtraction?.id === ext.id ? (
                        <div className="flex items-center space-x-2 pt-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 bg-[#231F20] border border-[#ED1C24] text-xs text-white rounded p-1.5 focus:outline-none"
                          />
                          <button
                            onClick={handleSaveCorrection}
                            className="px-3 py-1.5 bg-[#27AE60] text-white text-xs font-bold rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingExtraction(null)}
                            className="px-3 py-1.5 bg-[#2E343A] text-white text-xs rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="text-white font-semibold">{ext.entity_value}</div>
                          <button
                            onClick={() => {
                              setEditingExtraction(ext);
                              setEditValue(ext.entity_value);
                            }}
                            className="text-[11px] text-[#A0AAB2] hover:text-[#ED1C24] flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Correct</span>
                          </button>
                        </div>
                      )}

                      {/* Source Text Snippet */}
                      {ext.source_snippet && (
                        <div className="p-2 rounded bg-[#1A1D20] text-[10px] text-[#A0AAB2] italic border-l-2 border-[#2D9CDB]">
                          "{ext.source_snippet}"
                        </div>
                      )}

                      {/* Verification Status */}
                      {ext.is_verified && (
                        <div className="text-[10px] text-[#27AE60] font-mono flex items-center space-x-1 pt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified by {ext.verified_by || 'Drilling Lead'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#A0AAB2]">
              Select a document from the left or click "+ Manually Add Report" to insert a new report.
            </div>
          )}
        </div>
      </div>

      {/* Manual Report Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#231F20] border-b border-[#2E343A] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-[#27AE60]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Manual Well Report Submission &amp; Knowledge Extraction
                </h3>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-[#A0AAB2] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0AAB2] font-semibold block mb-1">Document Title / File Name</label>
                  <input
                    type="text"
                    required
                    value={manualForm.filename}
                    onChange={(e) => setManualForm({ ...manualForm, filename: e.target.value })}
                    className="w-full bg-[#15181B] border border-[#2E343A] rounded-lg p-2 text-white font-mono focus:border-[#ED1C24] focus:outline-none"
                    placeholder="e.g. WCR_OIL_NHK_420_Final.pdf"
                  />
                </div>

                <div>
                  <label className="text-[#A0AAB2] font-semibold block mb-1">Report Document Type</label>
                  <select
                    value={manualForm.doc_type}
                    onChange={(e) => setManualForm({ ...manualForm, doc_type: e.target.value })}
                    className="w-full bg-[#15181B] border border-[#2E343A] rounded-lg p-2 text-white font-semibold focus:outline-none"
                  >
                    <option value="WCR">Well Completion Report (WCR)</option>
                    <option value="DDR">Daily Drilling Report (DDR)</option>
                    <option value="MudLog">Mud Logging Record</option>
                    <option value="DirectionalSurvey">Directional Survey Report</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0AAB2] font-semibold block mb-1">Associate with Well</label>
                  <select
                    value={manualForm.well_id}
                    onChange={(e) => setManualForm({ ...manualForm, well_id: Number(e.target.value) })}
                    className="w-full bg-[#15181B] border border-[#2E343A] rounded-lg p-2 text-white font-semibold focus:outline-none"
                  >
                    {wells.map((w) => (
                      <option key={w.well_id} value={w.well_id}>
                        {w.well_name} ({w.field_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#A0AAB2] font-semibold block mb-1">Formation Horizon</label>
                  <select
                    value={manualForm.formation_name}
                    onChange={(e) => setManualForm({ ...manualForm, formation_name: e.target.value })}
                    className="w-full bg-[#15181B] border border-[#2E343A] rounded-lg p-2 text-white font-semibold focus:outline-none"
                  >
                    <option value="Barail Arenaceous (Sandstone)">Barail Arenaceous (Sandstone)</option>
                    <option value="Barail Argillaceous (Coal-Shale)">Barail Argillaceous (Coal-Shale)</option>
                    <option value="Kopili Shale">Kopili Shale</option>
                    <option value="Tipam Sandstone">Tipam Sandstone</option>
                    <option value="Girujan Clay">Girujan Clay</option>
                    <option value="Sylhet Limestone">Sylhet Limestone</option>
                  </select>
                </div>
              </div>

              {/* Hazard & Remediation Details */}
              <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-3">
                <span className="text-[10px] font-bold text-[#FFC72C] uppercase tracking-wider block">
                  Incident &amp; Field Remediation Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#A0AAB2] block mb-1">Hazard Category</label>
                    <select
                      value={manualForm.hazard_type}
                      onChange={(e) => setManualForm({ ...manualForm, hazard_type: e.target.value })}
                      className="w-full bg-[#1A1D20] border border-[#2E343A] rounded-lg p-2 text-white focus:outline-none"
                    >
                      <option value="Lost Circulation">Lost Circulation</option>
                      <option value="Differential Sticking">Differential Sticking</option>
                      <option value="Mechanical Sticking">Mechanical Sticking</option>
                      <option value="Gas Kick">Gas Kick</option>
                      <option value="Tight Hole">Tight Hole</option>
                      <option value="Torque Spike">Torque Spike</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#A0AAB2] block mb-1">Depth Start (m MD)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualForm.depth_start}
                      onChange={(e) => setManualForm({ ...manualForm, depth_start: Number(e.target.value) })}
                      className="w-full bg-[#1A1D20] border border-[#2E343A] rounded-lg p-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[#A0AAB2] block mb-1">NPT Hours Accrued</label>
                    <input
                      type="number"
                      step="0.5"
                      value={manualForm.npt_hours}
                      onChange={(e) => setManualForm({ ...manualForm, npt_hours: Number(e.target.value) })}
                      className="w-full bg-[#1A1D20] border border-[#2E343A] rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#A0AAB2] block mb-1">Applied Mitigation Strategy</label>
                    <input
                      type="text"
                      value={manualForm.mitigation_strategy}
                      onChange={(e) => setManualForm({ ...manualForm, mitigation_strategy: e.target.value })}
                      className="w-full bg-[#1A1D20] border border-[#2E343A] rounded-lg p-2 text-white"
                      placeholder="e.g. High-Perm LCM Pill"
                    />
                  </div>

                  <div>
                    <label className="text-[#A0AAB2] block mb-1">SOP Standard Reference</label>
                    <input
                      type="text"
                      value={manualForm.sop_reference}
                      onChange={(e) => setManualForm({ ...manualForm, sop_reference: e.target.value })}
                      className="w-full bg-[#1A1D20] border border-[#2E343A] rounded-lg p-2 text-white font-mono"
                      placeholder="e.g. OIL-SOP-DRL-042 Rev.3"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[#A0AAB2] font-semibold block mb-1">Operational Remarks / Extracted Summary</label>
                <textarea
                  rows={2}
                  value={manualForm.operational_remarks}
                  onChange={(e) => setManualForm({ ...manualForm, operational_remarks: e.target.value })}
                  className="w-full bg-[#15181B] border border-[#2E343A] rounded-lg p-2 text-white focus:border-[#ED1C24] focus:outline-none"
                  placeholder="Paste operational comments, mud loss rates, or drilling remarks..."
                />
              </div>

              <div className="p-3 bg-[#231F20] border-t border-[#2E343A] flex items-center justify-between">
                <span className="text-[11px] text-[#A0AAB2]">
                  Will automatically link to Knowledge Graph &amp; Look-Ahead radar.
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#15181B] border border-[#2E343A] text-[#A0AAB2] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingManual}
                    className="px-5 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#D01820] text-white font-bold flex items-center space-x-1.5 shadow-lg shadow-[#ED1C24]/20 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSubmittingManual ? 'Processing & Ingesting...' : 'Save & Extract Report'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
