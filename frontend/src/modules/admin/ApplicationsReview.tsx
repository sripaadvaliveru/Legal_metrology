import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '@/services/api';
import { CheckCircle, XCircle, Eye, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Application } from '@/types';

const STATUS_FILTERS = ['All', 'SUBMITTED', 'APPROVED', 'ASSIGNED', 'SCHEDULED'] as const;

export default function ApplicationsReview() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => applicationApi.listAll().then(res => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => applicationApi.approve(id),
    onSuccess: () => {
      toast.success('Application approved');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: () => toast.error('Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => applicationApi.reject(id),
    onSuccess: () => {
      toast.success('Application rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: () => toast.error('Failed to reject'),
  });

  const filtered = applications?.filter((app: Application) =>
    statusFilter === 'All' || app.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED': return 'bg-purple-100 text-purple-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Review Applications</h1>
        <p className="text-gray-500">Review and approve verification applications</p>
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status === 'All' ? 'All' : status.replace(/_/g, ' ')}
            {status !== 'All' && (
              <span className="ml-2 text-xs">
                ({applications?.filter((a: Application) => a.status === status).length ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered?.map((app: Application) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{app.applicationNumber}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{app.type?.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                    {app.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {app.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(app.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(app.id)}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'APPROVED' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        <ArrowRight className="w-3 h-3" />
                        Go to Assign
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No applications found{statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
