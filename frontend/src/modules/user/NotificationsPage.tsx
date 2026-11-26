import { useQuery } from '@tanstack/react-query';
import { Bell, Loader2 } from 'lucide-react';
import { notificationApi } from '@/services/api';

export default function NotificationsPage() {
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(res => res.data),
  });

  const isRead = (n: any) => n.isRead ?? n.read ?? false;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500">Application, assignment and certificate updates.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading notifications...
        </div>
      ) : error ? (
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Failed to load notifications.
        </p>
      ) : !notifications?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          You have no notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border p-4 shadow-sm ${isRead(n) ? 'border-gray-200' : 'border-blue-300'}`}
            >
              <div className="flex items-start gap-3">
                <Bell className={`w-5 h-5 mt-0.5 ${isRead(n) ? 'text-gray-400' : 'text-blue-600'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {n.type?.replace(/_/g, ' ')}
                    {n.createdAt ? ` · ${new Date(n.createdAt).toLocaleString()}` : ''}
                  </p>
                </div>
                {!isRead(n) && <span className="w-2 h-2 rounded-full bg-blue-600 mt-2" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
