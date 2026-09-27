import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  Compass,
  Layers,
  Ruler
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.getAuditLogs({ limit: 200 });
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchEntity = entityFilter === 'ALL' || log.entity_type === entityFilter;

    return matchSearch && matchAction && matchEntity;
  });

  const actionsList = Array.from(new Set(logs.map((l) => l.action)));
  const entitiesList = Array.from(new Set(logs.map((l) => l.entity_type)));

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#ED1C24]/20 border border-[#ED1C24]/30 text-[#ED1C24]">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              System Audit Trail &amp; Verification Governance
            </h1>
            <p className="text-xs text-[#A0AAB2] mt-0.5">
              Immutable ledger of user actions: manual depth inputs, field corrections, document approvals, user logins, and alert review decisions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-[#27AE60]">
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Logging Active (ISO 27001 / Oil Industry Compliance)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AAB2]" />
          <input
            type="text"
            placeholder="Search audit records by user, reason, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl pl-9 pr-3 py-2 text-white outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[#A0AAB2] font-semibold">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none font-semibold"
          >
            <option value="ALL">All Actions</option>
            {actionsList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[#A0AAB2] font-semibold">Entity Type:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none font-semibold"
          >
            <option value="ALL">All Entities</option>
            {entitiesList.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#15181B] border-b border-[#2E343A] text-[#A0AAB2] text-[10px] font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">User &amp; Role</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5 pr-5">Operational Details / Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E343A]/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#A0AAB2]">
                    No audit log records matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const formattedTime = new Date(log.timestamp).toLocaleString();
                  return (
                    <tr key={log.id} className="hover:bg-[#231F20] transition-colors">
                      <td className="p-3.5 pl-5 font-mono text-[11px] text-[#A0AAB2] whitespace-nowrap">
                        {formattedTime}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{log.user_name}</div>
                        <div className="text-[10px] text-[#A0AAB2] font-mono">{log.role}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.action.includes('APPROVE')
                              ? 'bg-emerald-950 text-[#27AE60] border border-emerald-800'
                              : log.action.includes('REJECT')
                              ? 'bg-red-950 text-[#ED1C24] border border-red-800'
                              : log.action.includes('DEPTH')
                              ? 'bg-blue-950 text-[#2D9CDB] border border-blue-800'
                              : 'bg-[#231F20] text-white border border-[#2E343A]'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-white text-[11px]">
                        {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                      </td>
                      <td className="p-3.5 pr-5 text-white">
                        <div>{log.reason || 'Routine operation logged'}</div>
                        {log.after_state && (
                          <div className="text-[10px] text-[#6C7781] font-mono mt-0.5 truncate max-w-md">
                            State: {JSON.stringify(log.after_state)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
