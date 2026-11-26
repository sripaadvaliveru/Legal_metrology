import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { enforcementApi } from '@/services/api';

const statusClass = (status: string) => {
  switch (status) {
    case 'RESOLVED': return 'bg-green-100 text-green-800';
    case 'DISMISSED': return 'bg-gray-100 text-gray-700';
    case 'UNDER_INVESTIGATION': return 'bg-blue-100 text-blue-800';
    default: return 'bg-red-100 text-red-800';
  }
};

export default function EnforcementPage() {
  const { data: violations, isLoading, error } = useQuery({
    queryKey: ['violations'],
    queryFn: () => enforcementApi.violations().then(res => res.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enforcement &amp; Violations</h1>
        <p className="text-sm text-gray-500">Reported violations and their current investigation status.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading violations...
        </div>
      ) : error ? (
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Failed to load enforcement data.
        </p>
      ) : !violations?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          No violations have been reported.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Reported</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {violations.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {v.violationType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {v.instrument?.instrumentId ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-md">{v.description ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {v.reportDate ? new Date(v.reportDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusClass(v.status)}`}>
                      {v.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
