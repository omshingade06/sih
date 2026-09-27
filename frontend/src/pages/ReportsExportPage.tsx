import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DocumentItem, WellSummary } from '../types';
import {
  Download,
  FileText,
  CheckCircle2,
  Database,
  Layers,
  ShieldCheck,
  Compass,
  FileSpreadsheet,
  AlertTriangle,
  History,
  FileCheck
} from 'lucide-react';

export const ReportsExportPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [wells, setWells] = useState<WellSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [docsData, wellsData] = await Promise.all([
          api.getDocuments(),
          api.getWells()
        ]);
        setDocuments(docsData);
        setWells(wellsData);
      } catch (err) {
        console.error('Failed to load export data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportVerification = async (docId: number, format: 'json' | 'csv') => {
    try {
      setDownloadingDocId(docId);
      await api.exportVerificationReport(docId, format);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleExportHazards = async () => {
    await api.exportHazardsCsv();
  };

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#ED1C24]/20 border border-[#ED1C24]/30 text-[#ED1C24]">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              Reports &amp; Data Export Center
            </h1>
            <p className="text-xs text-[#A0AAB2] mt-0.5">
              Export human-verified completion reports, structured extraction CSV datasets, well summaries, and historical hazard logs.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportHazards}
          className="px-4 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold shadow-lg shadow-[#ED1C24]/20 flex items-center space-x-2 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export All Historical Hazards (.CSV)</span>
        </button>
      </div>

      {/* Export Categories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] space-y-3">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-[#27AE60]" />
            <h3 className="font-bold text-white text-sm">Verified Completion Reports</h3>
          </div>
          <p className="text-xs text-[#A0AAB2] leading-relaxed">
            Download full field-level verification audit certificates with original and corrected values and reviewer timestamps.
          </p>
          <div className="pt-2">
            <span className="text-xs font-mono text-[#27AE60]">
              {documents.filter((d) => d.status === 'VERIFIED').length} Verified Reports Ready
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] space-y-3">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-[#ED1C24]" />
            <h3 className="font-bold text-white text-sm">Historical Hazard Ledger</h3>
          </div>
          <p className="text-xs text-[#A0AAB2] leading-relaxed">
            Export all loss circulation, differential sticking, and kick incidents across Upper Assam Basin offset wells.
          </p>
          <div className="pt-2">
            <button
              onClick={handleExportHazards}
              className="text-xs text-[#ED1C24] font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Download CSV Dataset</span>
            </button>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] space-y-3">
          <div className="flex items-center space-x-2.5">
            <Compass className="w-5 h-5 text-[#2D9CDB]" />
            <h3 className="font-bold text-white text-sm">Well Registry Summary</h3>
          </div>
          <p className="text-xs text-[#A0AAB2] leading-relaxed">
            Metadata summary for all 25 registered wells, trajectory types, coordinates, and operational statuses.
          </p>
          <div className="pt-2">
            <span className="text-xs font-mono text-[#2D9CDB]">
              {wells.length} Wells in Portfolio
            </span>
          </div>
        </div>
      </div>

      {/* Verified Documents Table for Individual Export */}
      <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl shadow-xl overflow-hidden space-y-2">
        <div className="p-4 border-b border-[#2E343A] flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Human-Verified Document Reports Available for Export
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15181B] border-b border-[#2E343A] text-[#A0AAB2] text-[10px] font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-5">Document Title / File</th>
                <th className="p-3.5">Associated Well</th>
                <th className="p-3.5">Verification Status</th>
                <th className="p-3.5">Reviewer Sign-off</th>
                <th className="p-3.5 text-right pr-5">Export Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E343A]/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#231F20] transition-colors">
                  <td className="p-3.5 pl-5">
                    <div className="font-bold text-white">{doc.filename}</div>
                    <div className="text-[10px] text-[#A0AAB2] font-mono">{doc.doc_type} • {doc.page_count} Pages</div>
                  </td>
                  <td className="p-3.5 text-white font-medium">
                    {doc.well_name || 'OIL Offset Well'}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        doc.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-[#27AE60] border border-emerald-500/40'
                          : doc.status === 'REJECTED'
                          ? 'bg-red-500/20 text-[#ED1C24] border border-red-500/40'
                          : 'bg-amber-500/20 text-[#FFC72C] border border-amber-500/40'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#A0AAB2]">
                    {doc.verified_by || 'Awaiting Reviewer Sign-off'}
                  </td>
                  <td className="p-3.5 text-right pr-5">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleExportVerification(doc.id, 'csv')}
                        disabled={downloadingDocId === doc.id}
                        className="px-3 py-1.5 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-white font-semibold text-xs flex items-center space-x-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#ED1C24]" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
