import { useAuth } from '@/hooks/useAuth';
import { Package, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function BusinessDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Instruments', value: 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Verified', value: 0, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Pending Applications', value: 0, icon: FileText, color: 'bg-yellow-500' },
    { label: 'Expiring Soon', value: 0, icon: Clock, color: 'bg-orange-500' },
    { label: 'Expired', value: 0, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500">Business Dashboard</p>
      </div>

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
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-500">No recent activity. Register an instrument to get started.</p>
      </div>
    </div>
  );
}
