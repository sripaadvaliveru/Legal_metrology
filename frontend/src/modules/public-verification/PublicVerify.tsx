import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/api';
import { CheckCircle, XCircle, AlertTriangle, Shield, QrCode } from 'lucide-react';

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

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    VALID: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'VALID CERTIFICATE' },
    EXPIRED: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'EXPIRED' },
    REVOKED: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'REVOKED' },
    SUSPENDED: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'SUSPENDED' },
  };

  const config = statusConfig[result?.status] || statusConfig.VALID;
  const StatusIcon = result?.status === 'VALID' ? CheckCircle :
                     result?.status === 'NOT_FOUND' ? XCircle : AlertTriangle;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 text-center">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-80" />
          <h1 className="text-lg font-bold">Legal Metrology Department</h1>
          <p className="text-sm text-gray-300">Government of India</p>
        </div>

        {isNotFound ? (
          <div className="text-center py-12 px-6">
            <XCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700">Certificate Not Found</p>
            <p className="text-sm text-gray-500 mt-1">This verification link is invalid or has expired.</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Status Badge */}
            <div className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 mb-6 ${config.bg}`}>
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
              <span className={`text-lg font-bold ${config.color}`}>{config.label}</span>
            </div>

            {/* Certificate Number */}
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Certificate Number</p>
              <p className="text-xl font-mono font-bold text-gray-900">{result?.certificateNumber}</p>
            </div>

            {/* QR Token Display */}
            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
              <QrCode className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500 font-mono">{token?.substring(0, 16)}...</span>
            </div>

            {/* Instrument Details */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Instrument Details</h3>
              <div className="space-y-2">
                <InfoRow label="Type" value={result?.instrumentType} />
                <InfoRow label="Manufacturer" value={result?.manufacturer} />
                <InfoRow label="Model" value={result?.model} />
                <InfoRow label="Serial Number" value={result?.serialNumber} />
                {result?.capacityRange && <InfoRow label="Capacity" value={result?.capacityRange} />}
              </div>
            </div>

            {/* Verification Details */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Verification Details</h3>
              <div className="space-y-2">
                <InfoRow label="Verification Date" value={result?.verificationDate} />
                <InfoRow label="Valid Until" value={result?.validUntil} />
                <InfoRow label="Issued By" value={result?.issuedBy || result?.issuer} />
              </div>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                This certificate is verified by the Legal Metrology Department
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center border-t">
          <p className="text-xs text-gray-400">Smart Legal Metrology Verification System</p>
          <p className="text-xs text-gray-400">Ministry of Consumer Affairs, Food & Public Distribution</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  );
}
