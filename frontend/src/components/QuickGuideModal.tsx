import React from 'react';
import {
  X,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Activity,
  Layers,
  ShieldCheck,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#231F20] border-b border-[#2E343A] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#ED1C24]/20 text-[#ED1C24]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                eRTMAC-NWIS Analysis &amp; Dashboard Quick Guide
              </h3>
              <p className="text-[11px] text-[#A0AAB2]">
                How to read, analyze, and make drilling decisions in 3 simple steps.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A0AAB2] hover:text-white hover:bg-[#2E343A] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Step-by-Step Decision Flow */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center space-x-1.5 mb-3">
              <Compass className="w-4 h-4 text-[#ED1C24]" />
              <span>3-Step Quick Analysis Workflow</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1.5">
                <div className="flex items-center space-x-2 text-[#2D9CDB] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#2D9CDB]/20 flex items-center justify-center text-[11px]">1</span>
                  <span>Check Current Status</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] leading-relaxed">
                  Look at <strong>Bit Depth</strong> &amp; <strong>Formation</strong> on the top bar. Normal drilling shows green telemetry gauges.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1.5">
                <div className="flex items-center space-x-2 text-[#FFC72C] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#FFC72C]/20 flex items-center justify-center text-[11px]">2</span>
                  <span>Scan 50m Ahead</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] leading-relaxed">
                  Check the <strong>Look-Ahead Risk Badge</strong>. If &gt;60% (High/Critical), nearby offset wells had trouble in the upcoming rock formation.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1.5">
                <div className="flex items-center space-x-2 text-[#27AE60] font-bold">
                  <span className="w-5 h-5 rounded-full bg-[#27AE60]/20 flex items-center justify-center text-[11px]">3</span>
                  <span>Follow Mitigation SOP</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] leading-relaxed">
                  Click <strong>"Proactive Alerts"</strong> to view the exact field-proven recipe (LCM Pill, pump adjustments) before drilling into the hazard.
                </p>
              </div>
            </div>
          </div>

          {/* Key Parameters Demystified */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider flex items-center space-x-1.5 mb-3">
              <Activity className="w-4 h-4 text-[#27AE60]" />
              <span>Drilling Indicators Explained Simply</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Standpipe Pressure (SPP)</span>
                  <span className="text-[10px] text-[#2D9CDB] font-mono">psi</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] mt-1">
                  Pressure pushing mud downhole. A sudden <strong>drop</strong> means mud is leaking into fractured rock (Lost Circulation). A <strong>spike</strong> means a blocked nozzle or stuck pipe.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Flow Out %</span>
                  <span className="text-[10px] text-[#2D9CDB] font-mono">% return</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] mt-1">
                  Percentage of drilling mud returning to surface. Normal is 95–100%. If it drops to &lt;70%, you are losing expensive mud into the formation.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Rate of Penetration (ROP)</span>
                  <span className="text-[10px] text-[#2D9CDB] font-mono">m/hr</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] mt-1">
                  How fast the drill bit is moving forward. A sudden rapid increase is a "drilling break" that may indicate a high-pressure gas zone.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Stratigraphic Depth (&eta;_norm)</span>
                  <span className="text-[10px] text-[#2D9CDB] font-mono">0.0 to 1.0</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] mt-1">
                  Normalizes depth across tilted formations so 0.0 is always the top of the formation and 1.0 is the base, ensuring accurate comparison with offset wells.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demo Tips */}
          <div className="p-4 rounded-xl bg-[#231F20] border border-[#ED1C24]/30 space-y-2">
            <div className="flex items-center space-x-2 text-[#ED1C24] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Interactive Demonstration Tips</span>
            </div>
            <ul className="text-[11px] text-[#A0AAB2] space-y-1.5 list-disc list-inside">
              <li>Use the <strong>"Simulate Loss Event"</strong> button on the Command Center to test real-time anomaly alerts.</li>
              <li>Toggle between <strong>Executive Summary</strong> and <strong>Detailed Technical Tracks</strong> at any time.</li>
              <li>Ask natural questions in <strong>"Ask NWIS Copilot"</strong> (e.g. <em>"Why are we at risk of circulation loss?"</em>).</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#231F20] border-t border-[#2E343A] flex items-center justify-between">
          <span className="text-[11px] text-[#6C7781]">Oil India Limited | RTDC Proactive Decision Support</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold transition-all"
          >
            Got It, Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
