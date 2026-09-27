import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Compass,
  FileText,
  Network,
  ShieldCheck,
  ChevronRight,
  Database,
  Layers,
  Search,
  Zap,
  TrendingDown,
  Cpu,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#121416] text-[#F5F6F8] selection:bg-[#ED1C24] selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-[#2E343A] bg-[#1A1D20]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-[#ED1C24] flex items-center justify-center font-black text-white text-base tracking-wider shadow-lg shadow-[#ED1C24]/20">
            OIL
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight">eRTMAC-NWIS</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#ED1C24]/20 text-[#ED1C24] border border-[#ED1C24]/40 font-bold">
                Oil India Limited
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg bg-[#231F20] hover:bg-[#2E343A] border border-[#2E343A] text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-[#ED1C24]" />
            <span>Secure Sign In</span>
          </Link>
          <Link
            to="/app"
            className="px-5 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-[#ED1C24]/25 transition-all"
          >
            <span>Launch NWIS Command Center</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#ED1C24]/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#1A1D20] border border-[#2E343A] text-xs text-[#A0AAB2] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#27AE60] animate-ping" />
          <span className="font-semibold text-white">Next-Gen Real-Time Decision Support</span>
          <span>•</span>
          <span className="font-mono text-[#ED1C24]">Smart India Hackathon</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          From Historical Drilling Data to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ED1C24] via-orange-400 to-[#FFC72C]">
            Proactive Risk Intelligence.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#A0AAB2] max-w-3xl mx-auto leading-relaxed">
          <strong className="text-white font-semibold">eRTMAC-NWIS</strong> connects nearby-well knowledge, geological context, and real-time drilling telemetry to help engineers identify potential hazards <span className="text-white underline decoration-[#ED1C24] decoration-2">before they are encountered</span>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/app"
            className="px-8 py-3.5 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-sm font-bold flex items-center space-x-2 shadow-2xl shadow-[#ED1C24]/30 hover:scale-105 transition-all"
          >
            <span>Launch NWIS Command Center</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            to="/app/ask-nwis"
            className="px-6 py-3.5 rounded-xl bg-[#1A1D20] hover:bg-[#231F20] border border-[#2E343A] text-white text-sm font-semibold flex items-center space-x-2 transition-all"
          >
            <span>Ask NWIS AI Copilot</span>
          </Link>
        </div>

        {/* Hero KPI Stat Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-[#1A1D20]/80 border border-[#2E343A] backdrop-blur text-left">
            <div className="text-2xl font-black font-mono text-[#27AE60]">50m</div>
            <div className="text-xs font-bold text-white mt-0.5">Look-Ahead Horizon</div>
            <div className="text-[11px] text-[#A0AAB2] mt-1">Proactive horizon hazard scanning</div>
          </div>
          <div className="p-4 rounded-xl bg-[#1A1D20]/80 border border-[#2E343A] backdrop-blur text-left">
            <div className="text-2xl font-black font-mono text-[#ED1C24]">78%</div>
            <div className="text-xs font-bold text-white mt-0.5">NPT Reduction Potential</div>
            <div className="text-[11px] text-[#A0AAB2] mt-1">Preventing stuck pipe &amp; losses</div>
          </div>
          <div className="p-4 rounded-xl bg-[#1A1D20]/80 border border-[#2E343A] backdrop-blur text-left">
            <div className="text-2xl font-black font-mono text-[#2D9CDB]">4-Factor</div>
            <div className="text-xs font-bold text-white mt-0.5">Similarity Engine (S_ij)</div>
            <div className="text-[11px] text-[#A0AAB2] mt-1">Spatial, Trajectory, Stratigraphy, Mud</div>
          </div>
          <div className="p-4 rounded-xl bg-[#1A1D20]/80 border border-[#2E343A] backdrop-blur text-left">
            <div className="text-2xl font-black font-mono text-[#FFC72C]">0%</div>
            <div className="text-xs font-bold text-white mt-0.5">AI Hallucination</div>
            <div className="text-[11px] text-[#A0AAB2] mt-1">Strict grounded historical citations</div>
          </div>
        </div>
      </section>

      {/* Core Challenges Section */}
      <section className="py-16 px-6 bg-[#15181B] border-y border-[#2E343A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#ED1C24]">The Challenge</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Historical Drilling Knowledge Is Trapped in Unstructured Silos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#1A1D20] border border-[#2E343A]">
              <FileText className="w-8 h-8 text-[#ED1C24] mb-4" />
              <h3 className="text-base font-bold text-white">Fragmented Records</h3>
              <p className="text-xs text-[#A0AAB2] mt-2 leading-relaxed">
                Critical past experiences are buried across hundreds of Well Completion Reports (WCR), Daily Drilling Reports (DDR), mud logs, and scanned legacy PDFs.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-[#1A1D20] border border-[#2E343A]">
              <AlertTriangle className="w-8 h-8 text-[#FFC72C] mb-4" />
              <h3 className="text-base font-bold text-white">Reactive, Costly Hazards</h3>
              <p className="text-xs text-[#A0AAB2] mt-2 leading-relaxed">
                Drilling crews only react after lost circulation, differential sticking, or kicks happen, costing millions in Non-Productive Time (NPT).
              </p>
            </div>
            <div className="p-6 rounded-xl bg-[#1A1D20] border border-[#2E343A]">
              <Activity className="w-8 h-8 text-[#2D9CDB] mb-4" />
              <h3 className="text-base font-bold text-white">Isolated Telemetry Streams</h3>
              <p className="text-xs text-[#A0AAB2] mt-2 leading-relaxed">
                Real-time surface &amp; downhole telemetry is monitored in isolation without automated correlation to historical offset well precedence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Workflow Pipeline Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#27AE60]">End-to-End System</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            How eRTMAC-NWIS Powers Decision Support
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#ED1C24]/20 flex items-center justify-center font-mono font-bold text-[#ED1C24] text-xs">
              01
            </div>
            <h4 className="font-bold text-sm text-white">Document Ingestion</h4>
            <p className="text-xs text-[#A0AAB2]">
              OCR and NLP extraction across WCRs, DDRs, and mud logs extracting casing, formation tops, and incidents.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFC72C]/20 flex items-center justify-center font-mono font-bold text-[#FFC72C] text-xs">
              02
            </div>
            <h4 className="font-bold text-sm text-white">Offset Similarity (S_ij)</h4>
            <p className="text-xs text-[#A0AAB2]">
              Weighted ranking combining Spatial, Trajectory, Stratigraphic formation overlap, and Mud system chemistry.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#2D9CDB]/20 flex items-center justify-center font-mono font-bold text-[#2D9CDB] text-xs">
              03
            </div>
            <h4 className="font-bold text-sm text-white">Look-Ahead Engine</h4>
            <p className="text-xs text-[#A0AAB2]">
              Evaluates future interval Z &rarr; Z+&Delta;Z normalized by geological horizon (&eta;_norm &isin; [0, 1]).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#27AE60]/20 flex items-center justify-center font-mono font-bold text-[#27AE60] text-xs">
              04
            </div>
            <h4 className="font-bold text-sm text-white">Grounded Mitigations</h4>
            <p className="text-xs text-[#A0AAB2]">
              Retrieves proven field mitigation recipes (LCM pills, SOPs) with zero hallucinated procedures.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Compliance Banner */}
      <section className="py-8 px-6 bg-[#231F20] border-t border-[#2E343A]">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <Lock className="w-6 h-6 text-[#27AE60] shrink-0" />
          <div className="text-xs text-[#A0AAB2]">
            <strong className="text-white">Safety &amp; Operational Compliance:</strong> eRTMAC-NWIS operates strictly as an intelligent decision-support advisory system. It does not autonomously modify rig controls, pump rates, or mud weights. All actions require qualified drilling engineer review.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#2E343A] bg-[#15181B] py-6 px-6 text-center text-xs text-[#6C7781]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#ED1C24]"></span>
            <span className="font-bold text-[#F5F6F8]">Oil India Limited (OIL)</span>
            <span>—</span>
            <span>Real Time Data Acquisition Center (RTDC)</span>
          </div>
          <div className="font-mono text-[11px]">
            eRTMAC-NWIS Functional Prototype (Upper Assam Basin)
          </div>
        </div>
      </footer>
    </div>
  );
};
