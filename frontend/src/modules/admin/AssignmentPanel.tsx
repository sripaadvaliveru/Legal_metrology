import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi, assignmentApi, userApi } from '@/services/api';
import { UserPlus, Wand, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Application, User } from '@/types';

export default function AssignmentPanel() {
  const queryClient = useQueryClient();
  const [selectedLmos, setSelectedLmos] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => applicationApi.listAll().then(res => res.data),
  });

  const { data: lmos } = useQuery({
    queryKey: ['lmo-users'],
    queryFn: () => userApi.listByRole('LMO').then(res => res.data),
  });

  const { data: gatcs } = useQuery({
    queryKey: ['gatc-users'],
    queryFn: () => userApi.listByRole('GATC').then(res => res.data),
  });

  const autoAssignMutation = useMutation({
    mutationFn: (applicationId: string) => assignmentApi.autoAssign(applicationId),
    onSuccess: () => {
      toast.success('Auto-assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: () => toast.error('Auto-assignment failed'),
  });

  const manualAssignMutation = useMutation({
    mutationFn: ({ applicationId, assigneeId }: { applicationId: string; assigneeId: string }) =>
      assignmentApi.manualAssign(applicationId, assigneeId),
    onSuccess: () => {
      toast.success('Assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: () => toast.error('Assignment failed'),
  });

  const approvedApps = applications?.filter((app: Application) => app.status === 'APPROVED');

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
        <h1 className="text-2xl font-bold text-gray-900">Assign Officers</h1>
        <p className="text-gray-500">Assign approved applications to LMO (mobile) or GATC (web lab)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold">{approvedApps?.length ?? 0}</p>
          <p className="text-xs text-gray-500">Awaiting Assignment</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold">{lmos?.length ?? 0}</p>
          <p className="text-xs text-gray-500">Available LMOs</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold">{gatcs?.length ?? 0}</p>
          <p className="text-xs text-gray-500">Available GATCs</p>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {approvedApps?.map((app: Application) => (
          <div key={app.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{app.applicationNumber}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {app.type?.replace(/_/g, ' ')} — Instrument: {app.instrumentId}
                </p>
              </div>
              <button
                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedId === app.id ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {expandedId === app.id && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      defaultValue="LMO"
                    >
                      <option value="LMO">LMO (Mobile App)</option>
                      <option value="GATC">GATC (Web Lab)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Officer / Lab</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={selectedLmos[app.id] || ''}
                      onChange={(e) => setSelectedLmos({ ...selectedLmos, [app.id]: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {lmos?.map((lmo: User) => (
                        <option key={lmo.id} value={lmo.id}>{lmo.name} ({lmo.email})</option>
                      ))}
                      {gatcs?.map((gatc: User) => (
                        <option key={gatc.id} value={gatc.id}>{gatc.name} (GATC)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => autoAssignMutation.mutate(app.id)}
                    disabled={autoAssignMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Wand className="w-4 h-4" />
                    {autoAssignMutation.isPending ? 'Assigning...' : 'Auto-Assign'}
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedLmos[app.id]) {
                        toast.error('Please select an officer/lab');
                        return;
                      }
                      manualAssignMutation.mutate({
                        applicationId: app.id,
                        assigneeId: selectedLmos[app.id],
                      });
                    }}
                    disabled={manualAssignMutation.isPending || !selectedLmos[app.id]}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    {manualAssignMutation.isPending ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {approvedApps?.length === 0 && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Applications to Assign</h3>
            <p className="text-gray-500">All applications have been assigned or are awaiting approval.</p>
          </div>
        )}
      </div>
    </div>
  );
}
