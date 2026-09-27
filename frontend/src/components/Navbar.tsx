import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Radio,
  AlertTriangle,
  Layers,
  UserCircle2,
  Sun,
  Moon,
  HelpCircle,
  Ruler,
  LogOut,
  Sparkles,
  ChevronDown,
  Menu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { QuickGuideModal } from './QuickGuideModal';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const {
    wells,
    activeWellId,
    setActiveWellId,
    activeWell,
    liveTelemetry,
    lookaheadSummary,
    unreadAlertCount,
    setSelectedAlertModal,
    setShowManualDepthModal,
    alerts,
    user,
    userRole,
    switchRoleQuick,
    logout,
    theme,
    toggleTheme,
    toggleMobileSidebar
  } = useApp();

  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

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
      <header className="h-16 bg-[#1A1D20] border-b border-[#2E343A] px-2 sm:px-4 flex items-center justify-between sticky top-0 z-40 shadow-xl transition-colors duration-200">
        {/* Brand & Mobile Hamburger Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-white hover:border-[#ED1C24] transition-all"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <Link to="/" className="flex items-center space-x-2 sm:space-x-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ED1C24] flex items-center justify-center font-black text-white text-sm sm:text-base tracking-wider shadow-lg shadow-[#ED1C24]/20 group-hover:brightness-110 transition-all shrink-0">
              OIL
            </div>
            <div>
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <span className="font-bold text-xs sm:text-base tracking-tight text-[#F5F6F8]">eRTMAC-NWIS</span>
                <span className="hidden xs:inline text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#ED1C24]/20 text-[#ED1C24] border border-[#ED1C24]/30 font-bold">
                  DSS
                </span>
              </div>
              <p className="text-[10px] text-[#A0AAB2] hidden md:block">
                Nearby Wells Intelligence System
              </p>
            </div>
          </Link>

          {/* Telemetry Stream Badge */}
          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#15181B] border border-[#2E343A]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27AE60] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27AE60]"></span>
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#27AE60] tracking-wide">
              SIMULATED eRTMAC
            </span>
          </div>
        </div>

        {/* Center: Active Well & Live Bit Position */}
        <div className="flex items-center space-x-2.5">
          {/* Active Well Selector */}
          <div className="flex items-center bg-[#231F20] border border-[#2E343A] rounded-xl px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-[#ED1C24] mr-2 shrink-0" />
            <div className="text-left">
              <div className="text-[8px] uppercase tracking-wider text-[#A0AAB2] font-semibold">Active Well</div>
              <select
                value={activeWellId}
                onChange={(e) => setActiveWellId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
              >
                {wells.map((w) => (
                  <option key={w.well_id} value={w.well_id} className="bg-[#1A1D20] text-white">
                    {w.well_name} ({w.field_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Bit Depth & Manual Input Trigger */}
          <div className="hidden sm:flex items-center bg-[#15181B] border border-[#2E343A] rounded-xl px-3 py-1 font-mono">
            <div>
              <div className="text-[8px] text-[#A0AAB2] font-sans uppercase font-bold flex items-center justify-between">
                <span>Bit Depth (MD)</span>
                <span className="text-[9px] text-[#27AE60] ml-2">Manual/Live</span>
              </div>
              <div className="text-xs font-bold text-[#F5F6F8] flex items-center">
                <span>{currentMd.toFixed(1)}m</span>
                <span className="text-[10px] text-[#6C7781] ml-2">TVD: {currentTvd.toFixed(1)}m</span>
              </div>
            </div>
          </div>

          {/* Quick Manual Depth Button */}
          <button
            onClick={() => setShowManualDepthModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-[#231F20] hover:bg-[#2E343A] border border-[#2E343A] text-white hover:border-[#ED1C24] text-xs font-semibold flex items-center space-x-1.5 shadow transition-all"
            title="Update Current Bit Depth (Manual Entry)"
          >
            <Ruler className="w-3.5 h-3.5 text-[#ED1C24]" />
            <span className="hidden md:inline">Set Bit Depth</span>
          </button>

          {/* Composite Lookahead Risk Level */}
          <div className={`hidden lg:flex items-center border rounded-xl px-3 py-1 font-mono ${getRiskBadgeColor(riskCategory)}`}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <div>
              <div className="text-[8px] font-sans uppercase font-bold tracking-wider">Lookahead Risk</div>
              <div className="text-xs font-bold tracking-tight">
                {riskCategory} ({(riskScore * 100).toFixed(0)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls: Quick Guide, Theme, Alerts, User Profile */}
        <div className="flex items-center space-x-2">
          {/* Quick Guide */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="p-2 rounded-xl bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-[#2D9CDB] hover:border-[#2D9CDB] transition-all flex items-center justify-center"
            title="How to analyze dashboard"
          >
            <HelpCircle className="w-4 h-4 text-[#2D9CDB]" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-[#ED1C24] hover:border-[#ED1C24] transition-all flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#FFC72C]" />
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
            className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              unreadAlertCount > 0
                ? 'bg-[#ED1C24]/15 border-[#ED1C24] text-[#ED1C24] hover:bg-[#ED1C24]/25 shadow-lg shadow-[#ED1C24]/15'
                : 'bg-[#231F20] border-[#2E343A] text-[#A0AAB2] hover:text-white'
            }`}
            title="View Proactive Hazard Alerts"
          >
            <Radio className={`w-3.5 h-3.5 ${unreadAlertCount > 0 ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-bold hidden sm:inline">Alerts</span>
            {unreadAlertCount > 0 && (
              <span className="flex h-4 w-4 rounded-full bg-[#ED1C24] text-white text-[9px] font-bold items-center justify-center">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* User Profile & Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-xl bg-[#231F20] border border-[#2E343A] text-left hover:border-[#4B5563] transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-[#ED1C24]/20 border border-[#ED1C24]/40 flex items-center justify-center text-[#ED1C24] font-bold text-xs">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block pr-1">
                <div className="text-xs font-bold text-white truncate max-w-[110px]">
                  {user?.full_name || 'Drilling Lead'}
                </div>
                <div className="text-[9px] text-[#A0AAB2] font-mono leading-none">
                  {userRole}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#A0AAB2]" />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
                <div className="p-2 border-b border-[#2E343A]">
                  <div className="font-bold text-white">{user?.full_name || 'Operations Lead'}</div>
                  <div className="text-[10px] text-[#A0AAB2] font-mono">{user?.email || 'drilling@oilindia.in'}</div>
                  <div className="mt-1 px-1.5 py-0.5 rounded bg-emerald-950 text-[#27AE60] text-[9px] font-mono font-bold inline-block">
                    ROLE: {userRole}
                  </div>
                </div>

                <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#6C7781]">
                  Switch Demo Role:
                </div>
                {[
                  { r: 'DRILLING_ENGINEER', label: 'Drilling Engineer (RTDC)' },
                  { r: 'GEOLOGIST', label: 'Data Reviewer / Geologist' },
                  { r: 'ADMIN', label: 'Administrator' },
                  { r: 'VIEWER', label: 'Read-Only Viewer' }
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => {
                      switchRoleQuick(item.r);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                      userRole === item.r
                        ? 'bg-[#ED1C24]/15 text-[#ED1C24] font-bold'
                        : 'text-[#A0AAB2] hover:bg-[#231F20] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <div className="pt-1 border-t border-[#2E343A]">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors flex items-center space-x-2 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out / Lock Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Guide Modal */}
      <QuickGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </>
  );
};
