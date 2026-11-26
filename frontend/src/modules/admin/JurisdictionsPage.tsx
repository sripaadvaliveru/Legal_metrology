import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin } from 'lucide-react';
import { jurisdictionApi } from '@/services/api';

export default function JurisdictionsPage() {
  const { data: jurisdictions, isLoading, error } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: () => jurisdictionApi.list().then(res => res.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jurisdictions</h1>
        <p className="text-sm text-gray-500">Geographical units used for automatic assignment and access control.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading jurisdictions...
        </div>
      ) : error ? (
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Failed to load jurisdictions.
        </p>
      ) : !jurisdictions?.length ? (
        <p className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No jurisdictions have been configured yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jurisdictions.map(j => (
            <div key={j.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900">{j.name}</h2>
                  <p className="text-xs text-gray-500">
                    {j.level}{j.jurisdictionCode ? ` · ${j.jurisdictionCode}` : ''}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {[j.district, j.state].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
