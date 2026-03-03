import { useEffect, useState } from 'react';
import { auditApi } from '../api/dashboard';
import type { AuditLog, Page } from '../types';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDateTime } from '../utils/status';

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-800',
  ASSIGN: 'bg-purple-100 text-purple-800',
  UNASSIGN: 'bg-orange-100 text-orange-800',
  QR_GENERATED: 'bg-indigo-100 text-indigo-800',
  IMAGE_UPLOADED: 'bg-pink-100 text-pink-800',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<Page<AuditLog> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    auditApi.getAll(page, 25)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-500">Complete history of all system actions</p>
        </div>
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
              {logs?.content.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.entityType} #{log.entityId}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.performedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logs && (
        <Pagination
          page={logs.number}
          totalPages={logs.totalPages}
          totalElements={logs.totalElements}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
