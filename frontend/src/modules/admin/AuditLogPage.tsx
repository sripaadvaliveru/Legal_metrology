import { useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { auditApi } from '@/services/api';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.list().then(res => res.data),
  });

  const filtered = logs?.filter(log =>
    !search ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entityId?.toLowerCase().includes(search.toLowerCase()) ||
    log.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-sm text-gray-500">Immutable record of significant system actions.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="w-full max-w-sm text-sm outline-none"
            placeholder="Search action, entity or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading audit logs...
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">Failed to load audit logs.</p>
        ) : !filtered?.length ? (
          <p className="p-6 text-sm text-gray-500">No audit entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Change</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.entityType ? `${log.entityType}: ${log.entityId ?? ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {log.oldValue || log.newValue
                        ? `${log.oldValue ?? '—'} → ${log.newValue ?? '—'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
