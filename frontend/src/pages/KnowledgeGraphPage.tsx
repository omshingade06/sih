import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { KnowledgeGraphData } from '../types';
import { Network, Search, Filter, Layers, ShieldAlert, CheckCircle2, ChevronRight, Compass } from 'lucide-react';

export const KnowledgeGraphPage: React.FC = () => {
  const { activeWellId } = useApp();
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await api.getKnowledgeGraph(activeWellId);
        setGraphData(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      } catch (err) {
        console.error('Failed to load knowledge graph', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [activeWellId]);

  const filteredNodes = graphData.nodes.filter((node) => {
    const matchesType = filterType === 'ALL' || node.node_type.toUpperCase() === filterType.toUpperCase();
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Well':
        return '#ED1C24';
      case 'Borehole':
        return '#9B51E0';
      case 'Formation':
        return '#2D9CDB';
      case 'Incident':
        return '#FFC72C';
      case 'Mitigation':
        return '#27AE60';
      default:
        return '#A0AAB2';
    }
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-[#ED1C24]" />
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              Enterprise Knowledge Graph Explorer
            </h1>
          </div>
          <p className="text-xs text-[#A0AAB2] mt-0.5">
            Relational chain linking: <span className="text-white font-semibold">Well → Borehole → Formation → Drilling Incident → Mitigation Strategy</span>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-[#15181B] p-1 rounded-xl border border-[#2E343A]">
          {['ALL', 'WELL', 'FORMATION', 'INCIDENT', 'MITIGATION'].map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === ft
                  ? 'bg-[#ED1C24] text-white shadow-md'
                  : 'text-[#A0AAB2] hover:text-white'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Graph Visualizer + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive SVG Network Graph (8 Cols) */}
        <div className="lg:col-span-8 bg-[#1A1D20] border border-[#2E343A] rounded-2xl p-4 flex flex-col h-[580px] shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#2E343A] z-10">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white uppercase">Visual Graph Topology</span>
              <span className="text-[10px] font-mono text-[#A0AAB2]">
                ({filteredNodes.length} nodes, {graphData.edges.length} edges)
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <span className="text-[#ED1C24]">● Well</span>
              <span className="text-[#2D9CDB]">● Formation</span>
              <span className="text-[#FFC72C]">● Incident</span>
              <span className="text-[#27AE60]">● Mitigation</span>
            </div>
          </div>

          {/* SVG Canvas with Interactive Circular Layout */}
          <div className="flex-1 relative flex items-center justify-center overflow-auto">
            <svg className="w-full h-full min-w-[500px] min-h-[460px]">
              {/* Draw Edges */}
              {graphData.edges.map((edge, idx) => {
                const sIdx = filteredNodes.findIndex((n) => n.id === edge.source);
                const tIdx = filteredNodes.findIndex((n) => n.id === edge.target);
                if (sIdx === -1 || tIdx === -1) return null;

                const total = filteredNodes.length || 1;
                const cx = 320;
                const cy = 230;
                const radius = 170;

                const sAngle = (sIdx / total) * 2 * Math.PI;
                const tAngle = (tIdx / total) * 2 * Math.PI;

                const x1 = cx + radius * Math.cos(sAngle);
                const y1 = cy + radius * Math.sin(sAngle);
                const x2 = cx + radius * Math.cos(tAngle);
                const y2 = cy + radius * Math.sin(tAngle);

                return (
                  <g key={idx}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#2E343A"
                      strokeWidth="1.5"
                      strokeDasharray={edge.relation_type === 'MITIGATED_BY' ? '3,3' : 'none'}
                    />
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {filteredNodes.map((node, idx) => {
                const total = filteredNodes.length || 1;
                const cx = 320;
                const cy = 230;
                const radius = 170;
                const angle = (idx / total) * 2 * Math.PI;
                const x = cx + radius * Math.cos(angle);
                const y = cy + radius * Math.sin(angle);
                const color = getNodeColor(node.node_type);
                const isSelected = selectedNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedNode(node)}
                  >
                    <circle
                      r={isSelected ? 22 : 16}
                      fill="#1A1D20"
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-200 group-hover:scale-125 shadow-lg"
                    />
                    <circle r={6} fill={color} />
                    <text
                      y={isSelected ? 34 : 26}
                      textAnchor="middle"
                      fill="#F5F6F8"
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {node.label.length > 14 ? node.label.slice(0, 12) + '..' : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Node Detail & Relationship Inspector (4 Cols) */}
        <div className="lg:col-span-4 bg-[#1A1D20] border border-[#2E343A] rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#2E343A] pb-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Node Inspector
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${getNodeColor(selectedNode?.node_type || 'Well')}22`,
                  color: getNodeColor(selectedNode?.node_type || 'Well')
                }}
              >
                {selectedNode?.node_type}
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedNode.label}</h3>
                  <div className="text-[11px] text-[#A0AAB2] font-mono">ID: {selectedNode.id}</div>
                </div>

                {/* Properties Table */}
                <div className="p-3 rounded-xl bg-[#15181B] border border-[#2E343A] space-y-1.5 font-mono text-[11px]">
                  <div className="text-[10px] font-sans font-bold uppercase text-[#A0AAB2] mb-1">
                    Node Metadata
                  </div>
                  {selectedNode.properties &&
                    Object.entries(selectedNode.properties).map(([k, v]: any) => (
                      <div key={k} className="flex items-center justify-between border-b border-[#2E343A]/40 pb-1">
                        <span className="text-[#A0AAB2] capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="text-white font-bold truncate max-w-[160px]">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Relationship Chain Path */}
                <div className="p-3 rounded-xl bg-[#231F20] border border-[#2E343A] space-y-2">
                  <div className="text-[10px] font-bold text-[#FFC72C] uppercase">
                    Connected Graph Path:
                  </div>
                  <div className="text-xs text-white space-y-1">
                    <div className="flex items-center space-x-1.5 text-[#ED1C24]">
                      <span>● OIL-DEMO-001</span>
                      <ChevronRight className="w-3 h-3 text-[#A0AAB2]" />
                      <span className="text-[#2D9CDB]">Barail Sandstone</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-orange-400 pl-4">
                      <ChevronRight className="w-3 h-3 text-[#A0AAB2]" />
                      <span>Lost Circulation Event (2862m)</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[#27AE60] pl-8">
                      <ChevronRight className="w-3 h-3 text-[#A0AAB2]" />
                      <span>High-Perm LCM Pill (SOP-042)</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#A0AAB2] text-center py-8">
                Click any node on the graph canvas to inspect relationships.
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#15181B] border border-[#2E343A] text-[10px] text-[#6C7781]">
            Graph schema: Well HAS_BOREHOLE Borehole INTERSECTS Formation EXPERIENCED Incident MITIGATED_BY Mitigation.
          </div>
        </div>
      </div>
    </div>
  );
};
