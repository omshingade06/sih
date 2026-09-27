import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { OffsetWellSimilarity } from '../types';
import { useApp } from '../context/AppContext';
import { Layers, Globe, Eye } from 'lucide-react';

interface GisMapProps {
  activeWell: {
    well_id: number;
    well_name: string;
    latitude: number;
    longitude: number;
    field_name: string;
  };
  offsetWells: OffsetWellSimilarity[];
  radiusKm?: number;
  onSelectOffsetWell?: (well: OffsetWellSimilarity) => void;
  selectedWellId?: number;
}

type BasemapStyle = 'dark' | 'satellite' | 'voyager' | 'terrain';

const BASEMAP_API_KEY = import.meta.env.VITE_BASEMAP_API_KEY || 'cb1_401j_1_085755de5fa33453143523cc';

export const GisMap: React.FC<GisMapProps> = ({
  activeWell,
  offsetWells,
  radiusKm = 25,
  onSelectOffsetWell,
  selectedWellId
}) => {
  const { theme } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapStyle, setMapStyle] = useState<BasemapStyle>(theme === 'dark' ? 'dark' : 'voyager');

  const getTileUrl = (style: BasemapStyle) => {
    switch (style) {
      case 'satellite':
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`;
      case 'terrain':
        return `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`;
      case 'voyager':
        return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`;
      case 'dark':
      default:
        return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${BASEMAP_API_KEY}`;
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [activeWell.latitude, activeWell.longitude],
        zoom: 11,
        zoomControl: true,
        attributionControl: false
      });

      const tileUrl = getTileUrl(mapStyle);

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer on mapStyle change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = getTileUrl(mapStyle);

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);
  }, [mapStyle]);

  // Update markers and layers when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Radius Buffers around active well (5km, 10km, radiusKm)
    L.circle([activeWell.latitude, activeWell.longitude], {
      radius: (radiusKm || 25) * 1000,
      color: '#ED1C24',
      weight: 1.5,
      dashArray: '4, 8',
      fillColor: '#ED1C24',
      fillOpacity: theme === 'dark' ? 0.05 : 0.08
    }).addTo(layerGroup);

    // 2. Active Well Marker (Red Glowing Icon)
    const activeIcon = L.divIcon({
      className: 'custom-active-well-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-[#ED1C24]/30 animate-ping absolute"></div>
          <div class="w-6 h-6 rounded-full bg-[#ED1C24] border-2 border-white shadow-xl flex items-center justify-center text-white font-black text-[9px]">
            AW
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const activeMarker = L.marker([activeWell.latitude, activeWell.longitude], { icon: activeIcon }).addTo(layerGroup);
    activeMarker.bindPopup(`
      <div class="p-2 space-y-1 font-sans">
        <div class="text-[10px] font-bold text-[#ED1C24] uppercase tracking-wider">ACTIVE DRILLING WELL</div>
        <div class="text-sm font-bold">${activeWell.well_name}</div>
        <div class="text-xs text-[#A0AAB2]">${activeWell.field_name} Field | Upper Assam</div>
        <div class="text-[11px] text-[#27AE60] font-mono mt-1 font-bold">Status: Active eRTMAC Stream</div>
      </div>
    `);

    // 3. Offset Well Markers color-coded by similarity score
    offsetWells.forEach((ow) => {
      const isSelected = selectedWellId === ow.well_id;
      const scorePct = Math.round(ow.overall_similarity_score * 100);

      let pinColor = '#27AE60'; // High similarity (>80%)
      if (ow.overall_similarity_score < 0.5) {
        pinColor = '#2D9CDB'; // Moderate/Low (<50%)
      } else if (ow.overall_similarity_score < 0.8) {
        pinColor = '#FFC72C'; // Medium (50-80%)
      }

      const offsetIcon = L.divIcon({
        className: 'custom-offset-well-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125">
            <div class="w-5 h-5 rounded-full ${isSelected ? 'ring-4 ring-red-500' : ''}" style="background-color: ${pinColor}; border: 2px solid #FFFFFF; box-shadow: 0 0 10px ${pinColor}88;">
            </div>
            <span class="absolute -top-4 text-[9px] font-mono font-bold px-1 rounded bg-[#1A1D20] text-white border border-[#2E343A]">
              ${scorePct}%
            </span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([ow.latitude, ow.longitude], { icon: offsetIcon }).addTo(layerGroup);

      // Trajectory line from active well to offset well for visual correlation
      if (ow.overall_similarity_score >= 0.75) {
        L.polyline(
          [
            [activeWell.latitude, activeWell.longitude],
            [ow.latitude, ow.longitude]
          ],
          {
            color: pinColor,
            weight: 2,
            dashArray: '4, 6',
            opacity: 0.7
          }
        ).addTo(layerGroup);
      }

      marker.on('click', () => {
        if (onSelectOffsetWell) onSelectOffsetWell(ow);
      });

      const hazardsList = ow.encountered_hazards.length > 0 ? ow.encountered_hazards.join(', ') : 'None recorded';

      marker.bindPopup(`
        <div class="p-2.5 space-y-1.5 font-sans min-w-[220px]">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase text-[#A0AAB2]">Offset Well</span>
            <span class="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style="background-color: ${pinColor}33; color: ${pinColor};">
              ${scorePct}% Match
            </span>
          </div>
          <div class="text-sm font-bold">${ow.well_name}</div>
          <div class="text-xs text-[#A0AAB2]">${ow.field_name} (${(ow.distance_meters / 1000).toFixed(2)} km away)</div>
          
          <div class="border-t border-[#2E343A] pt-1.5 space-y-1 text-xs">
            <div><span class="text-[#A0AAB2]">Hazards:</span> <span class="text-orange-500 font-semibold">${hazardsList}</span></div>
            <div><span class="text-[#A0AAB2]">NPT:</span> <span class="text-[#ED1C24] font-mono font-bold">${ow.total_npt_hours} hrs</span></div>
          </div>
          
          <div class="text-[10px] text-[#A0AAB2] italic bg-[#15181B] p-1.5 rounded border border-[#2E343A] mt-1">
            "${ow.relevance_explanation}"
          </div>
        </div>
      `);
    });

    // Fit bounds if offsets exist
    if (offsetWells.length > 0) {
      const allCoords: L.LatLngTuple[] = [
        [activeWell.latitude, activeWell.longitude],
        ...offsetWells.slice(0, 10).map((ow) => [ow.latitude, ow.longitude] as L.LatLngTuple)
      ];
      map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40], maxZoom: 13 });
    }
  }, [activeWell, offsetWells, radiusKm, selectedWellId, theme]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-[#2E343A] shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Floating Layer Switcher & Basemap API Indicator */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center space-x-1.5 bg-[#1A1D20]/95 backdrop-blur-md border border-[#2E343A] p-1.5 rounded-xl shadow-2xl">
        <div className="flex items-center space-x-1 px-2 py-0.5 border-r border-[#2E343A] mr-1 hidden sm:flex">
          <Globe className="w-3.5 h-3.5 text-[#2D9CDB]" />
          <span className="text-[10px] font-bold text-white uppercase">Basemap:</span>
        </div>
        {[
          { id: 'dark', label: 'Dark', icon: '🌑' },
          { id: 'satellite', label: 'Satellite', icon: '🛰️' },
          { id: 'terrain', label: 'Topo', icon: '⛰️' },
          { id: 'voyager', label: 'Street', icon: '🗺️' }
        ].map((layer) => (
          <button
            key={layer.id}
            onClick={() => setMapStyle(layer.id as BasemapStyle)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
              mapStyle === layer.id
                ? 'bg-[#ED1C24] text-white shadow-md'
                : 'text-[#A0AAB2] hover:text-white hover:bg-[#231F20]'
            }`}
            title={`Switch to ${layer.label} basemap`}
          >
            <span>{layer.icon}</span>
            <span className="hidden md:inline">{layer.label}</span>
          </button>
        ))}
      </div>

      {/* Floating Map Legend & API Key Connected Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#1A1D20]/90 backdrop-blur-md border border-[#2E343A] p-2.5 rounded-xl text-xs space-y-1.5 shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-[#2E343A] pb-1 mb-1">
          <span className="text-[10px] font-bold text-[#A0AAB2] uppercase">Similarity Index (S_ij)</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-[#27AE60] border border-[#27AE60]/30">
            GIS API Active
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#27AE60]"></span>
          <span>High Relevance (&gt;80%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFC72C]"></span>
          <span>Medium Match (50–80%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D9CDB]"></span>
          <span>Baseline (&lt;50%)</span>
        </div>
      </div>
    </div>
  );
};
