import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Sliders, Activity, ShieldCheck, CheckCircle2, RotateCcw, Sun, Moon } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { lookaheadWindow, setLookaheadWindow, resetSimulation, theme, setTheme } = useApp();
  const [witsmlEndpoint, setWitsmlEndpoint] = useState<string>('https://ertmac.oilindia.in/witsml/v1.4.1.1');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-5 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#ED1C24]" />
          <h1 className="text-base font-bold text-white uppercase tracking-wider">
            System &amp; Algorithm Configuration
          </h1>
        </div>
        <p className="text-xs text-[#A0AAB2] mt-0.5">
          Tune look-ahead search parameters, appearance themes, similarity coefficients, risk thresholds, and telemetry ingestion protocols.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Appearance / Theme Settings */}
        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] space-y-3 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <Sun className="w-4 h-4 text-[#FFC72C]" />
            <span>Visual Theme &amp; Workspace Mode</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex items-center space-x-3 transition-all ${
                theme === 'dark'
                  ? 'bg-[#121416] border-[#ED1C24] shadow-lg shadow-[#ED1C24]/15 ring-2 ring-[#ED1C24]'
                  : 'bg-[#15181B] border-[#2E343A] hover:border-[#3A424A]'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-[#231F20] text-[#FFC72C]">
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">Enterprise Dark Mode</div>
                <div className="text-[11px] text-[#A0AAB2]">High-contrast command center dark theme (#1A1D20)</div>
              </div>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex items-center space-x-3 transition-all ${
                theme === 'light'
                  ? 'bg-[#FFFFFF] border-[#ED1C24] shadow-lg shadow-[#ED1C24]/15 ring-2 ring-[#ED1C24]'
                  : 'bg-[#15181B] border-[#2E343A] hover:border-[#3A424A]'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-[#F1F5F9] text-[#ED1C24]">
                <Sun className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">Executive Light Mode</div>
                <div className="text-[11px] text-[#A0AAB2]">Crisp, daylight office dashboard theme</div>
              </div>
            </button>
          </div>
        </div>

        {/* Lookahead Settings */}
        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] space-y-3 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#2D9CDB]" />
            <span>Look-Ahead Window Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[#A0AAB2] block">Default Look-Ahead Depth Window (ΔZ)</label>
              <input
                type="number"
                value={lookaheadWindow}
                onChange={(e) => setLookaheadWindow(Number(e.target.value))}
                className="w-full bg-[#15181B] border border-[#2E343A] rounded-lg p-2 text-white font-mono"
              />
              <span className="text-[10px] text-[#6C7781]">Standard industry evaluation window: 50 meters.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#A0AAB2] block">Stratigraphic Normalization Range</label>
              <input
                type="text"
                disabled
                value="η_norm ∈ [0.0 (Top), 1.0 (Base)]"
                className="w-full bg-[#15181B] border border-[#2E343A] rounded-lg p-2 text-[#A0AAB2] font-mono opacity-80"
              />
              <span className="text-[10px] text-[#6C7781]">Standardized across Upper Assam formations.</span>
            </div>
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] space-y-3 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#ED1C24]" />
            <span>Drilling Hazard Risk Classification Thresholds</span>
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#15181B] border border-[#FFC72C]/40">
              <div className="text-[10px] text-[#FFC72C] font-bold">MODERATE RISK</div>
              <div className="text-base font-bold text-white mt-1">0.30 – 0.59</div>
            </div>
            <div className="p-3 rounded-xl bg-[#15181B] border border-orange-500/40">
              <div className="text-[10px] text-orange-400 font-bold">HIGH RISK</div>
              <div className="text-base font-bold text-white mt-1">0.60 – 0.79</div>
            </div>
            <div className="p-3 rounded-xl bg-[#15181B] border border-[#ED1C24]/60">
              <div className="text-[10px] text-[#ED1C24] font-bold">CRITICAL RISK</div>
              <div className="text-base font-bold text-white mt-1">0.80 – 1.00</div>
            </div>
          </div>
        </div>

        {/* WITSML / eRTMAC Stream Integration Mapping */}
        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] space-y-3 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#27AE60]" />
            <span>Real-Time eRTMAC &amp; WITSML Server Integration Mapping</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[#A0AAB2] block mb-1">eRTMAC WITSML 1.4.1.1 Store Endpoint</label>
              <input
                type="text"
                value={witsmlEndpoint}
                onChange={(e) => setWitsmlEndpoint(e.target.value)}
                className="w-full bg-[#15181B] border border-[#2E343A] rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div className="p-3 rounded-lg bg-[#231F20] text-[11px] text-[#A0AAB2]">
              <strong className="text-white">Integration Ready:</strong> The architecture includes standard WITSML channel mapping (WOB, ROP, RPM, ECD, SPP, Torque, Flow, Gas). Currently operating on high-fidelity synthetic eRTMAC simulation stream for prototype demonstration.
            </div>
          </div>
        </div>

        {/* Save & Reset Strip */}
        <div className="flex items-center justify-between pt-3">
          <button
            onClick={() => resetSimulation()}
            className="px-4 py-2 rounded-xl bg-[#231F20] border border-[#2E343A] text-[#A0AAB2] hover:text-white text-xs font-semibold flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Simulator</span>
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold shadow-lg shadow-[#ED1C24]/20 flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccess ? 'Settings Saved!' : 'Save System Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
