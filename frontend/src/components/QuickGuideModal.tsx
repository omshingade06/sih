import React, { useState } from 'react';
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
  ArrowRight,
  UserCheck,
  FileCheck,
  Ruler,
  FileText,
  MapPin,
  TrendingUp,
  Download,
  Terminal,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { switchRoleQuick, setShowManualDepthModal, setSelectedAlertModal, alerts } = useApp();
  const [activeTab, setActiveTab] = useState<'quickstart' | 'roles' | 'workflows' | 'glossary'>('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#231F20] border-b border-[#2E343A] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#ED1C24]/20 text-[#ED1C24]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>eRTMAC-NWIS Interactive User Guide</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ED1C24]/20 text-[#ED1C24] font-mono lowercase">
                  quick-start
                </span>
              </h3>
              <p className="text-[11px] text-[#A0AAB2]">
                Everything you need to know to navigate, analyze drilling risks, and verify reports in minutes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#A0AAB2] hover:text-white hover:bg-[#2E343A] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2E343A] bg-[#15181B] px-4 gap-2 overflow-x-auto">
          {[
            { id: 'quickstart', label: '1. Quick Start Flow', icon: Compass },
            { id: 'workflows', label: '2. Core Features & Pages', icon: Layers },
            { id: 'roles', label: '3. Role Cheat Sheet', icon: UserCheck },
            { id: 'glossary', label: '4. Oilfield Glossary', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-[#ED1C24] text-[#ED1C24] bg-[#231F20]'
                    : 'border-transparent text-[#A0AAB2] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: QUICK START */}
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#ED1C24]/10 to-transparent border border-[#ED1C24]/30">
                <h4 className="font-bold text-white text-sm mb-1">What is eRTMAC-NWIS?</h4>
                <p className="text-[11px] text-[#A0AAB2] leading-relaxed">
                  <strong>Nearby Wells Intelligence System (NWIS)</strong> looks at your current drilling depth and automatically scans historical reports from offset wells drilled nearby to warn you <strong>50 meters before</strong> you encounter dangerous zones (like lost circulation, sticking, or gas kicks).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#15181B] border border-[#2E343A] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-[#2D9CDB] font-bold mb-2">
                      <span className="w-6 h-6 rounded-full bg-[#2D9CDB]/20 flex items-center justify-center text-xs">1</span>
                      <span>Select Active Well</span>
                    </div>
                    <p className="text-[11px] text-[#A0AAB2] leading-relaxed">
                      Choose <strong>OIL-DEMO-001</strong> from the top dropdown or click <strong>"Set Bit Depth"</strong> to enter a new depth (e.g. 2,845m).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      setShowManualDepthModal(true);
                    }}
                    className="mt-3 w-full py-1.5 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-[#2D9CDB] font-bold text-[11px] flex items-center justify-center space-x-1"
                  >
                    <span>Try Manual Depth</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#15181B] border border-[#2E343A] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-[#FFC72C] font-bold mb-2">
                      <span className="w-6 h-6 rounded-full bg-[#FFC72C]/20 flex items-center justify-center text-xs">2</span>
                      <span>Read Look-Ahead Risk</span>
                    </div>
                    <p className="text-[11px] text-[#A0AAB2] leading-relaxed">
                      Look at the <strong>Look-Ahead Risk Badge</strong> on the header. Click <strong>"Alerts"</strong> to inspect the evidence from offset well <strong>NHK-388</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      const firstActive = alerts.find((a) => a.status === 'ACTIVE') || alerts[0];
                      if (firstActive) setSelectedAlertModal(firstActive);
                    }}
                    className="mt-3 w-full py-1.5 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-[#FFC72C] font-bold text-[11px] flex items-center justify-center space-x-1"
                  >
                    <span>View Proactive Alert</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#15181B] border border-[#2E343A] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-[#27AE60] font-bold mb-2">
                      <span className="w-6 h-6 rounded-full bg-[#27AE60]/20 flex items-center justify-center text-xs">3</span>
                      <span>Verify or Export Data</span>
                    </div>
                    <p className="text-[11px] text-[#A0AAB2] leading-relaxed">
                      Go to <strong>Verification Center</strong> to approve extracted reports, or <strong>Export Center</strong> to download CSV hazard summaries.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/documents');
                    }}
                    className="mt-3 w-full py-1.5 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-[#27AE60] font-bold text-[11px] flex items-center justify-center space-x-1"
                  >
                    <span>Go to Verification</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Fast Action Shortcuts */}
              <div className="p-3.5 rounded-xl bg-[#231F20] border border-[#2E343A]">
                <div className="font-bold text-white mb-2 flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-[#ED1C24]" />
                  <span>Where do I go for my daily tasks?</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => { onClose(); navigate('/'); }}
                    className="p-2 rounded-lg bg-[#15181B] hover:bg-[#1A1D20] text-left border border-[#2E343A]"
                  >
                    <div className="font-bold text-white">Live Dashboard</div>
                    <div className="text-[10px] text-[#A0AAB2]">Real-time telemetry</div>
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/wells'); }}
                    className="p-2 rounded-lg bg-[#15181B] hover:bg-[#1A1D20] text-left border border-[#2E343A]"
                  >
                    <div className="font-bold text-white">Well Management</div>
                    <div className="text-[10px] text-[#A0AAB2]">All 25 wells &amp; details</div>
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/documents'); }}
                    className="p-2 rounded-lg bg-[#15181B] hover:bg-[#1A1D20] text-left border border-[#2E343A]"
                  >
                    <div className="font-bold text-white">Verification Center</div>
                    <div className="text-[10px] text-[#A0AAB2]">Split-screen OCR check</div>
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/intelligence'); }}
                    className="p-2 rounded-lg bg-[#15181B] hover:bg-[#1A1D20] text-left border border-[#2E343A]"
                  >
                    <div className="font-bold text-white">Historical Intel</div>
                    <div className="text-[10px] text-[#A0AAB2]">Search incidents &amp; SOPs</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CORE FEATURES & PAGES */}
          {activeTab === 'workflows' && (
            <div className="space-y-3">
              {[
                {
                  title: '1. Drilling Command Center (Home)',
                  route: '/',
                  icon: Activity,
                  desc: 'Shows real-time drilling gauges (SPP, ROP, Flow In/Out, Pit Level, Mud Weight). Also displays the live Stratigraphic Column comparing your active bit depth against offset wells.'
                },
                {
                  title: '2. Well Management (/wells)',
                  route: '/wells',
                  icon: Layers,
                  desc: 'Search, filter, and inspect all 25 registered wells. Click "View Details" to open a 7-tab inspector showing Boreholes, Geological Intervals, Historical Incidents, Reports, and Depth Logs.'
                },
                {
                  title: '3. Verification Center (/documents)',
                  route: '/documents',
                  icon: FileCheck,
                  desc: 'Upload historical PDFs (WCR, DDR, Mudlogs). Use the split-screen workspace: see the original PDF on the left and edit/correct extracted metadata, geology, and hazard claims on the right before hitting Approve.'
                },
                {
                  title: '4. Proactive Risk Alerts & Look-Ahead',
                  route: '/hazards',
                  icon: AlertTriangle,
                  desc: 'Evaluates the rock formation 50 meters ahead of the drill bit. If offset wells had lost circulation or kicks in that zone, it generates an alert with the exact historical mitigation recipe (e.g. 25 m³ LCM Pill).'
                },
                {
                  title: '5. Historical Intelligence Library (/intelligence)',
                  route: '/intelligence',
                  icon: BookOpen,
                  desc: 'Search historical drilling incidents across all fields by hazard type (Lost Circulation, Sticking, Gas Kick), depth range, or rock formation.'
                },
                {
                  title: '6. Reports & Export Center (/reports)',
                  route: '/reports',
                  icon: Download,
                  desc: 'Generate and download official JSON Verification Certificates, CSV Hazard incident logs, or print executive risk summaries.'
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-[#231F20] text-[#2D9CDB] shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{item.title}</div>
                        <p className="text-[11px] text-[#A0AAB2] mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        navigate(item.route);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-xs font-bold text-white shrink-0"
                    >
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: ROLE CHEAT SHEET */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              <p className="text-[11px] text-[#A0AAB2]">
                You can switch between any role instantly in the top right user menu or click a button below:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Drilling Engineer (RTDC)</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-mono">DRILLER</span>
                  </div>
                  <p className="text-[11px] text-[#A0AAB2]">
                    Monitors live telemetry, inputs manual bit depth, tracks look-ahead alerts, and acknowledges mitigation plans.
                  </p>
                  <button
                    onClick={() => { switchRoleQuick('DRILLING_ENGINEER'); onClose(); }}
                    className="w-full py-1 rounded bg-[#231F20] hover:bg-[#2E343A] text-blue-400 text-[11px] font-bold"
                  >
                    Switch to Driller Mode
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Data Reviewer / Geologist</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">GEOLOGIST</span>
                  </div>
                  <p className="text-[11px] text-[#A0AAB2]">
                    Reviews uploaded reports, inspects OCR extractions against original PDFs, makes corrections, and approves documents.
                  </p>
                  <button
                    onClick={() => { switchRoleQuick('GEOLOGIST'); onClose(); }}
                    className="w-full py-1 rounded bg-[#231F20] hover:bg-[#2E343A] text-emerald-400 text-[11px] font-bold"
                  >
                    Switch to Geologist Mode
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">System Administrator</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-red-950 text-red-400 font-mono">ADMIN</span>
                  </div>
                  <p className="text-[11px] text-[#A0AAB2]">
                    Full control: User governance, well creation/deactivation, demo environment resets, and viewing complete system audit logs.
                  </p>
                  <button
                    onClick={() => { switchRoleQuick('ADMIN'); onClose(); }}
                    className="w-full py-1 rounded bg-[#231F20] hover:bg-[#2E343A] text-red-400 text-[11px] font-bold"
                  >
                    Switch to Admin Mode
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Read-Only Viewer</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">VIEWER</span>
                  </div>
                  <p className="text-[11px] text-[#A0AAB2]">
                    Inspects dashboards, verified records, map, and exports reports without editing privileges.
                  </p>
                  <button
                    onClick={() => { switchRoleQuick('VIEWER'); onClose(); }}
                    className="w-full py-1 rounded bg-[#231F20] hover:bg-[#2E343A] text-gray-300 text-[11px] font-bold"
                  >
                    Switch to Viewer Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>MD (Measured Depth)</span>
                  <span className="text-[10px] text-[#2D9CDB] font-mono">meters</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] mt-1">
                  The actual length of the borehole pipe along its path from surface to bit.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>TVD / TVDSS</span>
                  <span className="text-[10px] text-[#2D9CDB] font-mono">meters</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] mt-1">
                  <strong>TVD:</strong> True Vertical Depth below rig floor. <br />
                  <strong>TVDSS:</strong> True Vertical Depth Subsea (<code className="text-[#27AE60]">TVDSS = TVD - KellyBushing</code>).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Normalized Depth (&eta;_norm)</span>
                  <span className="text-[10px] text-[#2D9CDB] font-mono">0.0 - 1.0</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] mt-1">
                  Fractional position inside a specific rock formation. <br />
                  <code className="text-[#27AE60]">&eta; = (TVDSS - Top) / (Base - Top)</code>. Allows apples-to-apples comparison across dipping layers.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A]">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>LCM Pill (Lost Circulation Material)</span>
                  <span className="text-[10px] text-[#2D9CDB] font-mono">m³</span>
                </div>
                <p className="text-[11px] text-[#A0AAB2] mt-1">
                  A specialized thick slurry containing coarse particles (Nut Plug, Mica, Calcium Carbonate) pumped into fractures to stop mud losses.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#231F20] border-t border-[#2E343A] flex items-center justify-between">
          <span className="text-[11px] text-[#6C7781] hidden sm:inline">
            eRTMAC-NWIS | Proactive Drilling Decision Support
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold transition-all ml-auto"
          >
            Close Guide &amp; Return to App
          </button>
        </div>
      </div>
    </div>
  );
};

