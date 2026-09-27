import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GisMap } from '../components/GisMap';
import { api } from '../services/api';
import { OffsetWellSimilarity } from '../types';
import {
  MapPin,
  Sliders,
  ShieldAlert,
  Clock,
  ChevronRight,
  Compass,
  Layers,
  CheckCircle2,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const NearbyWellsPage: React.FC = () => {
  const { activeWell, activeWellId } = useApp();
  const [offsetWells, setOffsetWells] = useState<OffsetWellSimilarity[]>([]);
  const [selectedOffset, setSelectedOffset] = useState<OffsetWellSimilarity | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25.0);

  // Configurable Weights
  const [weightSpatial, setWeightSpatial] = useState<number>(0.35);
  const [weightTrajectory, setWeightTrajectory] = useState<number>(0.20);
  const [weightStratigraphic, setWeightStratigraphic] = useState<number>(0.30);
  const [weightArchitecture, setWeightArchitecture] = useState<number>(0.15);
  const [loading, setLoading] = useState<boolean>(false);

  // Presets
  const applyPreset = (type: 'BALANCED' | 'GEOLOGY' | 'PROXIMITY') => {
    if (type === 'BALANCED') {
      setWeightSpatial(0.35);
      setWeightTrajectory(0.20);
      setWeightStratigraphic(0.30);
      setWeightArchitecture(0.15);
    } else if (type === 'GEOLOGY') {
      setWeightSpatial(0.15);
      setWeightTrajectory(0.10);
      setWeightStratigraphic(0.60);
      setWeightArchitecture(0.15);
    } else if (type === 'PROXIMITY') {
      setWeightSpatial(0.60);
      setWeightTrajectory(0.15);
      setWeightStratigraphic(0.15);
      setWeightArchitecture(0.10);
    }
  };

  // Recalculate similarity with custom weights
  const recalculateSimilarity = async () => {
    if (!activeWellId) return;
    try {
      setLoading(true);
      const data = await api.getSimilarWellsCustom(activeWellId, {
        weight_spatial: weightSpatial,
        weight_trajectory: weightTrajectory,
        weight_stratigraphic: weightStratigraphic,
        weight_architecture: weightArchitecture,
        max_radius_km: radiusKm
      });
      setOffsetWells(data);
      if (data.length > 0 && !selectedOffset) {
        setSelectedOffset(data[0]);
      }
    } catch (err) {
      console.error('Failed to calculate custom similarity', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    recalculateSimilarity();
  }, [activeWellId, radiusKm, weightSpatial, weightTrajectory, weightStratigraphic, weightArchitecture]);

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Top Banner & Weight Sliders */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E343A] pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[#ED1C24]" />
              <h1 className="text-base font-bold text-white uppercase tracking-wide">
                Nearby Wells Intelligence &amp; Multi-Factor Similarity
              </h1>
            </div>
            <p className="text-xs text-[#A0AAB2] mt-0.5">
              Finding the most relevant historical wells to predict drilling hazards for <strong className="text-white">{activeWell?.well_name}</strong>.
            </p>
          </div>

          {/* Quick Presets & Radius */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 bg-[#15181B] p-1 rounded-xl border border-[#2E343A]">
              <span className="text-[10px] text-[#A0AAB2] uppercase px-1.5 font-bold">Preset:</span>
              <button
                onClick={() => applyPreset('BALANCED')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  weightSpatial === 0.35 && weightStratigraphic === 0.30
                    ? 'bg-[#ED1C24] text-white shadow-md'
                    : 'text-[#A0AAB2] hover:text-white'
                }`}
              >
                ⚖️ Balanced
              </button>
              <button
                onClick={() => applyPreset('GEOLOGY')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  weightStratigraphic === 0.60
                    ? 'bg-[#ED1C24] text-white shadow-md'
                    : 'text-[#A0AAB2] hover:text-white'
                }`}
              >
                🪨 Geology First
              </button>
              <button
                onClick={() => applyPreset('PROXIMITY')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  weightSpatial === 0.60
                    ? 'bg-[#ED1C24] text-white shadow-md'
                    : 'text-[#A0AAB2] hover:text-white'
                }`}
              >
                📍 Closest Radius
              </button>
            </div>

            {/* Radius Selector */}
            <div className="flex items-center space-x-1 bg-[#15181B] p-1 rounded-xl border border-[#2E343A]">
              <span className="text-[10px] text-[#A0AAB2] uppercase px-1.5 font-bold">Radius:</span>
              {[5, 10, 25, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all ${
                    radiusKm === r
                      ? 'bg-[#2D9CDB] text-white'
                      : 'text-[#A0AAB2] hover:text-white'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Factor Weights Configurator */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#A0AAB2] mb-2 uppercase">
            <span className="flex items-center space-x-1.5 text-white">
              <Sliders className="w-3.5 h-3.5 text-[#2D9CDB]" />
              <span>Adjust Similarity Formula Weights (Total = 100%)</span>
            </span>
            <span className="font-mono text-[#27AE60]">
              Active Sum: {((weightSpatial + weightTrajectory + weightStratigraphic + weightArchitecture) * 100).toFixed(0)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#15181B] p-3.5 rounded-xl border border-[#2E343A]">
            <div>
              <div className="flex justify-between text-xs text-[#A0AAB2] mb-1">
                <span>w1: Spatial Proximity</span>
                <span className="font-mono font-bold text-white">{(weightSpatial * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weightSpatial}
                onChange={(e) => setWeightSpatial(Number(e.target.value))}
                className="w-full accent-[#ED1C24] cursor-pointer"
              />
              <span className="text-[10px] text-[#6C7781]">Physical distance between wellheads.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A0AAB2] mb-1">
                <span>w2: Well Trajectory Profile</span>
                <span className="font-mono font-bold text-white">{(weightTrajectory * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weightTrajectory}
                onChange={(e) => setWeightTrajectory(Number(e.target.value))}
                className="w-full accent-[#ED1C24] cursor-pointer"
              />
              <span className="text-[10px] text-[#6C7781]">Inclination, dogleg severity &amp; build rate.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A0AAB2] mb-1">
                <span>w3: Stratigraphic Formation</span>
                <span className="font-mono font-bold text-white">{(weightStratigraphic * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weightStratigraphic}
                onChange={(e) => setWeightStratigraphic(Number(e.target.value))}
                className="w-full accent-[#ED1C24] cursor-pointer"
              />
              <span className="text-[10px] text-[#6C7781]">Formation top overlap &amp; lithology correlation.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A0AAB2] mb-1">
                <span>w4: Wellbore &amp; Mud System</span>
                <span className="font-mono font-bold text-white">{(weightArchitecture * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weightArchitecture}
                onChange={(e) => setWeightArchitecture(Number(e.target.value))}
                className="w-full accent-[#ED1C24] cursor-pointer"
              />
              <span className="text-[10px] text-[#6C7781]">Casing scheme &amp; drilling mud chemistry.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: GIS Map + Ranked Offset Well Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive GIS Map (7 Cols) */}
        <div className="lg:col-span-7 h-[620px] rounded-2xl overflow-hidden border border-[#2E343A] shadow-2xl relative">
          {activeWell && (
            <GisMap
              activeWell={activeWell}
              offsetWells={offsetWells}
              radiusKm={radiusKm}
              onSelectOffsetWell={(ow) => setSelectedOffset(ow)}
              selectedWellId={selectedOffset?.well_id}
            />
          )}
        </div>

        {/* Ranked Offset List & Selected Well Details (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 h-[620px]">
          {/* Selected Well Summary Card */}
          {selectedOffset ? (
            <div className="p-4 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-3 shrink-0">
              <div className="flex items-center justify-between border-b border-[#2E343A] pb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase">{selectedOffset.well_name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#27AE60]/20 text-[#27AE60] font-bold">
                      {Math.round(selectedOffset.overall_similarity_score * 100)}% Match
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A0AAB2] mt-0.5">
                    {selectedOffset.field_name} Field • {(selectedOffset.distance_meters / 1000).toFixed(2)} km away
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-[#A0AAB2] uppercase">Historical NPT</div>
                  <div className="text-sm font-mono font-bold text-[#ED1C24]">
                    {selectedOffset.total_npt_hours} hrs
                  </div>
                </div>
              </div>

              {/* Plain English "Why Relevant" Box */}
              <div className="p-3 rounded-xl bg-[#231F20] border border-[#2D9CDB]/30 space-y-1">
                <div className="text-[10px] font-bold text-[#2D9CDB] uppercase flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Why This Well Is Relevant to Current Drilling:</span>
                </div>
                <p className="text-xs text-[#F5F6F8] leading-relaxed">
                  "{selectedOffset.relevance_explanation}"
                </p>
              </div>

              {/* 4 Factor Contribution Progress Bars */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-[#15181B] border border-[#2E343A]">
                  <div className="text-[#A0AAB2] text-[9px] uppercase">Spatial Match</div>
                  <div className="font-bold text-white">{((selectedOffset.spatial_similarity ?? 0.88) * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 rounded bg-[#15181B] border border-[#2E343A]">
                  <div className="text-[#A0AAB2] text-[9px] uppercase">Trajectory Match</div>
                  <div className="font-bold text-white">{((selectedOffset.trajectory_similarity ?? 0.85) * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 rounded bg-[#15181B] border border-[#2E343A]">
                  <div className="text-[#A0AAB2] text-[9px] uppercase">Geology Overlap</div>
                  <div className="font-bold text-white">{((selectedOffset.stratigraphic_similarity ?? 0.95) * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 rounded bg-[#15181B] border border-[#2E343A]">
                  <div className="text-[#A0AAB2] text-[9px] uppercase">Mud System Match</div>
                  <div className="font-bold text-white">{((selectedOffset.architecture_similarity ?? 0.90) * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] text-center text-xs text-[#A0AAB2]">
              Click any well pin on the map or list below to view detailed breakdown.
            </div>
          )}

          {/* Ranked Offsets Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="text-xs font-bold text-[#A0AAB2] uppercase px-1">
              Top Ranked Offset Wells ({offsetWells.length})
            </div>

            {offsetWells.map((ow, idx) => {
              const isSelected = selectedOffset?.well_id === ow.well_id;
              const matchPct = Math.round(ow.overall_similarity_score * 100);

              let badgeColor = 'bg-[#27AE60]/20 text-[#27AE60] border-[#27AE60]/40';
              if (matchPct < 60) badgeColor = 'bg-[#2D9CDB]/20 text-[#2D9CDB] border-[#2D9CDB]/40';
              else if (matchPct < 80) badgeColor = 'bg-[#FFC72C]/20 text-[#FFC72C] border-[#FFC72C]/40';

              return (
                <div
                  key={ow.well_id}
                  onClick={() => setSelectedOffset(ow)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#231F20] border-[#ED1C24] shadow-lg shadow-[#ED1C24]/10'
                      : 'bg-[#1A1D20] border-[#2E343A] hover:border-[#3A424A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">#{idx + 1} {ow.well_name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${badgeColor}`}>
                        {matchPct}% Match
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#A0AAB2]">
                      {(ow.distance_meters / 1000).toFixed(1)} km
                    </span>
                  </div>

                  <p className="text-[11px] text-[#A0AAB2] line-clamp-2 mt-1.5">
                    {ow.relevance_explanation}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#6C7781] mt-2 pt-2 border-t border-[#2E343A]/50">
                    <span>Hazards: <strong className="text-orange-400">{ow.encountered_hazards.join(', ') || 'None'}</strong></span>
                    <span className="text-[#ED1C24] font-mono font-bold">{ow.total_npt_hours}h NPT</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
