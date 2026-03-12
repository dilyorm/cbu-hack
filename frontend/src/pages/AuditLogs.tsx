import { useEffect, useState } from 'react';
import { auditApi } from '../api/dashboard';
import type { AuditFilters } from '../api/dashboard';
import type { AuditLog, Page } from '../types';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDateTime } from '../utils/status';

const ACTION_OPTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE',
  'ASSIGN', 'UNASSIGN', 'QR_GENERATED', 'IMAGE_UPLOADED', 'LOGIN', 'REGISTER',
];

const ENTITY_TYPE_OPTIONS = ['ASSET', 'EMPLOYEE', 'DEPARTMENT', 'BRANCH', 'USER'];

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-800',
  ASSIGN: 'bg-purple-100 text-purple-800',
  UNASSIGN: 'bg-orange-100 text-orange-800',
  QR_GENERATED: 'bg-indigo-100 text-indigo-800',
  IMAGE_UPLOADED: 'bg-pink-100 text-pink-800',
  LOGIN: 'bg-teal-100 text-teal-800',
  REGISTER: 'bg-cyan-100 text-cyan-800',
};

const emptyFilters: AuditFilters = {
  action: '',
  entityType: '',
  performedBy: '',
  startDate: '',
  endDate: '',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<Page<AuditLog> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters);
  const [applied, setApplied] = useState<AuditFilters>(emptyFilters);

  const fetchLogs = (p: number, f: AuditFilters) => {
    setLoading(true);
    auditApi.getAll(p, 25, f)
      .then(data => { setLogs(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(page, applied);
  }, [page, applied]);

  const handleApply = () => {
    setPage(0);
    setApplied({ ...filters });
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setPage(0);
    setApplied(emptyFilters);
  };

  const hasActiveFilters =
    !!applied.action || !!applied.entityType ||
    !!applied.performedBy || !!applied.startDate || !!applied.endDate;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Action */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map(a => (
                <option key={a} value={a}>{a.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Entity type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All entities</option>
              {ENTITY_TYPE_OPTIONS.map(et => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>

          {/* Performed by */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Performed By</label>
            <input
              type="text"
              value={filters.performedBy}
              onChange={e => setFilters(f => ({ ...f, performedBy: e.target.value }))}
              placeholder="Username..."
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Start date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* End date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleApply}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            Apply
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
          {hasActiveFilters && (
            <span className="text-xs text-indigo-600 font-medium">Filters active</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
            <p className="text-sm text-gray-500">Complete history of all system actions</p>
          </div>
          {logs && (
            <span className="text-sm text-gray-500">{logs.totalElements} record{logs.totalElements !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs?.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      No audit logs match the current filters.
                    </td>
                  </tr>
                ) : (
                  logs?.content.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] ?? 'bg-gray-100 text-gray-800'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.entityType} #{log.entityId}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{log.performedBy}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {logs && logs.totalPages > 1 && (
        <Pagination
          page={logs.number}
          totalPages={logs.totalPages}
          totalElements={logs.totalElements}
          onPageChange={p => { setPage(p); }}
        />
      )}
    </div>
  );
}
