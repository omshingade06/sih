import React from 'react';
import { useApp } from '../context/AppContext';
import { TelemetryGauges } from '../components/TelemetryGauges';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Play, Pause, RotateCcw, FastForward, Zap, ShieldAlert, Sparkles } from 'lucide-react';

export const TelemetryPage: React.FC = () => {
  const {
    activeWell,
    liveTelemetry,
    telemetryHistory,
    simulatorRunning,
    simulationSpeed,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    stepSimulation,
    setSimulationSpeed,
    triggerAnomaly
  } = useApp();

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Top Stream Cockpit Control Strip */}
      <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E343A] pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27AE60] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#27AE60]"></span>
              </span>
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                eRTMAC Live Telemetry Cockpit &amp; Simulator Station
              </h1>
            </div>
            <p className="text-xs text-[#A0AAB2] mt-0.5">
              High-frequency surface &amp; downhole data channel for <strong className="text-white">{activeWell?.well_name}</strong>.
            </p>
          </div>

          {/* Primary Controls */}
          <div className="flex items-center space-x-2">
            {simulatorRunning ? (
              <button
                onClick={pauseSimulation}
                className="px-3.5 py-1.5 rounded-lg bg-[#231F20] border border-[#2E343A] text-white text-xs font-bold flex items-center space-x-1.5 hover:bg-[#2E343A] transition-all"
              >
                <Pause className="w-4 h-4 text-orange-400" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={startSimulation}
                className="px-3.5 py-1.5 rounded-lg bg-[#27AE60] hover:bg-[#219653] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#27AE60]/20 transition-all"
              >
                <Play className="w-4 h-4" />
                <span>Run Stream</span>
              </button>
            )}

            <button
              onClick={stepSimulation}
              className="px-3 py-1.5 rounded-lg bg-[#15181B] border border-[#2E343A] text-[#A0AAB2] hover:text-white text-xs font-semibold"
              title="Advance depth by 1.0 m"
            >
              Step +1m
            </button>

            <button
              onClick={resetSimulation}
              className="px-3 py-1.5 rounded-lg bg-[#15181B] border border-[#2E343A] text-[#A0AAB2] hover:text-white text-xs font-semibold flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center space-x-1 bg-[#15181B] border border-[#2E343A] rounded-lg p-1">
              {[0.5, 1.0, 2.0, 5.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimulationSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                    simulationSpeed === spd
                      ? 'bg-[#ED1C24] text-white'
                      : 'text-[#A0AAB2] hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Anomaly Injection Triggers */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#15181B] p-3 rounded-xl border border-[#2E343A]">
          <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase">
            <Zap className="w-4 h-4 text-[#ED1C24]" />
            <span>Interactive Anomaly Injection (Decision Support Testing):</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => triggerAnomaly('Lost Circulation')}
              className="px-3 py-1 rounded-lg bg-[#ED1C24]/20 hover:bg-[#ED1C24]/30 border border-[#ED1C24] text-[#ED1C24] text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              <span>Trigger Lost Circulation</span>
            </button>

            <button
              onClick={() => triggerAnomaly('Differential Sticking')}
              className="px-3 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500 text-orange-400 text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              <span>Trigger Differential Sticking</span>
            </button>

            <button
              onClick={() => triggerAnomaly('Gas Kick')}
              className="px-3 py-1 rounded-lg bg-[#FFC72C]/20 hover:bg-[#FFC72C]/30 border border-[#FFC72C] text-[#FFC72C] text-xs font-bold flex items-center space-x-1.5 transition-all"
            >
              <span>Trigger Gas Kick</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Gauges Component */}
      <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white">
          Real-Time Parameter Instrumentation
        </h2>
        <TelemetryGauges telemetry={liveTelemetry} />
      </div>

      {/* Synchronized Real-Time Drilling Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SPP & Torque Curves */}
        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-white uppercase">
            <span>Hydraulics &amp; Mechanics: SPP vs Torque</span>
            <span className="text-[#A0AAB2] font-mono text-[10px]">Real-Time Feed</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E343A" />
                <XAxis dataKey="measured_depth" stroke="#6C7781" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6C7781" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderColor: '#2E343A' }} />
                <Line type="monotone" dataKey="SPP" name="SPP (psi)" stroke="#F2994A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="torque" name="Torque (kNm)" stroke="#FFC72C" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flow & Mud Gas Curves */}
        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-white uppercase">
            <span>Flow Balance &amp; Gas: Flow Out vs Total Gas</span>
            <span className="text-[#A0AAB2] font-mono text-[10px]">Loss/Influx Monitor</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E343A" />
                <XAxis dataKey="measured_depth" stroke="#6C7781" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6C7781" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderColor: '#2E343A' }} />
                <Line type="monotone" dataKey="flow_out" name="Flow Out (LPM)" stroke="#27AE60" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gas" name="Gas (%)" stroke="#ED1C24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
