import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Building2, Package, FileText, Users } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Instruments', value: 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Total Businesses', value: 0, icon: Building2, color: 'bg-green-500' },
    { label: 'Total LMOs', value: 0, icon: Users, color: 'bg-yellow-500' },
    { label: 'Pending Applications', value: 0, icon: FileText, color: 'bg-orange-500' },
    { label: 'Compliance %', value: '0%', icon: BarChart3, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500">{user?.role?.replace('_', ' ')} Dashboard</p>
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

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Verification Trend</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder — will use Recharts
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">District Compliance</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder — will use Recharts
          </div>
        </div>
      </div>
    </div>
  );
}
