import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Radio,
  AlertTriangle,
  Layers,
  UserCircle2,
  Sun,
  Moon,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QuickGuideModal } from './QuickGuideModal';

export const Navbar: React.FC = () => {
  const {
    wells,
    activeWellId,
    setActiveWellId,
    activeWell,
    liveTelemetry,
    lookaheadSummary,
    unreadAlertCount,
    setSelectedAlertModal,
    alerts,
    userRole,
    setUserRole,
    theme,
    toggleTheme
  } = useApp();

  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const currentMd = liveTelemetry?.measured_depth ?? activeWell?.current_bit_depth_md ?? 2845.0;
  const currentTvd = liveTelemetry?.true_vertical_depth ?? activeWell?.current_bit_depth_tvd ?? 2680.0;
  const currentFormation = lookaheadSummary?.current_formation ?? 'Barail Sandstone';
  const riskCategory = lookaheadSummary?.overall_risk_category ?? 'HIGH';
  const riskScore = lookaheadSummary?.overall_risk_score ?? 0.82;

  const getRiskBadgeColor = (category: string) => {
    switch (category) {
      case 'CRITICAL':
        return 'bg-[#ED1C24]/20 border-[#ED1C24] text-[#ED1C24] animate-pulse';
      case 'HIGH':
        return 'bg-orange-500/20 border-orange-500 text-orange-400';
      case 'MODERATE':
        return 'bg-[#FFC72C]/20 border-[#FFC72C] text-[#FFC72C]';
      default:
        return 'bg-[#27AE60]/20 border-[#27AE60] text-[#27AE60]';
    }
  };

  return (
    <>
      <header className="h-16 bg-[#1A1D20] border-b border-[#2E343A] px-4 flex items-center justify-between sticky top-0 z-40 shadow-xl transition-colors duration-200">
        {/* Brand & Title */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-md bg-[#ED1C24] flex items-center justify-center font-black text-white text-base tracking-wider shadow-lg shadow-[#ED1C24]/20 group-hover:brightness-110 transition-all">
              OIL
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-[#F5F6F8]">eRTMAC-NWIS</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#2E343A] text-[#A0AAB2] border border-[#3A424A]">
                  RTDC v2.4
                </span>
              </div>
              <p className="text-[11px] text-[#A0AAB2] hidden sm:block">
                Nearby Wells Intelligence & Proactive Drilling Risk Support
              </p>
            </div>
          </Link>

          {/* Telemetry Stream Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#15181B] border border-[#2E343A]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27AE60] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27AE60]"></span>
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#27AE60] tracking-wide">
              SIMULATED eRTMAC STREAM
            </span>
          </div>
        </div>

        {/* Center: Active Well & Live Bit Position */}
        <div className="flex items-center space-x-3">
          {/* Active Well Selector */}
          <div className="flex items-center bg-[#231F20] border border-[#2E343A] rounded-lg px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-[#ED1C24] mr-2 shrink-0" />
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider text-[#A0AAB2] font-semibold">Active Well</div>
              <select
                value={activeWellId}
                onChange={(e) => setActiveWellId(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
              >
                {wells.map((w) => (
                  <option key={w.well_id} value={w.well_id} className="bg-[#1A1D20] text-white">
                    {w.well_name} ({w.field_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Bit Depth */}
          <div className="hidden md:flex items-center bg-[#15181B] border border-[#2E343A] rounded-lg px-3 py-1 font-mono">
            <div>
              <div className="text-[9px] text-[#A0AAB2] font-sans uppercase">Bit Depth (MD)</div>
              <div className="text-xs font-bold text-[#F5F6F8] flex items-center">
                <span>{currentMd.toFixed(1)}</span>
                <span className="text-[10px] text-[#A0AAB2] ml-0.5">m</span>
                <span className="text-[10px] text-[#6C7781] ml-2">TVD: {currentTvd.toFixed(1)}m</span>
              </div>
            </div>
          </div>

          {/* Active Formation */}
          <div className="hidden xl:flex items-center bg-[#15181B] border border-[#2E343A] rounded-lg px-3 py-1">
            <div>
              <div className="text-[9px] text-[#A0AAB2] uppercase">Formation Horizon</div>
              <div className="text-xs font-semibold text-[#2D9CDB] truncate max-w-[140px]">
                {currentFormation}
              </div>
            </div>
          </div>

          {/* Composite Lookahead Risk Level */}
          <div className={`flex items-center border rounded-lg px-3 py-1 font-mono ${getRiskBadgeColor(riskCategory)}`}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <div>
              <div className="text-[9px] font-sans uppercase font-bold tracking-wider">Lookahead Risk</div>
              <div className="text-xs font-bold tracking-tight">
                {riskCategory} ({(riskScore * 100).toFixed(0)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Guide, Theme Toggle, Alerts Badge & Role Selector */}
        <div className="flex items-center space-x-2">
          {/* Quick Guide & Demystify Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#231F20] border border-[#2E343A] text-white hover:border-[#2D9CDB] hover:text-[#2D9CDB] text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
            title="How to analyze dashboard"
          >
            <HelpCircle className="w-4 h-4 text-[#2D9CDB]" />
            <span className="hidden sm:inline">Quick Guide</span>
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-[#ED1C24] hover:border-[#ED1C24] transition-all flex items-center justify-center shadow-md"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#FFC72C] animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-[#2D9CDB]" />
            )}
          </button>

          {/* Proactive Alerts Shortcut */}
          <button
            onClick={() => {
              const firstActive = alerts.find((a) => a.status === 'ACTIVE') || alerts[0];
              if (firstActive) setSelectedAlertModal(firstActive);
            }}
            className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              unreadAlertCount > 0
                ? 'bg-[#ED1C24]/15 border-[#ED1C24] text-[#ED1C24] hover:bg-[#ED1C24]/25 shadow-lg shadow-[#ED1C24]/15'
                : 'bg-[#231F20] border-[#2E343A] text-[#A0AAB2] hover:text-white'
            }`}
            title="View Proactive Hazard Alerts"
          >
            <Radio className={`w-4 h-4 ${unreadAlertCount > 0 ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-bold hidden sm:inline">Proactive Alerts</span>
            {unreadAlertCount > 0 && (
              <span className="flex h-5 w-5 rounded-full bg-[#ED1C24] text-white text-[11px] font-bold items-center justify-center">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* User Role Switcher */}
          <div className="hidden sm:flex items-center bg-[#15181B] border border-[#2E343A] rounded-lg px-2.5 py-1">
            <UserCircle2 className="w-4 h-4 text-[#A0AAB2] mr-2" />
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="bg-transparent text-xs text-[#A0AAB2] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="DRILLING_ENGINEER" className="bg-[#1A1D20] text-white">Drilling Engineer (RTDC)</option>
              <option value="GEOLOGIST" className="bg-[#1A1D20] text-white">Geologist</option>
              <option value="ADMIN" className="bg-[#1A1D20] text-white">Admin</option>
              <option value="VIEWER" className="bg-[#1A1D20] text-white">Viewer / Stakeholder</option>
            </select>
          </div>
        </div>
      </header>

      {/* Quick Guide Modal */}
      <QuickGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </>
  );
};
