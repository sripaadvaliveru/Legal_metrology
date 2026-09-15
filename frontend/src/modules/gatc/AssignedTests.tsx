import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { assignmentApi } from '@/services/api';
import { ClipboardCheck, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AssignedTests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['gatc-assignments'],
    queryFn: () => assignmentApi.listMy().then(res => res.data),
  });

  if (loadingAssignments) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading assigned tests...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assigned Verification Cases</h1>
        <p className="text-gray-500">Cases assigned to {user?.name} for testing and verification</p>
      </div>

      <div className="space-y-4">
        {assignments?.map((assignment: any) => (
          <div key={assignment.id} className="bg-white rounded-lg border p-6 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {assignment.application?.applicationNumber || 'Application'}
                  </h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    assignment.application?.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                    assignment.application?.status === 'SCHEDULED' ? 'bg-purple-100 text-purple-800' :
                    assignment.application?.status === 'UNDER_INSPECTION' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.application?.status?.replace(/_/g, ' ') || 'Unknown'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium">{assignment.application?.type?.replace(/_/g, ' ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Instrument</p>
                    <p className="font-medium">{assignment.application?.instrumentId || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Assigned</p>
                    <p className="font-medium">
                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Method</p>
                    <p className="font-medium">{assignment.method || '—'}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/dashboard/tests/${assignment.application?.id || assignment.id}`)}
                className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
              >
                View & Record
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {assignments?.length === 0 && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Assigned Tests</h3>
            <p className="text-gray-500">No verification cases have been assigned to you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
