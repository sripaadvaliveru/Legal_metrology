import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPinned } from 'lucide-react';
import { analyticsApi, jurisdictionApi } from '@/services/api';

export default function DistrictsPage() {
  const { data: trends, isLoading } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analyticsApi.trends().then(res => res.data),
  });
  const { data: jurisdictions } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: () => jurisdictionApi.list().then(res => res.data),
  });

  const districtNames = jurisdictions
    ?.filter(j => j.level === 'DISTRICT' || j.district)
    .map(j => j.name) ?? [];

  const rows = (trends?.jurisdictionDistribution ?? []).filter(row =>
    districtNames.length === 0 || districtNames.includes(row.name)
  );
  const displayed = rows.length ? rows : trends?.jurisdictionDistribution ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading district data...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">District Overview</h1>
        <p className="text-sm text-gray-500">Instrument distribution across configured districts.</p>
      </div>

      {!displayed.length ? (
        <p className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No district data available yet.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">District / Jurisdiction</th>
                  <th className="px-4 py-3">Registered instruments</th>
                  <th className="px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map(row => {
                  const total = displayed.reduce((sum, item) => sum + item.count, 0);
                  const share = total ? Math.round((row.count / total) * 100) : 0;
                  return (
                    <tr key={row.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                        <MapPinned className="w-4 h-4 text-gray-400" /> {row.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.count}</td>
                      <td className="px-4 py-3">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${share}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
