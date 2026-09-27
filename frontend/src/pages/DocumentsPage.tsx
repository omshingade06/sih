import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { DocumentItem, DocumentExtraction } from '../types';
import {
  FileText,
  Upload,
  CheckCircle2,
  Edit3,
  BookOpen,
  X,
  Layers,
  ShieldAlert,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  Check,
  AlertCircle,
  Download,
  ShieldCheck,
  RotateCcw,
  FileCheck,
  HelpCircle
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { wells, user, userRole } = useApp();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [editingExtraction, setEditingExtraction] = useState<DocumentExtraction | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Document Viewer Controls
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [docSearch, setDocSearch] = useState<string>('');

  // Decision Modal
  const [showDecisionModal, setShowDecisionModal] = useState<boolean>(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION'>('APPROVE');
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [decisionLoading, setDecisionLoading] = useState<boolean>(false);

  // Manual Ingestion Modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    well_id: 2,
    document_title: 'Well Completion Report - Section 8-1/2',
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
      formData.append('uploaded_by', user?.full_name || 'Data Reviewer');

      const newDoc = await api.uploadDocument(formData);
      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!editingExtraction) return;
    try {
      const reviewer = user?.full_name || 'Dr. Ananya Dutta (Senior Geoscientist)';
      await api.correctExtraction({
        extraction_id: editingExtraction.id,
        entity_value: editValue,
        verification_status: 'CORRECTED',
        is_verified: true,
        verified_by: reviewer,
        notes: editNotes
      });

      // Update state
      const updatedExtractions = selectedDoc?.extractions.map((ext) =>
        ext.id === editingExtraction.id
          ? { ...ext, entity_value: editValue, is_verified: true, verification_status: 'CORRECTED', verified_by: reviewer, notes: editNotes }
          : ext
      ) || [];

      if (selectedDoc) {
        setSelectedDoc({ ...selectedDoc, extractions: updatedExtractions });
      }
      setEditingExtraction(null);
    } catch (err) {
      console.error('Failed to save correction', err);
    }
  };

  const handleQuickVerify = async (ext: DocumentExtraction) => {
    try {
      const reviewer = user?.full_name || 'Dr. Ananya Dutta';
      await api.correctExtraction({
        extraction_id: ext.id,
        entity_value: ext.entity_value,
        verification_status: 'VERIFIED',
        is_verified: true,
        verified_by: reviewer
      });

      if (selectedDoc) {
        const updated = selectedDoc.extractions.map((item) =>
          item.id === ext.id ? { ...item, is_verified: true, verification_status: 'VERIFIED', verified_by: reviewer } : item
        );
        setSelectedDoc({ ...selectedDoc, extractions: updated });
      }
    } catch (err) {
      console.error('Failed to verify field', err);
    }
  };

  const handleDecisionSubmit = async () => {
    if (!selectedDoc) return;
    try {
      setDecisionLoading(true);
      const reviewer = user?.full_name || 'Dr. Ananya Dutta';
      await api.verifyDocumentDecision(selectedDoc.id, {
        decision: decisionType,
        reviewer_name: reviewer,
        notes: decisionNotes,
        rejection_reason: rejectionReason
      });

      // Refresh doc
      const updated = await api.getDocument(selectedDoc.id);
      setSelectedDoc(updated);
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setShowDecisionModal(false);
    } catch (err) {
      console.error('Failed to record decision', err);
    } finally {
      setDecisionLoading(false);
    }
  };

  // Group extractions by field group
  const groupedExtractions = {
    WELL_METADATA: selectedDoc?.extractions.filter((e) => e.field_group === 'WELL_METADATA' || e.entity_type === 'WELL_INFO') || [],
    DRILLING_PARAMETERS: selectedDoc?.extractions.filter((e) => e.field_group === 'DRILLING_PARAMETERS' || e.entity_type === 'DRILLING_PARAM' || e.entity_type === 'CASING') || [],
    GEOLOGICAL_INFO: selectedDoc?.extractions.filter((e) => e.field_group === 'GEOLOGICAL_INFO' || e.entity_type === 'FORMATION_TOP') || [],
    DRILLING_EVENTS: selectedDoc?.extractions.filter((e) => e.field_group === 'DRILLING_EVENTS' || e.entity_type === 'HAZARD_EVENT') || [],
    MITIGATION: selectedDoc?.extractions.filter((e) => e.field_group === 'MITIGATION' || e.entity_type === 'MITIGATION') || []
  };

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">
      {/* Top Banner & Upload Trigger */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#ED1C24]/20 border border-[#ED1C24]/30 text-[#ED1C24]">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              Verification Center &amp; AI Document Extraction
            </h1>
            <p className="text-xs text-[#A0AAB2] mt-0.5">
              Split-screen human-in-the-loop review workspace: audit OCR/NLP parsed fields, compare original page citations, and approve historical well data.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <label className="px-4 py-2 rounded-xl bg-[#231F20] hover:bg-[#2E343A] border border-[#2E343A] text-white text-xs font-semibold cursor-pointer flex items-center space-x-2 transition-all">
            <Upload className="w-4 h-4 text-[#ED1C24]" />
            <span>{isUploading ? 'Ingesting PDF...' : 'Upload Report (PDF/Scan)'}</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>

          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold shadow-lg shadow-[#ED1C24]/20 transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Manual Report Entry</span>
          </button>
        </div>
      </div>

      {/* Document Selector Strip */}
      <div className="p-3 bg-[#1A1D20] border border-[#2E343A] rounded-xl flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="text-[10px] uppercase font-bold text-[#6C7781] px-2 shrink-0">Report Queue:</span>
        {documents.map((doc) => {
          const isSelected = selectedDoc?.id === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedDoc(doc);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-2 transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-[#ED1C24] text-white shadow-md'
                  : 'bg-[#121416] text-[#A0AAB2] hover:bg-[#231F20] hover:text-white border border-[#2E343A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{doc.filename}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                  doc.status === 'VERIFIED'
                    ? 'bg-emerald-950 text-[#27AE60]'
                    : doc.status === 'REJECTED'
                    ? 'bg-red-950 text-[#ED1C24]'
                    : 'bg-amber-950 text-[#FFC72C]'
                }`}
              >
                {doc.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Split Screen Workspace */}
      {selectedDoc && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT PANEL: Original Document Viewer & Page Navigator */}
          <div className="lg:col-span-6 bg-[#1A1D20] border border-[#2E343A] rounded-2xl p-4 flex flex-col justify-between shadow-xl min-h-[580px]">
            {/* Viewer Controls */}
            <div className="pb-3 border-b border-[#2E343A] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white truncate max-w-[200px]">{selectedDoc.filename}</span>
                <span className="text-[10px] text-[#A0AAB2] font-mono">({selectedDoc.page_count} Pages)</span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Page Nav */}
                <div className="flex items-center space-x-1 bg-[#121416] px-2 py-1 rounded-lg border border-[#2E343A]">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="text-[#A0AAB2] hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white font-mono text-[11px] px-1">
                    Pg {currentPage} / {selectedDoc.page_count}
                  </span>
                  <button
                    disabled={currentPage >= selectedDoc.page_count}
                    onClick={() => setCurrentPage((p) => Math.min(selectedDoc.page_count, p + 1))}
                    className="text-[#A0AAB2] hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Zoom */}
                <div className="flex items-center space-x-1 bg-[#121416] px-2 py-1 rounded-lg border border-[#2E343A]">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                    className="text-[#A0AAB2] hover:text-white"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-white px-1">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                    className="text-[#A0AAB2] hover:text-white"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => api.exportVerificationReport(selectedDoc.id, 'csv')}
                  title="Export Verified CSV"
                  className="p-1 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-[#A0AAB2] hover:text-white"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Canvas / Rendering Simulation */}
            <div className="flex-1 my-3 bg-[#121416] border border-[#2E343A] rounded-xl p-6 overflow-y-auto font-mono text-xs text-[#A0AAB2] relative">
              {/* Document Header Representation */}
              <div className="border-b border-[#2E343A] pb-3 mb-4 text-center">
                <div className="font-bold text-white text-sm uppercase tracking-wider">
                  Oil India Limited — Real-Time Operations
                </div>
                <div className="text-[11px] text-[#A0AAB2] mt-0.5">
                  {selectedDoc.doc_type} REPORT • WELL: {selectedDoc.well_name || 'OIL OFFSET'} • PAGE {currentPage} OF {selectedDoc.page_count}
                </div>
              </div>

              {/* Page Specific Content Snippet */}
              <div className="space-y-3 leading-relaxed text-[11px]">
                <p className="text-white">
                  <strong>1. OPERATIONAL SUMMARY:</strong> Operations conducted in 8-1/2 section under rotary steerable assembly. Formation entered at programmed depth with lithological confirmation from continuous cutting sampling.
                </p>

                <p>
                  <strong>2. STRATIGRAPHY &amp; TOPS:</strong> Encountered Barail Arenaceous member with blocky sand facies. Pressure baseline recorded at 1.22 S.G. EMW. Standpipe pressure stabilized at 2,180 psi with 2,400 LPM pump flow rate.
                </p>

                <div className="p-3 rounded-lg bg-[#1A1D20] border-l-4 border-l-[#ED1C24] text-white">
                  <span className="text-[10px] text-[#ED1C24] font-bold uppercase block mb-1">
                    CITED SOURCE EVIDENCE (PAGE {currentPage})
                  </span>
                  &ldquo;{selectedDoc.summary || 'Sudden loss of returns observed at 2862m MD in sub-hydrostatic permeable sandstone member. Pit level loss rate peaked at 18 m3/hr. Remediation pill deployed per SOP.'}&rdquo;
                </div>

                <p>
                  <strong>3. REMEDIATION &amp; MITIGATION:</strong> High-permeability LCM blend spotted across thief zone. Total soaking period 4.0 hours. Annulus filled, full circulation re-established with zero residual seepage.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#2E343A] flex justify-between text-[10px] text-[#6C7781]">
                <span>Source Archive: Oil India Limited E&amp;P Repository</span>
                <span>OCR Extractor Engine: v1.4.2 Grounded</span>
              </div>
            </div>

            {/* Document Level Status & Verification Actions */}
            <div className="pt-3 border-t border-[#2E343A] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[#A0AAB2]">Doc Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedDoc.status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-[#27AE60] border border-emerald-500/40'
                      : selectedDoc.status === 'REJECTED'
                      ? 'bg-red-500/20 text-[#ED1C24] border border-red-500/40'
                      : 'bg-amber-500/20 text-[#FFC72C] border border-amber-500/40'
                  }`}
                >
                  {selectedDoc.status}
                </span>
                {selectedDoc.verified_by && (
                  <span className="text-[#6C7781] text-[11px] truncate max-w-[140px]">
                    by {selectedDoc.verified_by}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setDecisionType('REQUEST_CORRECTION');
                    setShowDecisionModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#231F20] hover:bg-[#2E343A] text-white text-xs font-semibold"
                >
                  Request Edits
                </button>
                <button
                  onClick={() => {
                    setDecisionType('REJECT');
                    setShowDecisionModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 text-xs font-semibold"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setDecisionType('APPROVE');
                    setShowDecisionModal(true);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#27AE60] hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve &amp; Freeze</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Structured Extracted Data & Field-Level Correction */}
          <div className="lg:col-span-6 bg-[#1A1D20] border border-[#2E343A] rounded-2xl p-4 flex flex-col justify-between shadow-xl min-h-[580px]">
            <div>
              <div className="pb-3 border-b border-[#2E343A] flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Structured Fields Extracted
                  </h2>
                  <p className="text-[11px] text-[#A0AAB2]">
                    Verify values, confirm units, and cross-reference page citations.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#27AE60]">
                  Confidence: {Math.round(selectedDoc.extraction_confidence * 100)}%
                </span>
              </div>

              {/* Grouped Fields Sections */}
              <div className="my-3 space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {/* 1. Well Metadata */}
                {groupedExtractions.WELL_METADATA.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7781] px-1">
                      1. Well Metadata
                    </div>
                    {groupedExtractions.WELL_METADATA.map((ext) => (
                      <FieldExtractionCard
                        key={ext.id}
                        extraction={ext}
                        onEdit={() => {
                          setEditingExtraction(ext);
                          setEditValue(ext.entity_value);
                          setEditNotes(ext.notes || '');
                        }}
                        onQuickVerify={() => handleQuickVerify(ext)}
                        onJumpPage={(p) => setCurrentPage(p)}
                      />
                    ))}
                  </div>
                )}

                {/* 2. Drilling Parameters */}
                {groupedExtractions.DRILLING_PARAMETERS.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7781] px-1">
                      2. Drilling &amp; Mud Parameters
                    </div>
                    {groupedExtractions.DRILLING_PARAMETERS.map((ext) => (
                      <FieldExtractionCard
                        key={ext.id}
                        extraction={ext}
                        onEdit={() => {
                          setEditingExtraction(ext);
                          setEditValue(ext.entity_value);
                          setEditNotes(ext.notes || '');
                        }}
                        onQuickVerify={() => handleQuickVerify(ext)}
                        onJumpPage={(p) => setCurrentPage(p)}
                      />
                    ))}
                  </div>
                )}

                {/* 3. Geological Information */}
                {groupedExtractions.GEOLOGICAL_INFO.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7781] px-1">
                      3. Geological Formation Tops
                    </div>
                    {groupedExtractions.GEOLOGICAL_INFO.map((ext) => (
                      <FieldExtractionCard
                        key={ext.id}
                        extraction={ext}
                        onEdit={() => {
                          setEditingExtraction(ext);
                          setEditValue(ext.entity_value);
                          setEditNotes(ext.notes || '');
                        }}
                        onQuickVerify={() => handleQuickVerify(ext)}
                        onJumpPage={(p) => setCurrentPage(p)}
                      />
                    ))}
                  </div>
                )}

                {/* 4. Drilling Events & Hazards */}
                {groupedExtractions.DRILLING_EVENTS.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7781] px-1">
                      4. Historical Drilling Events &amp; Hazards
                    </div>
                    {groupedExtractions.DRILLING_EVENTS.map((ext) => (
                      <FieldExtractionCard
                        key={ext.id}
                        extraction={ext}
                        onEdit={() => {
                          setEditingExtraction(ext);
                          setEditValue(ext.entity_value);
                          setEditNotes(ext.notes || '');
                        }}
                        onQuickVerify={() => handleQuickVerify(ext)}
                        onJumpPage={(p) => setCurrentPage(p)}
                      />
                    ))}
                  </div>
                )}

                {/* 5. Mitigations */}
                {groupedExtractions.MITIGATION.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7781] px-1">
                      5. Remediation &amp; Mitigations
                    </div>
                    {groupedExtractions.MITIGATION.map((ext) => (
                      <FieldExtractionCard
                        key={ext.id}
                        extraction={ext}
                        onEdit={() => {
                          setEditingExtraction(ext);
                          setEditValue(ext.entity_value);
                          setEditNotes(ext.notes || '');
                        }}
                        onQuickVerify={() => handleQuickVerify(ext)}
                        onJumpPage={(p) => setCurrentPage(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#2E343A] text-[10px] text-[#6C7781] flex justify-between">
              <span>Traceable to PDF Source Page &amp; Snippet</span>
              <span>Protected Audit Log Enabled</span>
            </div>
          </div>

        </div>
      )}

      {/* Field Correction Modal */}
      {editingExtraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2E343A] pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#ED1C24]" />
                <h3 className="text-xs font-bold text-white uppercase">
                  Edit Extracted Field: {editingExtraction.entity_key}
                </h3>
              </div>
              <button
                onClick={() => setEditingExtraction(null)}
                className="text-[#A0AAB2] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#121416] rounded-xl border border-[#2E343A] text-xs space-y-1">
              <span className="text-[10px] text-[#6C7781] uppercase font-bold">Source Snippet (Pg {editingExtraction.page_number})</span>
              <p className="text-[#A0AAB2] italic">&ldquo;{editingExtraction.source_snippet || 'No raw snippet recorded.'}&rdquo;</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Corrected Value</label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Reviewer Audit Remarks</label>
              <input
                type="text"
                placeholder="e.g. Corrected typo from OCR text; confirmed against litholog"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#2E343A]">
              <button
                type="button"
                onClick={() => setEditingExtraction(null)}
                className="px-3 py-1.5 rounded-xl bg-[#231F20] text-xs text-[#A0AAB2] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="px-4 py-1.5 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-xs font-bold text-white shadow"
              >
                Save Field Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Decision (Approve / Reject) Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2E343A] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#ED1C24]" />
                <h3 className="text-sm font-bold text-white uppercase">
                  {decisionType === 'APPROVE'
                    ? 'Approve & Freeze Document'
                    : decisionType === 'REJECT'
                    ? 'Reject Document Extraction'
                    : 'Request Reviewer Corrections'}
                </h3>
              </div>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="text-[#A0AAB2] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#A0AAB2]">
              {decisionType === 'APPROVE'
                ? 'Approving this document will mark all extracted fields as human-verified and make them authoritative for look-ahead hazard predictions.'
                : 'Please state the reason for rejecting or requesting corrections on this historical record.'}
            </p>

            {decisionType === 'REJECT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Rejection Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scanned pages illegible; formation depths conflict with log"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#121416] border border-red-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Verification Audit Note</label>
              <textarea
                rows={3}
                placeholder="Add audit sign-off details, datum checks, or instructions..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full bg-[#121416] border border-[#2E343A] rounded-xl p-3 text-xs text-white outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#2E343A]">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 rounded-xl bg-[#231F20] text-xs text-[#A0AAB2] hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={decisionLoading}
                onClick={handleDecisionSubmit}
                className={`px-5 py-2 rounded-xl font-bold text-xs text-white shadow-lg ${
                  decisionType === 'APPROVE'
                    ? 'bg-[#27AE60] hover:bg-emerald-600'
                    : decisionType === 'REJECT'
                    ? 'bg-[#ED1C24] hover:bg-[#D01820]'
                    : 'bg-[#FFC72C] text-black hover:bg-amber-400'
                }`}
              >
                {decisionLoading ? 'Submitting...' : `Confirm ${decisionType}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Report Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2E343A] pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#ED1C24]" />
                <h3 className="text-sm font-bold text-white uppercase">
                  Manual Report &amp; Incident Submission
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-[#A0AAB2] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const created = await api.createManualReport(manualForm);
                  setDocuments((prev) => [created, ...prev]);
                  setSelectedDoc(created);
                  setShowManualModal(false);
                } catch (err) {
                  console.error('Failed to create manual report', err);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white">Associated Well</label>
                  <select
                    value={manualForm.well_id}
                    onChange={(e) => setManualForm({ ...manualForm, well_id: parseInt(e.target.value) })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none mt-1"
                  >
                    {wells.map((w) => (
                      <option key={w.well_id} value={w.well_id}>
                        {w.well_name} ({w.UWI})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-white">Report Document Title</label>
                  <input
                    type="text"
                    required
                    value={manualForm.document_title}
                    onChange={(e) => setManualForm({ ...manualForm, document_title: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-white">Doc Type</label>
                  <select
                    value={manualForm.doc_type}
                    onChange={(e) => setManualForm({ ...manualForm, doc_type: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none mt-1"
                  >
                    <option value="WCR">WCR (Completion)</option>
                    <option value="DDR">DDR (Daily Drilling)</option>
                    <option value="MudLog">Mud Log</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-white">Hazard Type</label>
                  <select
                    value={manualForm.hazard_type}
                    onChange={(e) => setManualForm({ ...manualForm, hazard_type: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none mt-1"
                  >
                    <option value="Lost Circulation">Lost Circulation</option>
                    <option value="Differential Sticking">Differential Sticking</option>
                    <option value="Gas Kick">Gas Kick</option>
                    <option value="Tight Hole">Tight Hole</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-white">NPT Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={manualForm.npt_hours}
                    onChange={(e) => setManualForm({ ...manualForm, npt_hours: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-mono outline-none mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white">Start Depth (m MD)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualForm.depth_start}
                    onChange={(e) => setManualForm({ ...manualForm, depth_start: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-mono outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-white">End Depth (m MD)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualForm.depth_end}
                    onChange={(e) => setManualForm({ ...manualForm, depth_end: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-mono outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-white">Remediation SOP &amp; Material</label>
                <input
                  type="text"
                  value={manualForm.mitigation_strategy}
                  onChange={(e) => setManualForm({ ...manualForm, mitigation_strategy: e.target.value })}
                  className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#2E343A]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#231F20] text-xs text-[#A0AAB2] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-xs font-bold text-white shadow"
                >
                  Save &amp; Ingest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface FieldExtractionCardProps {
  extraction: DocumentExtraction;
  onEdit: () => void;
  onQuickVerify: () => void;
  onJumpPage: (page: number) => void;
}

const FieldExtractionCard: React.FC<FieldExtractionCardProps> = ({
  extraction,
  onEdit,
  onQuickVerify,
  onJumpPage
}) => {
  const isVerified = extraction.is_verified;
  return (
    <div className="p-3 rounded-xl bg-[#121416] border border-[#2E343A] hover:border-[#4B5563] transition-all space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-white">{extraction.entity_key}</span>
          <button
            onClick={() => onJumpPage(extraction.page_number)}
            className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A1D20] text-[#2D9CDB] border border-[#2D9CDB]/30 font-mono hover:bg-[#2D9CDB]/20"
          >
            Pg {extraction.page_number}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
              isVerified
                ? 'bg-emerald-950 text-[#27AE60] border border-emerald-800'
                : 'bg-amber-950 text-[#FFC72C] border border-amber-800'
            }`}
          >
            {extraction.verification_status || (isVerified ? 'VERIFIED' : 'NOT_REVIEWED')}
          </span>

          <button
            onClick={onEdit}
            title="Edit value"
            className="p-1 rounded text-[#A0AAB2] hover:text-white hover:bg-[#231F20]"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {!isVerified && (
            <button
              onClick={onQuickVerify}
              title="Quick Verify"
              className="p-1 rounded text-[#27AE60] hover:bg-emerald-950"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="font-mono text-sm font-bold text-white">
        {extraction.entity_value}
      </div>

      {extraction.source_snippet && (
        <div className="text-[10px] text-[#6C7781] italic truncate">
          &ldquo;{extraction.source_snippet}&rdquo;
        </div>
      )}
    </div>
  );
};
