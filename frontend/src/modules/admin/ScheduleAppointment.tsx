import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi, userApi, assignmentApi } from '@/services/api';
import { Calendar, MapPin, Loader2, Clock, AlertCircle, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Application, User } from '@/types';

export default function ScheduleAppointment() {
  const queryClient = useQueryClient();
  const [scheduleData, setScheduleData] = useState<Record<string, { datetime: string; location: string }>>({});
  const [selectedLmos, setSelectedLmos] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'ALL' | 'ASSIGNED' | 'APPROVED' | 'SCHEDULED'>('ALL');

  const { data: applications, isLoading: isAppsLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => applicationApi.listAll().then(res => res.data),
  });

  const { data: lmos } = useQuery({
    queryKey: ['lmo-users'],
    queryFn: () => userApi.listByRole('LMO').then(res => res.data),
  });

  const manualAssignMutation = useMutation({
    mutationFn: ({ applicationId, assigneeId }: { applicationId: string; assigneeId: string }) =>
      assignmentApi.manualAssign(applicationId, assigneeId),
    onSuccess: () => {
      toast.success('Officer assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Assignment failed';
      toast.error(String(msg));
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { scheduledAt: string; location: string } }) =>
      applicationApi.schedule(id, data),
    onSuccess: () => {
      toast.success('Inspection appointment scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.response?.data || error?.message || 'Failed to schedule appointment';
      toast.error(String(msg));
    },
  });

  const allRelevantApps = applications?.filter(
    (app: Application) => app.status === 'ASSIGNED' || app.status === 'APPROVED' || app.status === 'SCHEDULED'
  );

  const displayedApps = allRelevantApps?.filter((app: Application) => {
    if (filter === 'ALL') return true;
    return app.status === filter;
  });

  const handleSetQuickDate = (appId: string, daysAhead: number, hour: number = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    const isoString = d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    setScheduleData(prev => ({
      ...prev,
      [appId]: {
        datetime: isoString,
        location: prev[appId]?.location || 'On-site Merchant Location',
      },
    }));
  };

  const handleSchedule = (appId: string) => {
    const data = scheduleData[appId];
    if (!data?.datetime) {
      toast.error('Please select a date and time for inspection');
      return;
    }

    scheduleMutation.mutate({
      id: appId,
      data: {
        scheduledAt: data.datetime,
        location: data.location || 'On-site Merchant Location',
      },
    });
  };

  if (isAppsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600 font-medium">Loading inspection schedules...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule Inspections</h1>
        <p className="text-gray-500 mt-1">
          Set inspection appointment dates, times, and locations for Legal Metrology Officers (LMOs).
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'ALL', label: 'All Schedulable', count: allRelevantApps?.length ?? 0 },
          { key: 'ASSIGNED', label: 'Assigned to LMO', count: applications?.filter(a => a.status === 'ASSIGNED').length ?? 0 },
          { key: 'APPROVED', label: 'Approved (Awaiting Assignment)', count: applications?.filter(a => a.status === 'APPROVED').length ?? 0 },
          { key: 'SCHEDULED', label: 'Already Scheduled', count: applications?.filter(a => a.status === 'SCHEDULED').length ?? 0 },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === item.key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {item.label}{' '}
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${
              filter === item.key ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {displayedApps?.map((app: Application) => {
          const isAppApproved = app.status === 'APPROVED';
          const isAppScheduled = app.status === 'SCHEDULED';
          const currentData = scheduleData[app.id] || { datetime: '', location: '' };

          return (
            <div
              key={app.id}
              className={`bg-white rounded-xl border transition-shadow hover:shadow-sm p-6 ${
                isAppScheduled ? 'border-purple-200 bg-purple-50/20' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{app.applicationNumber}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      app.status === 'ASSIGNED'
                        ? 'bg-blue-100 text-blue-800'
                        : app.status === 'SCHEDULED'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium text-gray-700">{app.type?.replace(/_/g, ' ')}</span> &bull; Instrument ID:{' '}
                    <span className="font-mono text-gray-800 font-semibold">{app.instrumentId}</span>
                  </p>
                </div>

                {isAppApproved && (
                  <div className="flex items-center gap-2">
                    <select
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedLmos[app.id] || ''}
                      onChange={(e) => setSelectedLmos({ ...selectedLmos, [app.id]: e.target.value })}
                    >
                      <option value="">Assign LMO...</option>
                      {lmos?.map((lmo: User) => (
                        <option key={lmo.id} value={lmo.id}>{lmo.name} ({lmo.email})</option>
                      ))}
                    </select>
                    {selectedLmos[app.id] && (
                      <button
                        onClick={() => manualAssignMutation.mutate({ applicationId: app.id, assigneeId: selectedLmos[app.id] })}
                        disabled={manualAssignMutation.isPending}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Assign
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isAppApproved && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    This application will be <strong>automatically assigned</strong> to the best available LMO when scheduled, or you can select an officer above.
                  </span>
                </div>
              )}

              {/* Date & Location inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                      <Calendar className="w-3.5 h-3.5 inline mr-1 text-gray-500" />
                      Date &amp; Time
                    </label>
                    <div className="flex gap-1.5 text-xs text-blue-600 font-medium">
                      <button
                        type="button"
                        onClick={() => handleSetQuickDate(app.id, 1, 10)}
                        className="hover:underline hover:text-blue-800"
                      >
                        Tomorrow 10 AM
                      </button>
                      <span>&bull;</span>
                      <button
                        type="button"
                        onClick={() => handleSetQuickDate(app.id, 2, 14)}
                        className="hover:underline hover:text-blue-800"
                      >
                        +2 Days 2 PM
                      </button>
                    </div>
                  </div>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={currentData.datetime}
                    onChange={(e) =>
                      setScheduleData({
                        ...scheduleData,
                        [app.id]: { ...currentData, datetime: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-gray-500" />
                    Inspection Location / Address
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g. Unit 4, Ind. Area Phase II or Merchant Premise"
                    value={currentData.location}
                    onChange={(e) =>
                      setScheduleData({
                        ...scheduleData,
                        [app.id]: { ...currentData, location: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {isAppScheduled ? 'Inspection already booked. You can reschedule above.' : 'Ready for appointment allocation.'}
                </span>

                <button
                  onClick={() => handleSchedule(app.id)}
                  disabled={scheduleMutation.isPending || !currentData.datetime}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                >
                  {scheduleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isAppScheduled ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {scheduleMutation.isPending
                    ? 'Scheduling...'
                    : isAppScheduled
                    ? 'Reschedule Inspection'
                    : 'Schedule Appointment'}
                </button>
              </div>
            </div>
          );
        })}

        {displayedApps?.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Applications Pending Scheduling</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              All applications have been processed or are waiting in earlier review stages. Check{' '}
              <strong>Review Applications</strong> or <strong>Assign Officers</strong> to prepare more applications for inspection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
