import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { analyticsApi } from '@/services/api';
import { ClipboardCheck, Clock, CheckCircle, AlertTriangle, MapPin, Loader2 } from 'lucide-react';

export default function LmoDashboard() {
  const { user } = useAuth();
  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => analyticsApi.dashboard().then(res => res.data),
  });

  const stats = [
    { label: "Today's Inspections", value: kpis?.todayInspections ?? 0, icon: ClipboardCheck, color: 'bg-blue-500' },
    { label: 'Assigned', value: kpis?.assignedInspections ?? 0, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Completed', value: kpis?.completedApplications ?? 0, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Failed', value: kpis?.failedInspections ?? 0, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Overdue', value: kpis?.overdueInspections ?? 0, icon: MapPin, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500">LMO Dashboard</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load dashboard data. Please try again later.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Inspections</h2>
            {kpis?.recentActivity && kpis.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {kpis.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      activity.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming inspections.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
