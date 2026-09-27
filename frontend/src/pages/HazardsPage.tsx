import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  AlertTriangle,
  ShieldCheck,
  BookOpen,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  Radio,
  FileText,
  Compass,
  ArrowRight
} from 'lucide-react';

export const HazardsPage: React.FC = () => {
  const {
    activeWell,
    activeWellId,
    liveTelemetry,
    lookaheadWindow,
    setLookaheadWindow,
    lookaheadSummary,
    setSelectedAlertModal,
    alerts
  } = useApp();

  const [predictionsData, setPredictionsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPredictions = async () => {
    if (!activeWellId) return;
    try {
      setLoading(true);
      const res = await api.getHazardPredictions(activeWellId, lookaheadWindow);
      setPredictionsData(res);
    } catch (err) {
      console.error('Failed to load hazard predictions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [activeWellId, lookaheadWindow, liveTelemetry?.measured_depth]);

  const currentMd = liveTelemetry?.measured_depth ?? activeWell?.current_bit_depth_md ?? 2845.0;

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Top Banner with Window Configuration */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E343A] pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-[#ED1C24]" />
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                Proactive Look-Ahead Radar &amp; Hazard Decision Support
              </h1>
            </div>
            <p className="text-xs text-[#A0AAB2] mt-0.5">
              Proactively evaluating future interval from current bit depth (<strong className="text-white">{currentMd.toFixed(1)}m</strong>) to <strong className="text-white">{(currentMd + lookaheadWindow).toFixed(1)}m MD</strong>.
            </p>
          </div>

          {/* Lookahead Window Slider */}
          <div className="flex items-center space-x-3 bg-[#15181B] px-4 py-2 rounded-xl border border-[#2E343A]">
            <span className="text-xs text-[#A0AAB2] font-semibold">Look-Ahead Distance (ΔZ):</span>
            <span className="text-sm font-mono font-bold text-[#ED1C24]">{lookaheadWindow} m</span>
            <input
              type="range"
              min="20"
              max="150"
              step="10"
              value={lookaheadWindow}
              onChange={(e) => setLookaheadWindow(Number(e.target.value))}
              className="accent-[#ED1C24] cursor-pointer w-28"
            />
          </div>
        </div>

        {/* Global Risk Explainability Card */}
        <div className="p-4 rounded-xl bg-[#231F20] border border-[#ED1C24]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-[#FFC72C] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Factor Risk Synthesis (Why Risk Is {lookaheadSummary?.overall_risk_category}):</span>
            </div>
            <p className="text-xs text-[#F5F6F8] leading-relaxed">
              {lookaheadSummary?.why_risk_increased}
            </p>
          </div>

          <div className="text-right shrink-0 bg-[#15181B] p-3 rounded-lg border border-[#2E343A]">
            <div className="text-[10px] text-[#A0AAB2] uppercase">Composite Risk Score</div>
            <div className="text-2xl font-mono font-black text-[#ED1C24]">
              {((lookaheadSummary?.overall_risk_score || 0.82) * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-orange-400 font-bold uppercase">{lookaheadSummary?.overall_risk_category} RISK</div>
          </div>
        </div>
      </div>

      {/* 3-Step Engineer Action Plan */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#27AE60]" />
          <span>Recommended 3-Step Field Action Plan for Upcoming Horizon</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1.5">
            <div className="text-[#2D9CDB] font-bold flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-[#2D9CDB]/20 flex items-center justify-center text-[10px]">1</span>
              <span>Before Entering 2,860m</span>
            </div>
            <p className="text-white font-medium leading-relaxed">
              Pre-treat active mud system with 15 ppb fine CaCO3 and stage 25 m³ High-Perm LCM Pill in the reserve tank.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#15181B] border border-[#FFC72C]/40 space-y-1.5">
            <div className="text-[#FFC72C] font-bold flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-[#FFC72C]/20 flex items-center justify-center text-[10px]">2</span>
              <span>While Drilling (2,860m – 2,872m)</span>
            </div>
            <p className="text-white font-medium leading-relaxed">
              Lower flow rate from 2,200 to 1,600 LPM to minimize ECD surge and monitor Flow Out % continuously.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#15181B] border border-[#ED1C24]/40 space-y-1.5">
            <div className="text-[#ED1C24] font-bold flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-[#ED1C24]/20 flex items-center justify-center text-[10px]">3</span>
              <span>If Losses Occur (&gt;5 m³/hr)</span>
            </div>
            <p className="text-white font-medium leading-relaxed">
              Execute SOP <strong>OIL-SOP-DRL-042 Rev.3</strong>: Spot LCM pill across bit, pull back 15m into casing shoe, and soak 4.0h.
            </p>
          </div>
        </div>
      </div>

      {/* Structured Explainability Cards: WHAT, WHY, WHERE, WHEN, EVIDENCE, MITIGATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
          <span>Detected Geological &amp; Operational Hazards in Next {lookaheadWindow}m</span>
          <span className="text-[#A0AAB2] font-mono">
            {predictionsData?.hazards?.length || lookaheadSummary?.detected_hazards?.length || 1} Hazards
          </span>
        </div>

        {(predictionsData?.hazards || lookaheadSummary?.detected_hazards || []).map((hz: any, idx: number) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] hover:border-[#ED1C24]/60 transition-all space-y-4 shadow-xl"
          >
            {/* Header: Hazard & Severity */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E343A] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#ED1C24]/20 border border-[#ED1C24] flex items-center justify-center text-[#ED1C24]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{hz.hazard_type}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ED1C24]/20 text-[#ED1C24] border border-[#ED1C24]/40 font-bold">
                      {hz.severity || 'CRITICAL'} SEVERITY
                    </span>
                  </h3>
                  <span className="text-xs text-[#A0AAB2]">
                    Target Horizon: <strong className="text-white">{hz.formation_name || 'Barail Sandstone'}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-[#A0AAB2]">Predicted Interval:</div>
                <div className="text-sm font-bold text-orange-400">
                  {hz.depth_start}m – {hz.depth_end}m MD
                </div>
              </div>
            </div>

            {/* 6-Dimension Explainability Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* WHAT */}
              <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1">
                <div className="text-[10px] font-bold text-[#2D9CDB] uppercase tracking-wider">WHAT</div>
                <div className="font-semibold text-white">Loss of Drilling Fluid</div>
                <p className="text-[11px] text-[#A0AAB2]">
                  Uncontrolled seepage into naturally fractured sub-hydrostatic reservoir sandstone.
                </p>
              </div>

              {/* WHY */}
              <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1">
                <div className="text-[10px] font-bold text-[#FFC72C] uppercase tracking-wider">WHY</div>
                <div className="font-semibold text-white">High Offset Occurrence</div>
                <p className="text-[11px] text-[#A0AAB2]">
                  3 of 4 nearest offset wells experienced 30–45 m³ total mud losses in this exact member.
                </p>
              </div>

              {/* WHERE */}
              <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1">
                <div className="text-[10px] font-bold text-[#27AE60] uppercase tracking-wider">WHERE</div>
                <div className="font-semibold text-white">{hz.depth_start}m – {hz.depth_end}m MD</div>
                <p className="text-[11px] text-[#A0AAB2]">
                  TVDSS: ~2,550m Sub-Sea | Stratigraphic position: 75% into Barail Sandstone.
                </p>
              </div>

              {/* WHEN */}
              <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1">
                <div className="text-[10px] font-bold text-[#ED1C24] uppercase tracking-wider">WHEN</div>
                <div className="font-semibold text-white">Next 15m of Drilling</div>
                <p className="text-[11px] text-[#A0AAB2]">
                  Estimated ~45 minutes at current average penetration rate of 20 m/hr.
                </p>
              </div>

              {/* EVIDENCE */}
              <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1">
                <div className="text-[10px] font-bold text-[#A0AAB2] uppercase tracking-wider">EVIDENCE</div>
                <div className="font-semibold text-white">Offset NHK-388 (92% Match)</div>
                <p className="text-[11px] text-[#A0AAB2]">
                  WCR Page 14: Encountered 45 m³ loss at 2,865m. Total NPT: 18.5 hours.
                </p>
              </div>

              {/* MITIGATION */}
              <div className="p-3 rounded-xl bg-[#231F20] border border-[#27AE60]/40 space-y-1">
                <div className="text-[10px] font-bold text-[#27AE60] uppercase tracking-wider">MITIGATION</div>
                <div className="font-semibold text-[#27AE60] truncate">{hz.mitigation_strategy || 'High-Perm LCM Pill'}</div>
                <p className="text-[11px] text-[#A0AAB2]">
                  SOP Reference: <strong>{hz.sop_reference || 'OIL-SOP-DRL-042 Rev.3'}</strong>
                </p>
              </div>
            </div>

            {/* Action Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#2E343A]">
              <span className="text-xs text-[#A0AAB2]">
                Proactive preparation saves an estimated <strong className="text-[#27AE60] font-mono">18.5 hours</strong> of non-productive rig time.
              </span>

              <button
                onClick={() => {
                  const alert = alerts.find((a) => a.hazard_type === hz.hazard_type) || alerts[0];
                  if (alert) setSelectedAlertModal(alert);
                }}
                className="px-5 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#ED1C24]/20 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Open &amp; Acknowledge Mitigation SOP</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
