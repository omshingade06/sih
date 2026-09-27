import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StratigraphicColumn } from '../components/StratigraphicColumn';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Compass, Layers, ShieldAlert, Activity, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

export const ActiveWellPage: React.FC = () => {
  const { activeWell, liveTelemetry, telemetryHistory, lookaheadWindow, lookaheadSummary, setSelectedAlertModal, alerts } = useApp();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const currentMd = liveTelemetry?.measured_depth ?? activeWell?.current_bit_depth_md ?? 2845.0;
  const currentTvd = liveTelemetry?.true_vertical_depth ?? activeWell?.current_bit_depth_tvd ?? 2680.0;
  const kbElevation = activeWell?.KB_elevation ?? 112.5;

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Top Profile Card */}
      <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ED1C24] text-white font-bold">
              ACTIVE WELL
            </span>
            <span className="text-xs text-[#A0AAB2] font-mono">UWI: {activeWell?.UWI}</span>
          </div>
          <h1 className="text-xl font-black text-white mt-1">
            {activeWell?.well_name} ({activeWell?.field_name} Field)
          </h1>
          <p className="text-xs text-[#A0AAB2] mt-0.5">
            Operator: {activeWell?.operator} | Rig: {activeWell?.rig_id} | Trajectory: {activeWell?.trajectory_type} | Mud: {activeWell?.mud_system}
          </p>
        </div>

        {/* Real-time Depth Pill */}
        <div className="flex items-center space-x-3 bg-[#15181B] border border-[#2E343A] rounded-xl p-3 font-mono">
          <div>
            <div className="text-[10px] text-[#A0AAB2] font-sans uppercase">Current Bit MD</div>
            <div className="text-lg font-bold text-white">{currentMd.toFixed(1)} m</div>
          </div>
          <div className="h-8 w-px bg-[#2E343A]"></div>
          <div>
            <div className="text-[10px] text-[#A0AAB2] font-sans uppercase">Current TVD</div>
            <div className="text-lg font-bold text-[#2D9CDB]">{currentTvd.toFixed(1)} m</div>
          </div>
          <div className="h-8 w-px bg-[#2E343A]"></div>
          <div>
            <div className="text-[10px] text-[#A0AAB2] font-sans uppercase">TVDSS</div>
            <div className="text-lg font-bold text-[#27AE60]">
              {(currentTvd - kbElevation).toFixed(1)} m
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Stratigraphic Column + Synchronized Telemetry Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Stratigraphic Column (5 Cols) */}
        <div className="lg:col-span-5 h-[580px]">
          <StratigraphicColumn
            intervals={activeWell?.formation_intervals || []}
            currentDepthMd={currentMd}
            currentTvd={currentTvd}
            kbElevation={kbElevation}
            lookaheadM={lookaheadWindow}
            incidents={activeWell?.incidents || []}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        </div>

        {/* Telemetry Log Tracks & Trajectory Visualizer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Synchronized Real-time Telemetry Trend Track */}
          <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#2E343A] pb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#ED1C24]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Synchronized Telemetry Tracks (SPP, Torque, ROP, Flow)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#27AE60]">Live Stream Buffer (60s)</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E343A" />
                  <XAxis
                    dataKey="measured_depth"
                    stroke="#6C7781"
                    tick={{ fontSize: 10 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `${Number(val).toFixed(0)}m`}
                  />
                  <YAxis stroke="#6C7781" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1D20',
                      borderColor: '#2E343A',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="SPP"
                    name="SPP (psi)"
                    stroke="#F2994A"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="torque"
                    name="Torque (kN.m)"
                    stroke="#FFC72C"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ROP"
                    name="ROP (m/hr)"
                    stroke="#2D9CDB"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="flow_out"
                    name="Flow Out (LPM)"
                    stroke="#27AE60"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center space-x-6 text-[10px] font-mono">
              <span className="text-[#F2994A] font-bold">● Standpipe Pressure (SPP)</span>
              <span className="text-[#FFC72C] font-bold">● Torque</span>
              <span className="text-[#2D9CDB] font-bold">● ROP</span>
              <span className="text-[#27AE60] font-bold">● Flow Out</span>
            </div>
          </div>

          {/* Casing Program & Wellbore Architecture */}
          <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#2D9CDB]" />
              <span>Wellbore Architecture &amp; Casing Schedule</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {activeWell?.casing_program?.map((csg, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#15181B] border border-[#2E343A] text-xs">
                  <div className="text-[10px] text-[#A0AAB2] uppercase">String {idx + 1}</div>
                  <div className="font-bold text-white mt-0.5">{csg.size} Casing</div>
                  <div className="text-[11px] font-mono text-[#2D9CDB] mt-1">Shoe: {csg.shoe_md} m</div>
                  <div className="text-[10px] text-[#6C7781]">{csg.weight} ({csg.grade})</div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Detail Inspector if selected */}
          {selectedIncident && (
            <div className="p-4 rounded-xl bg-[#231F20] border border-[#ED1C24] shadow-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ED1C24] uppercase">
                  Incident Detail: {selectedIncident.hazard_type}
                </span>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-xs text-[#A0AAB2] hover:text-white"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-white">{selectedIncident.description}</p>
              <div className="flex items-center space-x-4 text-[11px] text-[#A0AAB2] font-mono">
                <span>Depth: {selectedIncident.depth_start}m MD</span>
                <span>NPT: {selectedIncident.NPT_hours} hrs</span>
                <span>η = {selectedIncident.eta_norm}</span>
                <span>Source: {selectedIncident.source_document}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
