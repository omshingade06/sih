import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  MapPin,
  Activity,
  AlertTriangle,
  Network,
  BellRing,
  Settings,
  Home,
  History,
  Users,
  Download,
  FileCheck,
  ShieldCheck,
  Bot,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { unreadAlertCount, userRole, mobileSidebarOpen, setMobileSidebarOpen } = useApp();

  const coreModules = [
    { to: '/app', label: 'Command Center', desc: 'Real-time drilling digest & health', icon: LayoutDashboard, exact: true },
    { to: '/app/hazards', label: 'Look-Ahead Radar', desc: 'Predict hazards in next 50m of rock', icon: AlertTriangle },
    { to: '/app/alerts', label: 'Alert Center', desc: 'SOP mitigations & sign-offs', icon: BellRing, badge: unreadAlertCount },
    { to: '/app/telemetry', label: 'Live eRTMAC Stream', desc: 'High-frequency sensor tracks (SPP, WOB)', icon: Activity },
  ];

  const intelligenceModules = [
    { to: '/app/wells', label: 'Well Portfolio', desc: 'Well registry & 7-tab history', icon: Compass },
    { to: '/app/nearby-wells', label: 'Nearby Offset GIS', desc: 'Spatial & geological similarity matching', icon: MapPin },
    { to: '/app/active-well', label: 'Active Well 3D/Log', desc: 'Wellbore trajectory & formation tops', icon: LayersIcon },
    { to: '/app/documents', label: 'Verification Center', desc: 'Split-screen OCR & human review', icon: FileCheck },
    { to: '/app/historical', label: 'Historical Retrieval', desc: 'Search past loss & sticking cases', icon: History },
    { to: '/app/knowledge-graph', label: 'Knowledge Graph', desc: 'Ontology of hazards & SOPs', icon: Network },
    { to: '/app/ask-nwis', label: 'Ask NWIS Copilot', desc: 'Grounded RAG offset query agent', icon: Bot, isAi: true },
    { to: '/app/exports', label: 'Reports & Exports', desc: 'Download CSV & verification records', icon: Download },
  ];

  const governanceModules = [
    { to: '/app/audit-logs', label: 'Audit Trail', desc: 'Immutable action ledger', icon: ShieldCheck },
    ...(userRole === 'ADMIN' ? [{ to: '/app/users', label: 'User Management', desc: 'Manage access & roles', icon: Users }] : []),
    { to: '/app/settings', label: 'Settings & Reset', desc: 'Configuration & demo data reset', icon: Settings },
  ];

  const renderNavContent = () => (
    <>
      {/* Navigation List */}
      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {/* Core Operational Section */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6C7781]">
            Real-Time Decision Support
          </div>
          {coreModules.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                title={item.desc}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#ED1C24] text-white shadow-md shadow-[#ED1C24]/20'
                      : 'text-[#A0AAB2] hover:bg-[#231F20] hover:text-[#F5F6F8]'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    <div className="leading-tight truncate">{item.label}</div>
                    <div className="text-[9px] opacity-70 font-normal truncate">{item.desc}</div>
                  </div>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#ED1C24] text-white text-[10px] font-mono font-bold shrink-0">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Intelligence & Verification Section */}
        <div className="space-y-1 pt-1 border-t border-[#2E343A]/60">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6C7781]">
            Offset Intelligence &amp; Verification
          </div>
          {intelligenceModules.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.desc}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#ED1C24] text-white shadow-md shadow-[#ED1C24]/20'
                      : 'text-[#A0AAB2] hover:bg-[#231F20] hover:text-[#F5F6F8]'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${item.isAi ? 'text-[#2D9CDB]' : ''}`} />
                  <div className="truncate">
                    <div className="leading-tight truncate">{item.label}</div>
                    <div className="text-[9px] opacity-70 font-normal truncate">{item.desc}</div>
                  </div>
                </div>
                {item.isAi && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-[#2D9CDB]/20 text-[#2D9CDB] font-mono font-bold shrink-0">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Governance Section */}
        <div className="space-y-1 pt-1 border-t border-[#2E343A]/60">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6C7781]">
            Governance &amp; Settings
          </div>
          {governanceModules.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.desc}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#ED1C24] text-white shadow-md shadow-[#ED1C24]/20'
                      : 'text-[#A0AAB2] hover:bg-[#231F20] hover:text-[#F5F6F8]'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    <div className="leading-tight truncate">{item.label}</div>
                    <div className="text-[9px] opacity-70 font-normal truncate">{item.desc}</div>
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#2E343A] bg-[#15181B] space-y-2">
        <Link
          to="/"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex items-center justify-center space-x-2 w-full px-3 py-1.5 rounded-xl bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-white text-xs font-semibold transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home / Public Flow</span>
        </Link>
        <div className="px-1 text-center">
          <div className="text-[10px] text-[#6C7781] font-semibold">Oil India Limited (OIL)</div>
          <div className="text-[9px] text-[#A0AAB2] font-mono">eRTMAC Proactive DSS</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1A1D20] border-r border-[#2E343A] flex-col justify-between shrink-0 h-[calc(100vh-4rem)] select-none">
        {renderNavContent()}
      </aside>

      {/* 2. Mobile / Tablet Sliding Drawer with Backdrop */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-[#1A1D20] border-r border-[#2E343A] shadow-2xl h-full select-none z-10 animate-fadeIn">
            {/* Drawer Header */}
            <div className="h-16 px-4 border-b border-[#2E343A] flex items-center justify-between bg-[#15181B]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#ED1C24] flex items-center justify-center font-black text-white text-xs">
                  OIL
                </div>
                <span className="font-bold text-sm text-white">eRTMAC Navigation</span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation items */}
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};

const LayersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
