import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  MapPin,
  Activity,
  AlertTriangle,
  Network,
  FileText,
  BellRing,
  BarChart3,
  Bot,
  Settings,
  Home,
  History,
  Users,
  Download,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { unreadAlertCount, userRole } = useApp();

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

  return (
    <aside className="w-64 bg-[#1A1D20] border-r border-[#2E343A] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] select-none">
      {/* Navigation List */}
      <div className="p-3 space-y-3 overflow-y-auto">
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
    </aside>
  );
};

const LayersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
