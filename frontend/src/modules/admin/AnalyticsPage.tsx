import { useQuery } from '@tanstack/react-query';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import { analyticsApi } from '@/services/api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

function ChartCard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 mb-3">{subtitle}</p>}
      <div className="h-72 mt-3">{children}</div>
    </section>
  );
}

export default function AnalyticsPage() {
  const { data: trends, isLoading, error } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analyticsApi.trends().then(res => res.data),
  });
  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => analyticsApi.dashboard().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        Failed to load analytics data. Please try again later.
      </div>
    );
  }

  const summary = [
    { label: 'Compliance', value: `${kpis?.compliancePercentage ?? 0}%`, icon: CheckCircle2, tone: 'text-green-600' },
    { label: 'Verified instruments', value: kpis?.verifiedInstruments ?? 0, icon: Activity, tone: 'text-blue-600' },
    { label: 'Pending applications', value: kpis?.pendingApplications ?? 0, icon: ClipboardList, tone: 'text-amber-600' },
    { label: 'Failed inspections', value: kpis?.failedInspections ?? 0, icon: AlertTriangle, tone: 'text-red-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics &amp; Insights</h1>
        <p className="text-sm text-gray-500">Statewide verification performance and compliance indicators.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summary.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${item.tone}`} />
                <div>
                  <p className="text-xl font-semibold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly verification trend" subtitle="Certificates issued in the last six months">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends?.monthlyVerifications ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="verificationFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="Verified" stroke="#2563eb" fill="url(#verificationFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Application status" subtitle="Current distribution across all applications">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends?.applicationStatuses ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Applications" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Instrument health" subtitle="Registered instruments by status">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={trends?.instrumentStatuses ?? []}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`}
              >
                {(trends?.instrumentStatuses ?? []).map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Instruments by jurisdiction" subtitle="Where registered instruments are located">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={trends?.jurisdictionDistribution ?? []}
              margin={{ top: 8, right: 16, left: 24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="count" name="Instruments" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
