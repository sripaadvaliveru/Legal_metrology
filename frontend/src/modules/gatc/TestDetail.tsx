import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { applicationApi, inspectionApi, checklistApi, instrumentApi } from '@/services/api';
import { ArrowLeft, ArrowRight, CheckCircle, Save, Loader2, Camera, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Case Details', 'Record Measurements', 'Evidence & GPS', 'Submit Result'];

interface MeasurementReading {
  parameter: string;
  observedValue: string;
  tolerance: string;
  withinTolerance: boolean;
}

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementReading[]>([]);
  const [remarks, setRemarks] = useState('');
  const [result, setResult] = useState<'PASS' | 'FAIL' | ''>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data: application, isLoading: loadingApp } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationApi.get(id!).then(res => res.data),
    enabled: !!id,
  });

  const { data: instrument } = useQuery({
    queryKey: ['instrument', application?.instrumentId],
    queryFn: () => instrumentApi.get(application!.instrumentId).then(res => res.data),
    enabled: !!application?.instrumentId,
  });

  const { data: checklists } = useQuery({
    queryKey: ['checklist', instrument?.type],
    queryFn: () => checklistApi.list().then(res => res.data),
    enabled: !!instrument?.type,
  });

  const recordMeasurementsMutation = useMutation({
    mutationFn: ({ id, readings, checklistId }: { id: string; readings: any[]; checklistId?: string }) =>
      inspectionApi.recordMeasurements(id, readings, checklistId),
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, result, remarks }: { id: string; result: string; remarks?: string }) =>
      inspectionApi.submit(id, result, remarks),
    onSuccess: () => {
      toast.success('Verification result submitted successfully');
      navigate('/dashboard/tests');
    },
    onError: () => toast.error('Failed to submit result'),
  });

  // Initialize measurements from checklist
  useEffect(() => {
    if (checklists && checklists.length > 0 && measurements.length === 0) {
      try {
        const items = JSON.parse(checklists[0].checklistItems);
        setMeasurements(
          items.map((item: any) => ({
            parameter: item.parameter || '',
            observedValue: '',
            tolerance: item.tolerance || '',
            withinTolerance: false,
          }))
        );
      } catch {}
    }
  }, [checklists]);

  // Get GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const updateMeasurement = (index: number, field: keyof MeasurementReading, value: any) => {
    const updated = [...measurements];
    updated[index] = { ...updated[index], [field]: value };
    setMeasurements(updated);
  };

  const handleNext = async () => {
    if (currentStep === 1 && measurements.length > 0 && !inspectionId) {
      // Create inspection first
      try {
        const res = await inspectionApi.create(application!.id);
        setInspectionId(res.data.id);
      } catch {
        toast.error('Failed to create inspection');
        return;
      }
    }

    if (currentStep === 1 && inspectionId) {
      // Record measurements
      try {
        await recordMeasurementsMutation.mutateAsync({
          id: inspectionId,
          readings: measurements,
          checklistId: checklists?.[0]?.id,
        });
        toast.success('Measurements recorded');
      } catch {
        toast.error('Failed to record measurements');
        return;
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = () => {
    if (!result) {
      toast.error('Please select a result');
      return;
    }
    if (!inspectionId) {
      toast.error('No inspection found');
      return;
    }
    submitMutation.mutate({ id: inspectionId, result, remarks });
  };

  if (loadingApp) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading case details...</span>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Application not found</p>
        <button onClick={() => navigate('/dashboard/tests')} className="mt-4 text-blue-600 hover:underline">
          Back to tests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard/tests')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{application.applicationNumber}</h1>
          <p className="text-gray-500">Verification Case — {application.type?.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              index < currentStep ? 'bg-green-500 text-white' :
              index === currentStep ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
              {step}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        {currentStep === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Case Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Application Number</p>
                  <p className="font-medium">{application.applicationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Application Type</p>
                  <p className="font-medium">{application.type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{application.status?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Instrument ID</p>
                  <p className="font-medium">{instrument?.instrumentId || application.instrumentId}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Instrument Type</p>
                  <p className="font-medium">{instrument?.type || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Manufacturer / Model</p>
                  <p className="font-medium">{instrument?.manufacturer} {instrument?.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Serial Number</p>
                  <p className="font-medium">{instrument?.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-medium">{instrument?.capacityRange || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Record Measurements</h2>
            <p className="text-sm text-gray-500 mb-4">
              Checklist: {checklists?.[0]?.templateName || 'Default'} — Fill in observed values for each parameter
            </p>
            <div className="space-y-3">
              {measurements.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-900">{m.parameter}</p>
                    <p className="text-xs text-gray-500">Tolerance: {m.tolerance || '—'}</p>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Observed value"
                      value={m.observedValue}
                      onChange={(e) => updateMeasurement(i, 'observedValue', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={m.tolerance}
                      onChange={(e) => updateMeasurement(i, 'tolerance', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      placeholder="Tolerance"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={m.withinTolerance}
                      onChange={(e) => updateMeasurement(i, 'withinTolerance', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-600">Pass</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Evidence & GPS</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">GPS Location</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
                {gpsCoords ? (
                  <span className="text-sm">Lat: {gpsCoords.lat.toFixed(6)}, Lng: {gpsCoords.lng.toFixed(6)}</span>
                ) : (
                  <span className="text-sm text-gray-500">Getting location...</span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo Evidence</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Drag & drop photos or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG (max 10MB each)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Add any observations or remarks about the verification..."
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Submit Verification Result</h2>

            {/* Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Measurement Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {measurements.filter(m => m.withinTolerance).length}
                  </p>
                  <p className="text-xs text-gray-500">Within Tolerance</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {measurements.filter(m => !m.withinTolerance && m.observedValue).length}
                  </p>
                  <p className="text-xs text-gray-500">Outside Tolerance</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{measurements.length}</p>
                  <p className="text-xs text-gray-500">Total Parameters</p>
                </div>
              </div>
            </div>

            {/* Result Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Verification Result *</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setResult('PASS')}
                  className={`flex-1 p-4 rounded-lg border-2 text-center transition-colors ${
                    result === 'PASS'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">PASS</p>
                  <p className="text-xs text-gray-500">Instrument verified</p>
                </button>
                <button
                  onClick={() => setResult('FAIL')}
                  className={`flex-1 p-4 rounded-lg border-2 text-center transition-colors ${
                    result === 'FAIL'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center text-2xl">✕</div>
                  <p className="font-medium">FAIL</p>
                  <p className="text-xs text-gray-500">Re-inspection required</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !result}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Submit Result
          </button>
        )}
      </div>
    </div>
  );
}
