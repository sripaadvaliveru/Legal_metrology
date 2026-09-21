import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { certificateApi } from '@/services/api';
import {
  QrCode, Download, ExternalLink, Printer, Search,
  CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, Eye
} from 'lucide-react';
import type { Certificate } from '@/types';

export default function CertificatesView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'VALID' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateApi.listMy().then(res => res.data),
  });

  const filtered = certificates?.filter((cert: any) => {
    const matchesFilter = filter === 'ALL' || cert.status === filter;
    const certNum = cert.certificateNumber?.toLowerCase() || '';
    const instSn = cert.instrument?.serialNumber?.toLowerCase() || '';
    const instModel = cert.instrument?.model?.toLowerCase() || '';
    const query = search.toLowerCase();
    const matchesSearch = !query || certNum.includes(query) || instSn.includes(query) || instModel.includes(query);
    return matchesFilter && matchesSearch;
  });

  const validCount = certificates?.filter((c: any) => c.status === 'VALID').length ?? 0;
  const expiredCount = certificates?.filter((c: any) => c.status === 'EXPIRED').length ?? 0;
  const revokedCount = certificates?.filter((c: any) => c.status === 'REVOKED').length ?? 0;

  const handleDownloadQr = (qrToken: string, certNum: string) => {
    const url = certificateApi.getQrUrl(qrToken);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR-${certNum}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = (certId: string) => {
    const token = localStorage.getItem('token');
    const url = certificateApi.getPdfUrl(certId);
    // Fetch with auth header and trigger download
    fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `Certificate-${certId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      })
      .catch(() => {
        window.open(url, '_blank');
      });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600 font-medium">Loading certificates...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Certificates &amp; QR Codes</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Access, download, and export official Legal Metrology certificates and tamper-proof verification QR codes.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certificates?.length ?? 0}</p>
              <p className="text-xs text-gray-500 font-medium">Total Issued</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{validCount}</p>
              <p className="text-xs text-gray-500 font-medium">Valid Certificates</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{expiredCount}</p>
              <p className="text-xs text-gray-500 font-medium">Expired</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{revokedCount}</p>
              <p className="text-xs text-gray-500 font-medium">Revoked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search certificate #, serial no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'VALID', 'EXPIRED', 'REVOKED'] as const).map(key => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                filter === key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {key === 'ALL' ? 'All Certificates' : key}
            </button>
          ))}
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered?.map((cert: any) => {
          const isValid = cert.status === 'VALID';
          const qrUrl = certificateApi.getQrUrl(cert.qrToken);
          const verifyPageUrl = `/verify/${cert.qrToken}`;

          return (
            <div
              key={cert.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400 font-mono">CERTIFICATE NUMBER</span>
                    <h3 className="font-mono font-bold text-gray-900 text-base">{cert.certificateNumber}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    isValid
                      ? 'bg-green-100 text-green-800'
                      : cert.status === 'EXPIRED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {cert.status}
                  </span>
                </div>

                {/* QR Code & Verification info */}
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3.5 mb-4">
                  <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm shrink-0">
                    <img
                      src={qrUrl}
                      alt={`QR for ${cert.certificateNumber}`}
                      className="w-24 h-24 object-contain rounded"
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tamper-Proof QR</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Scannable with any mobile phone to verify authenticity.
                    </p>
                    <a
                      href={verifyPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline pt-1"
                    >
                      <span>Open Public Verify</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Instrument Specs */}
                <div className="space-y-2 text-xs text-gray-600 mb-4 bg-white">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Instrument Type:</span>
                    <span className="font-medium text-gray-800 text-right">
                      {cert.instrument?.instrumentType?.name || cert.instrument?.type || 'Standard Instrument'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Model / Serial No:</span>
                    <span className="font-mono font-medium text-gray-800 text-right">
                      {cert.instrument?.model || '—'} (S/N: {cert.instrument?.serialNumber || '—'})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Verification Date:</span>
                    <span className="font-medium text-gray-800">{cert.verificationDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Valid Until:</span>
                    <span className="font-semibold text-gray-900">{cert.validUntil}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(cert.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm"
                  title="Download official PDF certificate with stamp"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={() => handleDownloadQr(cert.qrToken, cert.certificateNumber)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                  title="Export QR code PNG"
                >
                  <QrCode className="w-3.5 h-3.5 text-gray-600" />
                  <span>Export QR</span>
                </button>

                <button
                  onClick={() => setSelectedCert(cert)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Preview Certificate Card"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered?.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border p-12 text-center">
            <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Certificates Found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Certificates are automatically generated when an LMO successfully passes an instrument inspection.
            </p>
          </div>
        )}
      </div>

      {/* Certificate Modal Preview */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-lg">Official Certificate Preview</h3>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div id="printable-cert" className="border-2 border-gray-900 rounded-xl p-6 bg-white space-y-4 text-center">
              <div className="border-b pb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Government of India</p>
                <h2 className="text-lg font-extrabold text-gray-900">LEGAL METROLOGY DEPARTMENT</h2>
                <p className="text-xs text-gray-600">Verification Certificate under Legal Metrology Act, 2009</p>
              </div>

              <div className="flex justify-center my-3">
                <img
                  src={certificateApi.getQrUrl(selectedCert.qrToken)}
                  alt="QR Code"
                  className="w-36 h-36 border rounded-lg p-1"
                />
              </div>

              <div className="text-xs text-gray-700 space-y-1.5 text-left bg-gray-50 p-3.5 rounded-lg font-mono">
                <p><strong>Cert #:</strong> {selectedCert.certificateNumber}</p>
                <p><strong>Status:</strong> {selectedCert.status}</p>
                <p><strong>Verified Date:</strong> {selectedCert.verificationDate}</p>
                <p><strong>Valid Until:</strong> {selectedCert.validUntil}</p>
                <p><strong>Issued By:</strong> {selectedCert.issuedBy || 'Legal Metrology Officer'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleDownloadPdf(selectedCert.id)}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
