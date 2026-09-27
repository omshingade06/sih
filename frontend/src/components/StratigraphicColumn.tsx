import React from 'react';
import { FormationInterval, DrillingIncident } from '../types';
import { AlertCircle, Target, ShieldAlert } from 'lucide-react';

interface StratigraphicColumnProps {
  intervals: FormationInterval[];
  currentDepthMd: number;
  currentTvd: number;
  kbElevation: number;
  lookaheadM?: number;
  incidents?: DrillingIncident[];
  onSelectIncident?: (incident: DrillingIncident) => void;
}

export const StratigraphicColumn: React.FC<StratigraphicColumnProps> = ({
  intervals,
  currentDepthMd,
  currentTvd,
  kbElevation,
  lookaheadM = 50,
  incidents = [],
  onSelectIncident
}) => {
  const currentTvdss = currentTvd - kbElevation;
  const lookaheadEndMd = currentDepthMd + lookaheadM;

  // Colors for lithology
  const getLithologyColor = (lithology: string, name: string) => {
    if (name.includes('Barail Arenaceous')) return '#D97706'; // Golden Sandstone
    if (name.includes('Barail Argillaceous')) return '#4B5563'; // Dark Coal-Shale
    if (name.includes('Kopili')) return '#DC2626'; // Overpressured Marine Shale
    if (name.includes('Sylhet')) return '#2563EB'; // Limestone
    if (name.includes('Girujan')) return '#059669'; // Swelling Clay
    if (name.includes('Tipam')) return '#B45309'; // Reservoir Sand
    return '#6B7280';
  };

  // Find active formation
  const activeInterval = intervals.find(
    (iv) => iv.top_md <= currentDepthMd && currentDepthMd <= iv.base_md
  );

  let currentEtaNorm = 0.0;
  if (activeInterval && activeInterval.base_tvdss > activeInterval.top_tvdss) {
    currentEtaNorm = Math.min(
      1.0,
      Math.max(
        0.0,
        (currentTvdss - activeInterval.top_tvdss) /
          (activeInterval.base_tvdss - activeInterval.top_tvdss)
      )
    );
  }

  return (
    <div className="bg-[#1A1D20] border border-[#2E343A] rounded-xl p-4 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2E343A] mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F6F8]">
            Stratigraphic Depth Column &amp; Normalization
          </h3>
          <p className="text-[11px] text-[#A0AAB2]">
            TVDSS = TVD - {kbElevation}m KB | &eta;_norm &isin; [0.0, 1.0]
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#A0AAB2] uppercase">Normalized Position</div>
          <div className="text-xs font-mono font-bold text-[#2D9CDB]">
            &eta;_norm = {currentEtaNorm.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Main Column Visualizer */}
      <div className="flex-1 flex space-x-3 min-h-[360px] overflow-y-auto pr-1">
        {/* Depth Axis */}
        <div className="w-12 text-[10px] font-mono text-[#6C7781] flex flex-col justify-between py-1 border-r border-[#2E343A]">
          <span>0m</span>
          <span>1000m</span>
          <span>2000m</span>
          <span>2800m</span>
          <span>3500m</span>
          <span>4200m</span>
        </div>

        {/* Formation Layers Stack */}
        <div className="flex-1 relative flex flex-col space-y-1">
          {intervals.map((iv) => {
            const isActive = iv.top_md <= currentDepthMd && currentDepthMd <= iv.base_md;
            const isLookahead =
              iv.top_md <= lookaheadEndMd && lookaheadEndMd <= iv.base_md && !isActive;
            const color = getLithologyColor(iv.lithology, iv.formation_name);

            // Filter incidents occurring in this formation
            const formIncidents = incidents.filter(
              (inc) => inc.formation_id === iv.formation_id || inc.formation_name === iv.formation_name
            );

            return (
              <div
                key={iv.id}
                className={`relative p-2 rounded-lg border transition-all ${
                  isActive
                    ? 'border-[#ED1C24] bg-[#ED1C24]/10 shadow-lg shadow-[#ED1C24]/15'
                    : isLookahead
                    ? 'border-[#FFC72C] bg-[#FFC72C]/10'
                    : 'border-[#2E343A] bg-[#15181B]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-[#F5F6F8] truncate">{iv.formation_name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A0AAB2]">
                    {iv.top_md.toFixed(0)}–{iv.base_md.toFixed(0)}m MD
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#A0AAB2] mt-1">
                  <span>{iv.lithology}</span>
                  <span className="font-mono">TVDSS: {iv.top_tvdss.toFixed(0)}m</span>
                </div>

                {/* Active Bit Indicator inside current formation */}
                {isActive && (
                  <div className="mt-2 p-1.5 rounded bg-[#ED1C24]/20 border border-[#ED1C24] flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center space-x-1 text-[#ED1C24] font-bold">
                      <Target className="w-3.5 h-3.5 animate-spin" />
                      <span>BIT AT {currentDepthMd.toFixed(1)}m</span>
                    </div>
                    <span className="text-white text-[10px]">
                      Lookahead +{lookaheadM}m ({lookaheadEndMd.toFixed(1)}m)
                    </span>
                  </div>
                )}

                {/* Historical Hazards in this interval */}
                {formIncidents.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {formIncidents.map((inc) => (
                      <button
                        key={inc.incident_id}
                        onClick={() => onSelectIncident && onSelectIncident(inc)}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center space-x-1 transition-all ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-[#ED1C24]/20 border-[#ED1C24] text-[#ED1C24] hover:bg-[#ED1C24]/40'
                            : 'bg-orange-500/20 border-orange-500 text-orange-300 hover:bg-orange-500/40'
                        }`}
                      >
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>
                          {inc.hazard_type} ({inc.depth_start}m, η={inc.eta_norm})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
