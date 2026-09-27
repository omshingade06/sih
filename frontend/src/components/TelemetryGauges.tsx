import React from 'react';
import { TelemetryPoint } from '../types';
import { Activity, AlertCircle, Gauge, Flame, Droplets, Zap, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface TelemetryGaugesProps {
  telemetry: TelemetryPoint | null;
  compact?: boolean;
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ telemetry, compact = false }) => {
  if (!telemetry) {
    return (
      <div className="p-6 text-center text-[#A0AAB2] bg-[#1A1D20] rounded-xl border border-[#2E343A]">
        Connecting to simulated eRTMAC telemetry stream...
      </div>
    );
  }

  const isLossAnomaly = telemetry.is_anomaly && telemetry.anomaly_type === 'Lost Circulation';
  const isStickingAnomaly = telemetry.is_anomaly && telemetry.anomaly_type?.includes('Sticking');
  const isKickAnomaly = telemetry.is_anomaly && telemetry.anomaly_type?.includes('Kick');

  // Delta flow in vs out
  const flowDelta = telemetry.flow_out - telemetry.flow_in;

  const items = [
    {
      label: 'ROP',
      sub: 'Rate of Penetration',
      value: telemetry.ROP.toFixed(1),
      unit: 'm/hr',
      normMin: 5,
      normMax: 35,
      current: telemetry.ROP,
      color: '#2D9CDB',
      isAnomaly: false
    },
    {
      label: 'WOB',
      sub: 'Weight on Bit',
      value: telemetry.WOB.toFixed(1),
      unit: 't',
      normMin: 6,
      normMax: 22,
      current: telemetry.WOB,
      color: '#27AE60',
      isAnomaly: false
    },
    {
      label: 'RPM',
      sub: 'Rotary Speed',
      value: telemetry.RPM.toFixed(0),
      unit: 'RPM',
      normMin: 60,
      normMax: 180,
      current: telemetry.RPM,
      color: '#9B51E0',
      isAnomaly: isStickingAnomaly
    },
    {
      label: 'SPP',
      sub: 'Standpipe Pressure',
      value: telemetry.SPP.toFixed(0),
      unit: 'psi',
      normMin: 1500,
      normMax: 3000,
      current: telemetry.SPP,
      color: isLossAnomaly ? '#ED1C24' : '#F2994A',
      isAnomaly: isLossAnomaly
    },
    {
      label: 'Torque',
      sub: 'Drilling Torque',
      value: telemetry.torque.toFixed(1),
      unit: 'kN·m',
      normMin: 8,
      normMax: 24,
      current: telemetry.torque,
      color: isStickingAnomaly ? '#ED1C24' : '#FFC72C',
      isAnomaly: isStickingAnomaly
    },
    {
      label: 'ECD',
      sub: 'Equiv. Circ. Density',
      value: telemetry.ECD.toFixed(3),
      unit: 'S.G.',
      normMin: 1.15,
      normMax: 1.35,
      current: telemetry.ECD,
      color: '#56CCF2',
      isAnomaly: isKickAnomaly
    },
    {
      label: 'Flow In / Out',
      sub: `In: ${telemetry.flow_in.toFixed(0)} | Out: ${telemetry.flow_out.toFixed(0)}`,
      value: (flowDelta > 0 ? `+${flowDelta.toFixed(0)}` : flowDelta.toFixed(0)),
      unit: 'LPM Δ',
      normMin: -200,
      normMax: 200,
      current: flowDelta,
      color: Math.abs(flowDelta) > 300 ? '#ED1C24' : '#27AE60',
      isAnomaly: Math.abs(flowDelta) > 300
    },
    {
      label: 'Total Gas',
      sub: 'Mud Gas Reading',
      value: telemetry.gas.toFixed(2),
      unit: '%',
      normMin: 0,
      normMax: 3,
      current: telemetry.gas,
      color: telemetry.gas > 2.0 ? '#ED1C24' : '#A0AAB2',
      isAnomaly: isKickAnomaly
    }
  ];

  return (
    <div className="space-y-3">
      {/* Anomaly banner if triggered */}
      {telemetry.is_anomaly && (
        <div className="p-3 rounded-lg bg-[#ED1C24]/20 border border-[#ED1C24] flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2 text-[#ED1C24]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider">
                Active Telemetry Anomaly Detected: {telemetry.anomaly_type}
              </span>
              <p className="text-[11px] text-white/90">
                Real-time drilling telemetry signatures indicate rapid divergence from baseline.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ED1C24] text-white font-bold">
            eRTMAC ALERT
          </span>
        </div>
      )}

      {/* Grid of Gauges */}
      <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'} gap-2.5`}>
        {items.map((item, idx) => {
          const pct = Math.min(
            100,
            Math.max(0, ((item.current - item.normMin) / (item.normMax - item.normMin)) * 100)
          );

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl bg-[#1A1D20] border transition-all ${
                item.isAnomaly
                  ? 'border-[#ED1C24] bg-[#ED1C24]/10 shadow-lg shadow-[#ED1C24]/20'
                  : 'border-[#2E343A] hover:border-[#3A424A]'
              }`}
            >
              <div className="flex items-center justify-between text-[#A0AAB2] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                <span className="text-[9px] font-mono">{item.unit}</span>
              </div>

              <div className="flex items-baseline space-x-1 my-1">
                <span className="text-xl font-bold font-mono tracking-tight text-[#F5F6F8]">
                  {item.value}
                </span>
                <span className="text-[11px] text-[#A0AAB2]">{item.unit}</span>
              </div>

              <div className="text-[10px] text-[#A0AAB2] truncate mb-2">{item.sub}</div>

              {/* Progress bar visualizer */}
              <div className="w-full bg-[#121416] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
