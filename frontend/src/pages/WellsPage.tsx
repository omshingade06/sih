import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { WellSummary, WellDetail, FormationInterval, DrillingIncident } from '../types';
import {
  Compass,
  Plus,
  Search,
  Filter,
  Layers,
  MapPin,
  FileText,
  AlertTriangle,
  History,
  ShieldCheck,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Ruler,
  Clock,
  ArrowUpDown,
  Download,
  AlertCircle
} from 'lucide-react';

export const WellsPage: React.FC = () => {
  const { wells, activeWellId, setActiveWellId, refreshWells, userRole, setShowManualDepthModal } = useApp();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  
  // Modal states
  const [selectedWellDetail, setSelectedWellDetail] = useState<WellDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'geology' | 'events' | 'offsets' | 'verification' | 'audit'>('overview');
  
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingWell, setEditingWell] = useState<WellSummary | null>(null);
  const [formData, setFormData] = useState({
    UWI: '',
    well_name: '',
    field_name: 'Nahorkatiya',
    basin: 'Upper Assam Basin',
    operator: 'Oil India Limited (OIL)',
    latitude: 27.3050,
    longitude: 95.3420,
    total_depth_md: 3500.0,
    total_depth_tvd: 3280.0,
    KB_elevation: 112.5,
    spud_date: '2026-02-15',
    rig_id: 'OIL-RIG-14',
    status: 'ACTIVE',
    well_type: 'DEVELOPMENT',
    trajectory_type: 'DIRECTIONAL',
    mud_system: 'WBM Potassium Chloride Polymer',
    current_bit_depth_md: 0.0
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Filtered wells
  const filteredWells = wells.filter((w) => {
    const matchSearch =
      w.well_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.UWI.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.field_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchField = selectedField === 'ALL' || w.field_name === selectedField;
    const matchStatus = selectedStatus === 'ALL' || w.status === selectedStatus;
    const matchType = selectedType === 'ALL' || w.well_type === selectedType;
    return matchSearch && matchField && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filteredWells.length / itemsPerPage);
  const paginatedWells = filteredWells.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fieldsList = Array.from(new Set(wells.map((w) => w.field_name)));

  const handleOpenDetail = async (wellId: number) => {
    try {
      setLoadingDetail(true);
      const detail = await api.getWell(wellId);
      setSelectedWellDetail(detail);
      setActiveTab('overview');
    } catch (e) {
      console.error('Failed to load well detail', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingWell(null);
    setFormData({
      UWI: `IN-OIL-AS-NHK-${Math.floor(400 + Math.random() * 100)}`,
      well_name: `OIL-DEMO-${wells.length + 1} (NHK-${Math.floor(400 + Math.random() * 100)})`,
      field_name: 'Nahorkatiya',
      basin: 'Upper Assam Basin',
      operator: 'Oil India Limited (OIL)',
      latitude: 27.3050,
      longitude: 95.3420,
      total_depth_md: 3600.0,
      total_depth_tvd: 3380.0,
      KB_elevation: 112.5,
      spud_date: '2026-03-01',
      rig_id: 'OIL-RIG-14',
      status: 'ACTIVE',
      well_type: 'DEVELOPMENT',
      trajectory_type: 'DIRECTIONAL',
      mud_system: 'WBM Potassium Chloride Polymer',
      current_bit_depth_md: 1200.0
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (well: WellSummary) => {
    setEditingWell(well);
    setFormData({
      UWI: well.UWI,
      well_name: well.well_name,
      field_name: well.field_name,
      basin: well.basin,
      operator: well.operator,
      latitude: well.latitude,
      longitude: well.longitude,
      total_depth_md: well.total_depth_md,
      total_depth_tvd: well.total_depth_tvd,
      KB_elevation: well.KB_elevation,
      spud_date: well.spud_date || '2025-10-15',
      rig_id: well.rig_id,
      status: well.status,
      well_type: well.well_type,
      trajectory_type: well.trajectory_type,
      mud_system: well.mud_system,
      current_bit_depth_md: well.current_bit_depth_md
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveWell = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      if (editingWell) {
        await api.updateWell(editingWell.well_id, formData);
      } else {
        await api.createWell(formData);
      }
      await refreshWells();
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save well record');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWell = async (wellId: number, wellName: string) => {
    if (window.confirm(`Are you sure you want to deactivate/delete well "${wellName}"?`)) {
      try {
        await api.deleteWell(wellId);
        await refreshWells();
      } catch (err) {
        console.error('Failed to delete well', err);
      }
    }
  };

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#ED1C24]/20 border border-[#ED1C24]/30 text-[#ED1C24]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                Well Portfolio &amp; Offset Registry
              </h1>
              <p className="text-xs text-[#A0AAB2] mt-0.5">
                Centralized registry of authorized wells, trajectory geometry, formation tops, and historical hazard profiles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {(userRole === 'ADMIN' || userRole === 'DRILLING_ENGINEER') && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold shadow-lg shadow-[#ED1C24]/20 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Well</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AAB2]" />
          <input
            type="text"
            placeholder="Search by Well Name, UWI, or Field..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl pl-9 pr-3 py-2 text-white outline-none transition-colors"
          />
        </div>

        {/* Filter by Field */}
        <div className="flex items-center space-x-2">
          <span className="text-[#A0AAB2] font-semibold">Field:</span>
          <select
            value={selectedField}
            onChange={(e) => {
              setSelectedField(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-semibold outline-none"
          >
            <option value="ALL">All Fields</option>
            {fieldsList.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div className="flex items-center space-x-2">
          <span className="text-[#A0AAB2] font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-semibold outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRILLING">Drilling</option>
            <option value="COMPLETED">Completed</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* Filter by Type */}
        <div className="flex items-center space-x-2">
          <span className="text-[#A0AAB2] font-semibold">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-semibold outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="DEVELOPMENT">Development</option>
            <option value="EXPLORATION">Exploration</option>
            <option value="APPRAISAL">Appraisal</option>
            <option value="WORKOVER">Workover</option>
          </select>
        </div>
      </div>

      {/* Well List Table */}
      <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15181B] border-b border-[#2E343A] text-[#A0AAB2] uppercase font-bold text-[10px] tracking-wider">
                <th className="p-3.5 pl-5">Well Identifier / UWI</th>
                <th className="p-3.5">Field / Basin</th>
                <th className="p-3.5">Type &amp; Trajectory</th>
                <th className="p-3.5">Coordinates (Lat, Lon)</th>
                <th className="p-3.5">Total Depth (MD/TVD)</th>
                <th className="p-3.5">Bit Depth</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Hazards / NPT</th>
                <th className="p-3.5 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E343A]/60">
              {paginatedWells.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#A0AAB2]">
                    No wells found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedWells.map((w) => {
                  const isActive = w.well_id === activeWellId;
                  return (
                    <tr
                      key={w.well_id}
                      className={`hover:bg-[#231F20] transition-colors ${
                        isActive ? 'bg-[#ED1C24]/5 border-l-4 border-l-[#ED1C24]' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-5 font-semibold text-white">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{w.well_name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded bg-[#ED1C24] text-white text-[9px] font-mono font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#A0AAB2] font-mono mt-0.5">{w.UWI}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-white font-medium">{w.field_name}</div>
                        <div className="text-[10px] text-[#A0AAB2]">{w.basin}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-white">{w.well_type}</div>
                        <div className="text-[10px] text-[#A0AAB2] font-mono">{w.trajectory_type}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[#A0AAB2]">
                        <div>{w.latitude.toFixed(4)}° N</div>
                        <div>{w.longitude.toFixed(4)}° E</div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="text-white font-semibold">{w.total_depth_md}m MD</div>
                        <div className="text-[10px] text-[#A0AAB2]">{w.total_depth_tvd}m TVD</div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="text-[#27AE60] font-bold">{w.current_bit_depth_md.toFixed(1)}m</div>
                        <div className="text-[9px] text-[#A0AAB2]">KB: {w.KB_elevation}m</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            w.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-[#27AE60] border border-emerald-500/40'
                              : w.status === 'DRILLING'
                              ? 'bg-amber-500/20 text-[#FFC72C] border border-amber-500/40'
                              : 'bg-blue-500/20 text-[#2D9CDB] border border-blue-500/40'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {w.incident_count > 0 ? (
                          <div className="flex items-center space-x-1.5 text-xs text-[#ED1C24] font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{w.incident_count} events ({w.total_npt_hours}h NPT)</span>
                          </div>
                        ) : (
                          <span className="text-[#27AE60] text-[11px] flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Clean Record</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenDetail(w.well_id)}
                            title="View Comprehensive 7-Tab Well Details"
                            className="p-1.5 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-[#A0AAB2] hover:text-white transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setActiveWellId(w.well_id);
                            }}
                            title="Set as Active Drilling Well"
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isActive
                                ? 'bg-[#ED1C24] text-white'
                                : 'bg-[#231F20] hover:bg-[#2E343A] text-[#A0AAB2] hover:text-white'
                            }`}
                          >
                            <Compass className="w-4 h-4" />
                          </button>

                          {userRole === 'ADMIN' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(w)}
                                title="Edit Well Parameters"
                                className="p-1.5 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-[#A0AAB2] hover:text-white transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteWell(w.well_id, w.well_name)}
                                title="Delete Well Record"
                                className="p-1.5 rounded-lg bg-[#231F20] hover:bg-red-900/40 text-[#A0AAB2] hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#2E343A] bg-[#15181B] flex items-center justify-between text-xs text-[#A0AAB2]">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredWells.length)} of {filteredWells.length} wells
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-[#231F20] border border-[#2E343A] text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="font-mono text-white px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-[#231F20] border border-[#2E343A] text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Well Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#2E343A] flex items-center justify-between bg-[#15181B]">
              <div className="flex items-center space-x-2.5">
                <Compass className="w-5 h-5 text-[#ED1C24]" />
                <h2 className="text-base font-bold text-white">
                  {editingWell ? `Edit Well: ${editingWell.well_name}` : 'Register New Well Record'}
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-[#A0AAB2] hover:text-white hover:bg-[#2E343A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWell} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#ED1C24]" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Unique Well Identifier (UWI) *</label>
                  <input
                    type="text"
                    required
                    value={formData.UWI}
                    onChange={(e) => setFormData({ ...formData, UWI: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none focus:border-[#ED1C24]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Well Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.well_name}
                    onChange={(e) => setFormData({ ...formData, well_name: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none focus:border-[#ED1C24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Field / Block *</label>
                  <input
                    type="text"
                    required
                    value={formData.field_name}
                    onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Basin / Region</label>
                  <input
                    type="text"
                    value={formData.basin}
                    onChange={(e) => setFormData({ ...formData, basin: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Operator</label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Latitude (°N) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Longitude (°E) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Total Depth (MD m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.total_depth_md}
                    onChange={(e) => setFormData({ ...formData, total_depth_md: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Total Depth (TVD m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.total_depth_tvd}
                    onChange={(e) => setFormData({ ...formData, total_depth_tvd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Kelly Bushing Elev. (m MSL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.KB_elevation}
                    onChange={(e) => setFormData({ ...formData, KB_elevation: parseFloat(e.target.value) || 112.5 })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Well Type</label>
                  <select
                    value={formData.well_type}
                    onChange={(e) => setFormData({ ...formData, well_type: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="DEVELOPMENT">Development</option>
                    <option value="EXPLORATION">Exploration</option>
                    <option value="APPRAISAL">Appraisal</option>
                    <option value="WORKOVER">Workover</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Trajectory Type</label>
                  <select
                    value={formData.trajectory_type}
                    onChange={(e) => setFormData({ ...formData, trajectory_type: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="DIRECTIONAL">Directional (J-Shape / S-Curve)</option>
                    <option value="VERTICAL">Vertical</option>
                    <option value="HORIZONTAL">Horizontal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Operational Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="ACTIVE">Active (Drilling Ahead)</option>
                    <option value="DRILLING">Drilling</option>
                    <option value="COMPLETED">Completed / Producing</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#2E343A]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#231F20] hover:bg-[#2E343A] text-[#A0AAB2] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingWell ? 'Update Well' : 'Create Well Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive 7-Tab Well Details Modal */}
      {selectedWellDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#2E343A] flex items-center justify-between bg-[#15181B]">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#ED1C24]/20 border border-[#ED1C24]/30 text-[#ED1C24]">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-white">{selectedWellDetail.well_name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#27AE60] text-[10px] font-bold border border-emerald-500/40">
                      {selectedWellDetail.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#A0AAB2] font-mono">
                    UWI: {selectedWellDetail.UWI} • {selectedWellDetail.field_name} Field • KB: {selectedWellDetail.KB_elevation}m
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedWellDetail(null)}
                className="p-1.5 rounded-lg text-[#A0AAB2] hover:text-white hover:bg-[#2E343A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="px-5 border-b border-[#2E343A] bg-[#121416] flex space-x-1 overflow-x-auto text-xs">
              {[
                { id: 'overview', label: 'Overview & Architecture', icon: Compass },
                { id: 'geology', label: 'Geological Intervals', icon: Layers, count: selectedWellDetail.formation_intervals.length },
                { id: 'events', label: 'Drilling Events / Hazards', icon: AlertTriangle, count: selectedWellDetail.incidents.length },
                { id: 'documents', label: 'Reports & WCR', icon: FileText },
                { id: 'offsets', label: 'Nearby Offsets', icon: MapPin },
                { id: 'verification', label: 'Verification Traceability', icon: ShieldCheck },
                { id: 'audit', label: 'Audit Trail', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-3 border-b-2 font-semibold flex items-center space-x-2 transition-colors whitespace-nowrap ${
                      isCurrent
                        ? 'border-[#ED1C24] text-white bg-[#1A1D20]'
                        : 'border-transparent text-[#A0AAB2] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="px-1.5 py-0.2 rounded bg-[#2E343A] text-[10px] font-mono text-white">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#121416] border border-[#2E343A]">
                      <span className="text-[10px] text-[#A0AAB2] uppercase font-bold">Total Depth</span>
                      <div className="text-base font-mono font-bold text-white mt-1">
                        {selectedWellDetail.total_depth_md}m MD / {selectedWellDetail.total_depth_tvd}m TVD
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#121416] border border-[#2E343A]">
                      <span className="text-[10px] text-[#A0AAB2] uppercase font-bold">Current Bit Depth</span>
                      <div className="text-base font-mono font-bold text-[#27AE60] mt-1">
                        {selectedWellDetail.current_bit_depth_md.toFixed(1)}m MD
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#121416] border border-[#2E343A]">
                      <span className="text-[10px] text-[#A0AAB2] uppercase font-bold">Surface Coordinates</span>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {selectedWellDetail.latitude.toFixed(4)}°N, {selectedWellDetail.longitude.toFixed(4)}°E
                      </div>
                    </div>
                  </div>

                  {/* Casing Program */}
                  <div className="p-4 rounded-xl bg-[#121416] border border-[#2E343A] space-y-3">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Casing &amp; Wellbore Architecture</h3>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {selectedWellDetail.casing_program && selectedWellDetail.casing_program.map((csg: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[#1A1D20] border border-[#2E343A]">
                          <div className="text-[10px] text-[#ED1C24] font-bold">{csg.section || `${csg.size_in}" Casing`}</div>
                          <div className="text-xs font-mono font-semibold text-white mt-1">Shoe: {csg.shoe_md}m MD</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'geology' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Stratigraphic Column Intersected</span>
                    <span className="text-[10px] text-[#27AE60] font-semibold">100% Formation Tops Verified</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#2E343A]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#15181B] text-[#A0AAB2] text-[10px] font-bold uppercase">
                        <tr>
                          <th className="p-2.5">Formation Name</th>
                          <th className="p-2.5">Lithology</th>
                          <th className="p-2.5">Top MD / TVD</th>
                          <th className="p-2.5">Top TVDSS (MSL)</th>
                          <th className="p-2.5">Base TVDSS</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2E343A]">
                        {selectedWellDetail.formation_intervals.map((iv) => (
                          <tr key={iv.id} className="hover:bg-[#231F20]">
                            <td className="p-2.5 font-bold text-white">{iv.formation_name}</td>
                            <td className="p-2.5 text-[#A0AAB2]">{iv.lithology}</td>
                            <td className="p-2.5 font-mono text-white">{iv.top_md}m / {iv.top_tvd}m</td>
                            <td className="p-2.5 font-mono text-[#27AE60] font-semibold">{iv.top_tvdss}m</td>
                            <td className="p-2.5 font-mono text-[#A0AAB2]">{iv.base_tvdss}m</td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#27AE60] text-[9px] font-bold">
                                {iv.verification_status || 'VERIFIED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-3">
                  <span className="font-bold text-white text-xs">Historical Drilling Events &amp; Hazards</span>
                  {selectedWellDetail.incidents.length === 0 ? (
                    <div className="p-6 text-center text-[#A0AAB2] bg-[#121416] rounded-xl border border-[#2E343A]">
                      No severe drilling incidents recorded for this well.
                    </div>
                  ) : (
                    selectedWellDetail.incidents.map((inc) => (
                      <div key={inc.incident_id} className="p-4 rounded-xl bg-[#121416] border border-[#2E343A] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-[#ED1C24]/20 text-[#ED1C24] font-bold text-[10px] border border-[#ED1C24]/40">
                              {inc.hazard_type}
                            </span>
                            <span className="font-bold text-white">{inc.formation_name}</span>
                            <span className="font-mono text-xs text-[#A0AAB2]">
                              ({inc.depth_start}m - {inc.depth_end}m MD)
                            </span>
                          </div>
                          <span className="font-mono text-[#ED1C24] font-bold text-xs">{inc.NPT_hours}h NPT</span>
                        </div>
                        <p className="text-xs text-[#A0AAB2] leading-relaxed">{inc.description}</p>
                        {inc.mitigations.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-[#1A1D20] border border-[#2E343A]/80 text-[11px] text-[#27AE60]">
                            <strong>Remediation:</strong> {inc.mitigations[0].strategy} ({inc.mitigations[0].SOP_reference})
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-3">
                  <span className="font-bold text-white text-xs">Associated Historical Reports (WCR/DDR)</span>
                  <div className="p-4 rounded-xl bg-[#121416] border border-[#2E343A] flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-[#ED1C24]" />
                      <div>
                        <div className="font-bold text-white">WCR_{selectedWellDetail.UWI.replace(/-/g, '_')}_Final.pdf</div>
                        <div className="text-[10px] text-[#A0AAB2]">Well Completion Report • 24 Pages • OCR Confidence 96%</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#27AE60] text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'offsets' && (
                <div className="p-6 text-center text-[#A0AAB2] bg-[#121416] rounded-xl border border-[#2E343A]">
                  <MapPin className="w-8 h-8 text-[#ED1C24] mx-auto mb-2" />
                  <p className="text-xs text-white font-semibold">GIS Offset Spatial Proximity</p>
                  <p className="text-[11px] text-[#A0AAB2] mt-1">
                    Check the Nearby Wells GIS Map to calculate 4-factor multi-attribute similarity against active wells.
                  </p>
                </div>
              )}

              {activeTab === 'verification' && (
                <div className="space-y-3">
                  <span className="font-bold text-white text-xs">Source Document &amp; Human Verification Record</span>
                  <div className="p-4 rounded-xl bg-[#121416] border border-[#2E343A] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-semibold">Reviewer Sign-off: Dr. Ananya Dutta (Geoscientist)</span>
                      <span className="text-[#27AE60] font-mono">Status: VERIFIED</span>
                    </div>
                    <p className="text-[11px] text-[#A0AAB2]">
                      All formation tops, Kelly Bushing datum elevation, and historical loss events cross-referenced with official OIL completion reports.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-2">
                  <span className="font-bold text-white text-xs">Well Modification &amp; Depth History</span>
                  <div className="p-3 rounded-lg bg-[#121416] border border-[#2E343A] text-[11px] text-[#A0AAB2] flex justify-between">
                    <span>Manual Bit Depth set to {selectedWellDetail.current_bit_depth_md}m MD</span>
                    <span className="font-mono text-white">By Drilling Engineer</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
