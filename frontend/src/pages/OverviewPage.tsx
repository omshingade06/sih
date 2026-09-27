import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TelemetryGauges } from '../components/TelemetryGauges';
import { Link } from 'react-router-dom';
import {
  Compass,
  AlertTriangle,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  ChevronRight,
  ShieldCheck,
  Radio,
  Sparkles,
  CheckCircle2,
  Sliders,
  Eye,
  Layers,
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';
import { QuickGuideModal } from '../components/QuickGuideModal';

export const OverviewPage: React.FC = () => {
  const {
    activeWell,
    liveTelemetry,
    simulatorRunning,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    triggerAnomaly,
    lookaheadSummary,
    lookaheadWindow,
    setLookaheadWindow,
    alerts,
    setSelectedAlertModal
  } = useApp();

  const [viewMode, setViewMode] = useState<'EXECUTIVE' | 'DETAILED'>('EXECUTIVE');
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const currentMd = liveTelemetry?.measured_depth ?? activeWell?.current_bit_depth_md ?? 2845.0;
  const currentTvd = liveTelemetry?.true_vertical_depth ?? activeWell?.current_bit_depth_tvd ?? 2680.0;
  const riskCategory = lookaheadSummary?.overall_risk_category ?? 'HIGH';
  const riskScore = lookaheadSummary?.overall_risk_score ?? 0.82;

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* 1. Top Executive AI Drilling Situation Briefing */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1A1D20] via-[#231F20] to-[#1A1D20] border border-[#2E343A] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ED1C24]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2E343A]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#ED1C24] text-white shadow-lg shadow-[#ED1C24]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-wide">
                  AI Real-Time Drilling Situation Briefing
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#27AE60]/20 text-[#27AE60] border border-[#27AE60]/40 font-bold">
                  LIVE STREAM ACTIVE
                </span>
              </div>
              <p className="text-xs text-[#A0AAB2]">
                Instant plain-English operational digest for well <strong className="text-white">{activeWell?.well_name || 'OIL-DEMO-001'}</strong> ({activeWell?.field_name} Field)
              </p>
            </div>
          </div>

          {/* View Mode Switcher (Executive vs Detailed) */}
          <div className="flex items-center space-x-2">
            <div className="bg-[#15181B] border border-[#2E343A] rounded-xl p-1 flex items-center">
              <button
                onClick={() => setViewMode('EXECUTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  viewMode === 'EXECUTIVE'
                    ? 'bg-[#ED1C24] text-white shadow-md'
                    : 'text-[#A0AAB2] hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Executive View (Easy)</span>
              </button>
              <button
                onClick={() => setViewMode('DETAILED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  viewMode === 'DETAILED'
                    ? 'bg-[#ED1C24] text-white shadow-md'
                    : 'text-[#A0AAB2] hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Engineering View</span>
              </button>
            </div>

            <button
              onClick={() => setShowGuideModal(true)}
              className="p-2 rounded-xl bg-[#231F20] border border-[#2E343A] text-[#2D9CDB] hover:text-white transition-all shadow-md"
              title="Dashboard Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Plain-English 3-Point Operational Digest */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
          {/* Point 1: Current State */}
          <div className="p-3.5 rounded-xl bg-[#15181B]/90 border border-[#2E343A] space-y-1.5">
            <div className="flex items-center space-x-2 text-[#27AE60] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. CURRENT STATUS</span>
            </div>
            <p className="text-white font-semibold">
              Drilling normally at <span className="text-[#2D9CDB] font-mono">{currentMd.toFixed(1)} m</span> (TVD: {currentTvd.toFixed(1)} m) in <strong className="text-white">{lookaheadSummary?.current_formation || 'Barail Sandstone'}</strong>.
            </p>
            <div className="text-[11px] text-[#A0AAB2]">All surface parameters (SPP, WOB, Flow) within safe baseline limits.</div>
          </div>

          {/* Point 2: Upcoming Hazard */}
          <div className="p-3.5 rounded-xl bg-[#15181B]/90 border border-orange-500/40 space-y-1.5">
            <div className="flex items-center space-x-2 text-orange-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>2. UPCOMING HAZARD IN ~15 METERS</span>
            </div>
            <p className="text-white font-semibold">
              <strong className="text-[#ED1C24]">{(riskScore * 100).toFixed(0)}% Probability of Mud Loss</strong> expected between <span className="text-orange-400 font-mono">2,860m – 2,872m MD</span>.
            </p>
            <div className="text-[11px] text-[#A0AAB2]">3 nearby offset wells encountered major losses (up to 45 m³ mud) in this zone.</div>
          </div>

          {/* Point 3: Immediate Recommendation */}
          <div className="p-3.5 rounded-xl bg-[#15181B]/90 border border-[#2D9CDB]/40 space-y-1.5">
            <div className="flex items-center space-x-2 text-[#2D9CDB] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>3. RECOMMENDED ACTION RIGHT NOW</span>
            </div>
            <p className="text-white font-semibold">
              Mix <strong className="text-[#2D9CDB]">25 m³ High-Perm LCM Pill</strong> and reduce flow rate to 1,600 LPM prior to 2,860m.
            </p>
            <div className="pt-1">
              <button
                onClick={() => {
                  if (activeAlerts.length > 0) setSelectedAlertModal(activeAlerts[0]);
                }}
                className="text-[11px] font-bold text-[#ED1C24] hover:underline flex items-center space-x-1"
              >
                <span>Open Full SOP OIL-SOP-DRL-042</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Simulator Bar */}
        <div className="mt-4 pt-3 border-t border-[#2E343A]/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[#A0AAB2] text-[11px]">Interactive Simulator Controls:</span>
            {simulatorRunning ? (
              <button
                onClick={pauseSimulation}
                className="px-3 py-1 rounded-lg bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-white font-semibold flex items-center space-x-1.5"
              >
                <Pause className="w-3 h-3" />
                <span>Pause Bit</span>
              </button>
            ) : (
              <button
                onClick={startSimulation}
                className="px-3 py-1 rounded-lg bg-[#27AE60] text-white font-bold flex items-center space-x-1.5"
              >
                <Play className="w-3 h-3" />
                <span>Resume Drilling</span>
              </button>
            )}

            <button
              onClick={resetSimulation}
              className="px-3 py-1 rounded-lg bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-white font-semibold flex items-center space-x-1.5"
              title="Reset depth to 2,845m"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Depth</span>
            </button>
          </div>

          <button
            onClick={() => triggerAnomaly('Lost Circulation')}
            className="px-3.5 py-1.5 rounded-lg bg-[#ED1C24] hover:bg-[#D01820] text-white font-bold flex items-center space-x-1.5 shadow-md shadow-[#ED1C24]/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Mud Loss Event</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Status Cards (Executive Gauges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bit Depth & Penetration */}
        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-md space-y-1.5">
          <div className="flex items-center justify-between text-[#A0AAB2] text-[10px] font-bold uppercase">
            <span>Bit Depth Position</span>
            <span className="text-[#27AE60]">ON BOTTOM</span>
          </div>
          <div className="text-2xl font-black font-mono text-white flex items-baseline space-x-1">
            <span>{currentMd.toFixed(1)}</span>
            <span className="text-xs text-[#A0AAB2]">m MD</span>
          </div>
          <div className="text-xs text-[#A0AAB2] flex items-center justify-between pt-1 border-t border-[#2E343A]">
            <span>Vertical Depth:</span>
            <span className="text-white font-mono font-semibold">{currentTvd.toFixed(1)} m TVD</span>
          </div>
        </div>

        {/* Current Geological Layer */}
        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-md space-y-1.5">
          <div className="text-[#A0AAB2] text-[10px] font-bold uppercase">Geological Horizon</div>
          <div className="text-base font-bold text-[#2D9CDB] truncate">
            {lookaheadSummary?.current_formation || 'Barail Sandstone'}
          </div>
          <div className="text-xs text-[#A0AAB2] flex items-center justify-between pt-1 border-t border-[#2E343A]">
            <span>Layer Position:</span>
            <span className="text-white font-mono font-semibold">
              {((lookaheadSummary?.current_eta_norm || 0.45) * 100).toFixed(0)}% into layer
            </span>
          </div>
        </div>

        {/* Look-Ahead Risk Level */}
        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#ED1C24]/50 bg-[#ED1C24]/5 shadow-md space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase">
            <span className="text-[#ED1C24]">Upcoming 50m Risk</span>
            <span className="text-xs font-mono font-black text-[#ED1C24]">
              {(riskScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-base font-black text-white flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-[#ED1C24]" />
            <span>{riskCategory} LEVEL</span>
          </div>
          <div className="text-xs text-[#A0AAB2] flex items-center justify-between pt-1 border-t border-[#2E343A]">
            <span>Hazard Zone:</span>
            <span className="text-orange-400 font-mono font-semibold">2,860m–2,872m</span>
          </div>
        </div>

        {/* Active Proactive Alarms */}
        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-md space-y-1.5">
          <div className="flex items-center justify-between text-[#A0AAB2] text-[10px] font-bold uppercase">
            <span>Proactive Hazard Alerts</span>
            <Radio className="w-3.5 h-3.5 text-[#ED1C24] animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-[#ED1C24]">
            {activeAlerts.length} ACTIONABLE
          </div>
          <div className="pt-1 border-t border-[#2E343A]">
            <button
              onClick={() => {
                if (activeAlerts.length > 0) setSelectedAlertModal(activeAlerts[0]);
              }}
              className="text-xs text-[#ED1C24] hover:underline font-bold flex items-center space-x-1"
            >
              <span>View Field SOP Checklist</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Telemetry Gauges (Easy to read cards) */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#ED1C24]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Real-Time Drilling Sensors (Normal vs Warning Limits)
            </h3>
          </div>
          <Link
            to="/app/telemetry"
            className="text-xs text-[#2D9CDB] hover:underline flex items-center space-x-1 font-semibold"
          >
            <span>Open Advanced Telemetry Tracks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <TelemetryGauges telemetry={liveTelemetry} />
      </div>

      {/* 4. Look-Ahead Radar & Explainability Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming Hazards (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2E343A] pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#FFC72C]" />
                <span>Look-Ahead Horizon (Upcoming Rock Layers: {currentMd.toFixed(0)}m to {(currentMd + lookaheadWindow).toFixed(0)}m)</span>
              </h3>
              <p className="text-[11px] text-[#A0AAB2]">
                Proactively searching offset drilling history before the bit enters new rock.
              </p>
            </div>
            {/* Window Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-[#A0AAB2] uppercase">Look-Ahead:</span>
              <select
                value={lookaheadWindow}
                onChange={(e) => setLookaheadWindow(Number(e.target.value))}
                className="bg-[#15181B] border border-[#2E343A] text-xs font-mono text-white rounded px-2 py-1 focus:outline-none"
              >
                <option value={30}>30 meters</option>
                <option value={50}>50 meters</option>
                <option value={100}>100 meters</option>
              </select>
            </div>
          </div>

          {/* Explainability Reasoning */}
          <div className="p-3.5 rounded-xl bg-[#231F20] border border-[#2E343A] space-y-1">
            <div className="text-[11px] font-bold text-[#FFC72C] uppercase tracking-wider">
              Why Risk is {riskCategory}:
            </div>
            <p className="text-xs text-[#F5F6F8] leading-relaxed">
              {lookaheadSummary?.why_risk_increased}
            </p>
          </div>

          {/* Detected Hazard Cards */}
          <div className="space-y-2.5">
            {lookaheadSummary?.detected_hazards.map((hz, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#15181B] border border-[#2E343A] hover:border-[#ED1C24]/50 transition-all space-y-2 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24] animate-ping" />
                    <span className="font-bold text-white text-xs">{hz.hazard_type}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ED1C24]/20 text-[#ED1C24] font-bold">
                      {hz.severity}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-orange-400">
                    Depth: {hz.depth_start}m – {hz.depth_end}m MD
                  </span>
                </div>

                <p className="text-xs text-[#A0AAB2] leading-relaxed">
                  {hz.description}
                </p>

                <div className="p-2.5 rounded-lg bg-[#1A1D20] text-xs flex flex-wrap items-center justify-between gap-2 border border-[#2E343A]">
                  <div>
                    <span className="text-[#A0AAB2]">Recommended SOP:</span>{' '}
                    <strong className="text-[#2D9CDB]">{hz.mitigation_strategy}</strong>
                  </div>
                  <button
                    onClick={() => {
                      const alert = alerts.find((a) => a.hazard_type === hz.hazard_type) || alerts[0];
                      if (alert) setSelectedAlertModal(alert);
                    }}
                    className="text-[11px] font-bold text-[#ED1C24] hover:underline flex items-center space-x-1"
                  >
                    <span>Open SOP Procedure</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links & Offset Well Highlights (1 Col) */}
        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#2D9CDB]" />
              <span>Key Offset Wells Analyzed</span>
            </h3>
            <p className="text-xs text-[#A0AAB2]">
              Historical records correlated using the 4-factor geological &amp; trajectory similarity engine.
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-xl bg-[#15181B] border border-[#27AE60]/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">OIL-DEMO-002 (NHK-388)</span>
                  <span className="text-[10px] font-mono font-bold text-[#27AE60] bg-[#27AE60]/20 px-1.5 py-0.5 rounded">
                    92% Match
                  </span>
                </div>
                <div className="text-[11px] text-[#A0AAB2]">
                  650m away • Identical Barail Sandstone • Encountered 45 m³ mud loss.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#15181B] border border-[#FFC72C]/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">OIL-DEMO-003 (NHK-405)</span>
                  <span className="text-[10px] font-mono font-bold text-[#FFC72C] bg-[#FFC72C]/20 px-1.5 py-0.5 rounded">
                    84% Match
                  </span>
                </div>
                <div className="text-[11px] text-[#A0AAB2]">
                  1.2 km away • Experienced 18.5h stuck pipe in Kopili shale transition.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#2E343A] space-y-2">
            <Link
              to="/app/nearby-wells"
              className="w-full py-2.5 rounded-xl bg-[#231F20] hover:bg-[#2E343A] border border-[#2E343A] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <span>Explore Interactive GIS Map</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              to="/app/ask-nwis"
              className="w-full py-2.5 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#ED1C24]/20"
            >
              <span>Ask NWIS AI Copilot</span>
              <Sparkles className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Guide Modal */}
      <QuickGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
};
