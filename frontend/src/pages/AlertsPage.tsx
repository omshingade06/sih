import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Alert } from '../types';
import { BellRing, AlertTriangle, ShieldCheck, Clock, BookOpen, CheckCircle2, ChevronRight, Radio } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { alerts, setSelectedAlertModal } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'ACTIVE') return a.status === 'ACTIVE';
    if (filterSeverity === 'ACKNOWLEDGED') return a.status === 'ACKNOWLEDGED';
    return a.severity === filterSeverity;
  });

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Header & Filter Tabs */}
      <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BellRing className="w-5 h-5 text-[#ED1C24]" />
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              Proactive Alert Center &amp; Incident Mitigation Protocol
            </h1>
          </div>
          <p className="text-xs text-[#A0AAB2] mt-0.5">
            Real-time proactive look-ahead alerts with historical evidence and SOP-guided action checklists.
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#15181B] p-1 rounded-xl border border-[#2E343A]">
          {['ALL', 'ACTIVE', 'CRITICAL', 'HIGH', 'MODERATE', 'ACKNOWLEDGED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterSeverity(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterSeverity === tab
                  ? 'bg-[#ED1C24] text-white shadow-md'
                  : 'text-[#A0AAB2] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.alert_id}
                className={`p-5 rounded-2xl bg-[#1A1D20] border shadow-2xl space-y-4 transition-all ${
                  isCritical
                    ? 'border-[#ED1C24]/80 bg-gradient-to-r from-[#1A1D20] to-[#231F20]'
                    : 'border-[#2E343A]'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E343A] pb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isCritical ? 'bg-[#ED1C24] text-white' : 'bg-orange-500 text-white'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-white">
                          {alert.severity} {alert.hazard_type.toUpperCase()} ALERT
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            alert.status === 'ACTIVE'
                              ? 'bg-[#ED1C24]/20 text-[#ED1C24] border border-[#ED1C24]'
                              : 'bg-[#27AE60]/20 text-[#27AE60] border border-[#27AE60]'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#A0AAB2] mt-0.5">
                        Target Well: <strong className="text-white">{alert.well_name}</strong> | Geological Formation:{' '}
                        <strong className="text-[#2D9CDB]">{alert.formation}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right font-mono text-xs">
                      <div className="text-white font-bold">
                        Target: {alert.predicted_depth_start}–{alert.predicted_depth_end} m MD
                      </div>
                      <div className="text-[10px] text-[#A0AAB2]">Current: {alert.current_depth} m MD</div>
                    </div>

                    <button
                      onClick={() => setSelectedAlertModal(alert)}
                      className="px-4 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Open Mitigation SOP</span>
                    </button>
                  </div>
                </div>

                {/* Evidence Strip */}
                <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-[#FFC72C] uppercase">
                    Historical Grounded Evidence ({alert.evidence.length} Correlated Offset Records):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {alert.evidence.map((ev, eIdx) => (
                      <div key={eIdx} className="p-2 rounded bg-[#1A1D20] text-[11px] space-y-0.5">
                        <div className="flex justify-between font-bold text-white">
                          <span>{ev.well_name}</span>
                          <span className="text-[#2D9CDB] font-mono">{ev.source_doc}</span>
                        </div>
                        <div className="text-[#A0AAB2]">
                          Loss: <strong className="text-white">{ev.loss_volume}</strong> | NPT:{' '}
                          <strong className="text-[#ED1C24]">{ev.npt_hours}</strong> | Dist: {ev.distance_m}m
                        </div>
                        <p className="text-[10px] text-[#6C7781] italic">"{ev.summary}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retrieved SOP Action */}
                <div className="p-3 rounded-xl bg-[#231F20] border border-[#27AE60]/40 space-y-1 text-xs">
                  <div className="flex items-center space-x-1.5 text-[#27AE60] font-bold uppercase text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Recommended Field Mitigation:</span>
                  </div>
                  <p className="text-white font-medium">{alert.recommended_action}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-xs text-[#A0AAB2] bg-[#1A1D20] rounded-2xl border border-[#2E343A]">
            No alerts matching the selected filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
