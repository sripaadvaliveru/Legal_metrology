import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { analyticsApi } from '@/services/api';
import { BarChart3, Building2, Package, FileText, Users, Loader2 } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => analyticsApi.dashboard().then(res => res.data),
  });

  const stats = [
    { label: 'Total Instruments', value: kpis?.totalInstruments ?? 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Total Businesses', value: kpis?.totalBusinesses ?? 0, icon: Building2, color: 'bg-green-500' },
    { label: 'Total LMOs', value: kpis?.totalLmos ?? 0, icon: Users, color: 'bg-yellow-500' },
    { label: 'Pending Applications', value: kpis?.pendingApplications ?? 0, icon: FileText, color: 'bg-orange-500' },
    { label: 'Compliance %', value: `${kpis?.compliancePercentage ?? 0}%`, icon: BarChart3, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500">{user?.role?.replace('_', ' ')} Dashboard</p>
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

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Compliance Overview</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Verified', value: kpis?.verifiedInstruments ?? 0 },
                        { name: 'Expired', value: kpis?.expiredInstruments ?? 0 },
                        { name: 'Other', value: Math.max(0, (kpis?.totalInstruments ?? 0) - (kpis?.verifiedInstruments ?? 0) - (kpis?.expiredInstruments ?? 0)) },
                      ].filter(item => item.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#d1d5db" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
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
                        activity.status === 'REJECTED' || activity.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent activity.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
