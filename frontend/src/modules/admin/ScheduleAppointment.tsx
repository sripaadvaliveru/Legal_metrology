import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '@/services/api';
import { Calendar, MapPin, Loader2, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Application } from '@/types';

export default function ScheduleAppointment() {
  const queryClient = useQueryClient();
  const [scheduleData, setScheduleData] = useState<Record<string, { datetime: string; location: string }>>({});

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => applicationApi.listAll().then(res => res.data),
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { scheduledAt: string; location: string } }) =>
      applicationApi.schedule(id, data),
    onSuccess: () => {
      toast.success('Appointment scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.response?.data || 'Failed to schedule appointment';
      toast.error(String(msg));
    },
  });

  // Show apps that are APPROVED (awaiting assignment) or ASSIGNED (ready to schedule)
  const schedulableApps = applications?.filter(
    (app: Application) => app.status === 'ASSIGNED' || app.status === 'APPROVED'
  );

  const handleSchedule = (appId: string) => {
    const data = scheduleData[appId];
    if (!data?.datetime) {
      toast.error('Please select a date and time');
      return;
    }
    scheduleMutation.mutate({
      id: appId,
      data: {
        scheduledAt: new Date(data.datetime).toISOString(),
        location: data.location || '',
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading applications...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule Inspections</h1>
        <p className="text-gray-500">Schedule inspection appointments for approved and assigned applications</p>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{schedulableApps?.length ?? 0}</span> application(s) ready for scheduling
          {' '}(status:{' '}
          <span className="font-mono text-xs bg-gray-100 px-1 rounded">APPROVED</span> or{' '}
          <span className="font-mono text-xs bg-gray-100 px-1 rounded">ASSIGNED</span>)
        </p>
      </div>

      <div className="space-y-4">
        {schedulableApps?.map((app: Application) => (
          <div key={app.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{app.applicationNumber}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {app.type?.replace(/_/g, ' ')} — Instrument: {app.instrumentId}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                app.status === 'ASSIGNED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {app.status}
              </span>
            </div>

            {app.status === 'APPROVED' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ This application has not been assigned to an LMO yet. Consider assigning first before scheduling.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={scheduleData[app.id]?.datetime || ''}
                  onChange={(e) =>
                    setScheduleData({
                      ...scheduleData,
                      [app.id]: { ...scheduleData[app.id], datetime: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Inspection location"
                  value={scheduleData[app.id]?.location || ''}
                  onChange={(e) =>
                    setScheduleData({
                      ...scheduleData,
                      [app.id]: { ...scheduleData[app.id], location: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSchedule(app.id)}
                disabled={scheduleMutation.isPending || !scheduleData[app.id]?.datetime}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {scheduleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
              </button>
            </div>
          </div>
        ))}

        {schedulableApps?.length === 0 && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Applications to Schedule</h3>
            <p className="text-gray-500">
              No applications are in{' '}
              <span className="font-mono text-xs bg-gray-100 px-1 rounded">APPROVED</span> or{' '}
              <span className="font-mono text-xs bg-gray-100 px-1 rounded">ASSIGNED</span> status.
              Applications must be approved (and optionally assigned to an LMO) before they can be scheduled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
