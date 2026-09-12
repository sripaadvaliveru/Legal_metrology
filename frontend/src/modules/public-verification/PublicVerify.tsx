import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/api';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function PublicVerify() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['verify', token],
    queryFn: () => publicApi.verify(token!),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Verifying certificate...</p>
      </div>
    );
  }

  const result = data?.data as any;
  const isNotFound = result?.status === 'NOT_FOUND';

  const statusColors: Record<string, string> = {
    VALID: 'text-green-600 bg-green-50',
    EXPIRED: 'text-orange-600 bg-orange-50',
    REVOKED: 'text-red-600 bg-red-50',
    SUSPENDED: 'text-yellow-600 bg-yellow-50',
    NOT_FOUND: 'text-gray-600 bg-gray-50',
  };

  const StatusIcon = result?.status === 'VALID' ? CheckCircle :
                     result?.status === 'NOT_FOUND' ? XCircle : AlertTriangle;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-sm text-gray-500">Legal Metrology Department</p>
        </div>

        {isNotFound ? (
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700">Certificate Not Found</p>
            <p className="text-sm text-gray-500 mt-1">Invalid or expired verification link.</p>
          </div>
        ) : (
          <>
            <div className={`flex items-center justify-center gap-2 p-3 rounded-lg mb-6 ${statusColors[result?.status] || ''}`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-semibold">{result?.status}</span>
            </div>

            <div className="space-y-3">
              <InfoRow label="Certificate Number" value={result?.certificateNumber} />
              <InfoRow label="Instrument Type" value={result?.instrumentType} />
              <InfoRow label="Manufacturer" value={result?.manufacturer} />
              <InfoRow label="Model" value={result?.model} />
              <InfoRow label="Serial Number" value={result?.serialNumber} />
              <InfoRow label="Capacity/Range" value={result?.capacityRange} />
              <InfoRow label="Verification Date" value={result?.verificationDate} />
              <InfoRow label="Valid Until" value={result?.validUntil} />
              <InfoRow label="Issuing Authority" value={result?.issuer} />
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">Powered by Legal Metrology Verification System</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  );
}
