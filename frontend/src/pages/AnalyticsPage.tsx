import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, TrendingDown, Clock, ShieldCheck, Droplets, Layers } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await api.getAnalyticsSummary();
        setAnalyticsData(data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#ED1C24', '#F2994A', '#FFC72C', '#2D9CDB', '#27AE60', '#9B51E0'];

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-xl bg-[#1A1D20] border border-[#2E343A] shadow-xl">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-[#ED1C24]" />
          <h1 className="text-base font-bold text-white uppercase tracking-wider">
            Drilling Intelligence &amp; NPT Analytics
          </h1>
        </div>
        <p className="text-xs text-[#A0AAB2] mt-0.5">
          Operational statistics, hazard distribution, and mitigation efficacy across Upper Assam fields.
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-1">
          <div className="text-[10px] text-[#A0AAB2] uppercase">Monitored Wells</div>
          <div className="text-2xl font-mono font-black text-white">
            {analyticsData?.kpis?.total_wells || 22}
          </div>
          <div className="text-[10px] text-[#27AE60]">Nahorkatiya &amp; Moran</div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-1">
          <div className="text-[10px] text-[#A0AAB2] uppercase">Historical Incidents</div>
          <div className="text-2xl font-mono font-black text-orange-400">
            {analyticsData?.kpis?.total_incidents || 38}
          </div>
          <div className="text-[10px] text-[#A0AAB2]">Recorded events</div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-1">
          <div className="text-[10px] text-[#A0AAB2] uppercase">Total NPT Accrued</div>
          <div className="text-2xl font-mono font-black text-[#ED1C24]">
            {analyticsData?.kpis?.total_npt_hours || 246.5}h
          </div>
          <div className="text-[10px] text-[#A0AAB2]">Historical impact</div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-1">
          <div className="text-[10px] text-[#A0AAB2] uppercase">Mud Volume Lost</div>
          <div className="text-2xl font-mono font-black text-[#2D9CDB]">
            {analyticsData?.kpis?.total_mud_lost_m3 || 480} m³
          </div>
          <div className="text-[10px] text-[#A0AAB2]">Sub-hydrostatic loss</div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-1">
          <div className="text-[10px] text-[#A0AAB2] uppercase">Mitigation Efficacy</div>
          <div className="text-2xl font-mono font-black text-[#27AE60]">
            {analyticsData?.kpis?.mitigation_success_rate_pct || 94.5}%
          </div>
          <div className="text-[10px] text-[#27AE60]">SOP Resolution rate</div>
        </div>

        <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] space-y-1">
          <div className="text-[10px] text-[#A0AAB2] uppercase">NPT Saved by SOPs</div>
          <div className="text-2xl font-mono font-black text-[#FFC72C]">
            {analyticsData?.kpis?.total_npt_saved_hours || 184.0}h
          </div>
          <div className="text-[10px] text-[#FFC72C]">Avoided downtime</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* NPT Impact by Hazard Type (Bar Chart) */}
        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-white uppercase border-b border-[#2E343A] pb-2">
            <span>Non-Productive Time (NPT) by Hazard Category</span>
            <span className="text-[#ED1C24] font-mono">Hours Lost</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.npt_by_hazard || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2E343A" />
                <XAxis type="number" stroke="#6C7781" tick={{ fontSize: 10 }} />
                <YAxis dataKey="hazard_type" type="category" stroke="#6C7781" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderColor: '#2E343A' }} />
                <Bar dataKey="npt_hours" fill="#ED1C24" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Formation Incident Frequency (Bar Chart) */}
        <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-white uppercase border-b border-[#2E343A] pb-2">
            <span>Incident Count by Geological Horizon</span>
            <span className="text-[#2D9CDB] font-mono">Formations</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.formation_risk || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E343A" />
                <XAxis dataKey="formation_name" stroke="#6C7781" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis stroke="#6C7781" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderColor: '#2E343A' }} />
                <Bar dataKey="incident_count" fill="#2D9CDB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
