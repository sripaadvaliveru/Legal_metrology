import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { inspectionApi, appointmentApi, checklistApi } from '../services/api';
import { fetchAndCacheChecklists } from '../services/offlineHelpers';
import EvidenceCapture from '../components/EvidenceCapture';

interface MeasurementItem {
  parameter: string;
  observedValue: string;
  tolerance: string;
  remarks: string;
}

interface ChecklistItem {
  parameter: string;
  tolerance: string;
  mandatory: boolean;
}

export default function RecordMeasurementsScreen({ route, navigation }: any) {
  const { inspectionId } = route.params;

  const { data: inspection } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => inspectionApi.get(inspectionId).then(res => res.data),
  });

  const { data: appointment } = useQuery({
    queryKey: ['appointment', inspection?.appointmentId],
    queryFn: () => appointmentApi.get(inspection!.appointmentId).then(res => res.data),
    enabled: !!inspection?.appointmentId,
  });

  const instrumentTypeId = appointment?.application?.instrument?.instrumentType?.id;

  const { data: checklists } = useQuery({
    queryKey: ['checklist', instrumentTypeId],
    queryFn: () => fetchAndCacheChecklists(instrumentTypeId!, () => checklistApi.getByInstrumentType(instrumentTypeId!).then(res => res.data)),
    enabled: !!instrumentTypeId,
  });

  const template = checklists?.[0];

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (template) {
      try {
        const items: ChecklistItem[] = JSON.parse(template.checklistItems);
        setChecklistItems(items);
        setMeasurements(items.map(item => ({
          parameter: item.parameter,
          observedValue: '',
          tolerance: item.tolerance,
          remarks: '',
        })));
      } catch {}
    }
  }, [template?.id]);

  const recordMutation = useMutation({
    mutationFn: async () => {
      const readings = measurements
        .filter(m => m.parameter && m.observedValue)
        .map(m => ({
          parameter: m.parameter,
          observedValue: m.observedValue,
          tolerance: m.tolerance || undefined,
          withinTolerance: undefined,
          remarks: m.remarks || undefined,
        }));
      await inspectionApi.recordMeasurements(inspectionId, readings, template?.id);
    },
    onSuccess: () => {
      navigation.navigate('InspectionReview', { inspectionId });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record measurements');
    },
  });

  const captureGps = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for GPS capture');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setGpsCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      try {
        await inspectionApi.updateGps(inspectionId, location.coords.latitude, location.coords.longitude);
      } catch {
        Alert.alert('Warning', 'GPS captured but failed to save to server. You can continue.');
        return;
      }
      Alert.alert('GPS Captured', `Lat: ${location.coords.latitude.toFixed(6)}, Lng: ${location.coords.longitude.toFixed(6)}`);
    } catch {
      Alert.alert('GPS Error', 'Failed to capture location. Make sure GPS is enabled on your device.');
    } finally {
      setGpsLoading(false);
    }
  };

  const addMeasurement = () => {
    setMeasurements([...measurements, { parameter: '', observedValue: '', tolerance: '', remarks: '' }]);
  };

  const updateMeasurement = (index: number, field: keyof MeasurementItem, value: string) => {
    const updated = [...measurements];
    updated[index][field] = value;
    setMeasurements(updated);
  };

  const removeMeasurement = (index: number) => {
    if (measurements.length > 1) {
      setMeasurements(measurements.filter((_, i) => i !== index));
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {template && (
        <View style={styles.checklistBanner}>
          <Ionicons name="list-outline" size={18} color="#1e40af" />
          <Text style={styles.checklistBannerText}>
            Using checklist: {template.templateName} ({checklistItems.length} items)
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GPS Location</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.gpsBtn} onPress={captureGps} disabled={gpsLoading}>
          <Ionicons name={gpsLoading ? "sync-outline" : "location-outline"} size={20} color="#fff" />
          <Text style={styles.gpsBtnText}>
            {gpsLoading ? 'Capturing...' : gpsCoords ? `Captured: ${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'Capture GPS Location'}
          </Text>
        </TouchableOpacity>
      </View>

      <EvidenceCapture inspectionId={inspectionId} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={addMeasurement}>
            <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {measurements.map((m, index) => {
          const checklistItem = checklistItems.find(c => c.parameter === m.parameter);
          return (
            <View key={`m-${index}-${m.parameter}`} style={styles.measurementCard}>
              <View style={styles.measurementHeader}>
                <Text style={styles.measurementNum}>#{index + 1}</Text>
                {checklistItem?.mandatory && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>REQUIRED</Text>
                  </View>
                )}
                {measurements.length > 1 && (
                  <TouchableOpacity activeOpacity={0.7} onPress={() => removeMeasurement(index)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Parameter"
                value={m.parameter}
                onChangeText={(v) => updateMeasurement(index, 'parameter', v)}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Observed Value"
                value={m.observedValue}
                onChangeText={(v) => updateMeasurement(index, 'observedValue', v)}
                keyboardType="numeric"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Tolerance"
                value={m.tolerance}
                onChangeText={(v) => updateMeasurement(index, 'tolerance', v)}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Remarks (optional)"
                value={m.remarks}
                onChangeText={(v) => updateMeasurement(index, 'remarks', v)}
                returnKeyType="done"
              />
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.submitBtn, recordMutation.isPending && styles.submitBtnDisabled]}
        onPress={() => recordMutation.mutate()}
        disabled={recordMutation.isPending}
      >
        <Text style={styles.submitBtnText}>
          {recordMutation.isPending ? 'Saving...' : 'Save & Review'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  checklistBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, marginBottom: 12 },
  checklistBannerText: { fontSize: 13, color: '#1e40af', flex: 1 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', borderRadius: 8, padding: 12, gap: 8 },
  gpsBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  measurementCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  measurementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  measurementNum: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  requiredBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  requiredText: { fontSize: 10, fontWeight: '700', color: '#1e40af' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 8, backgroundColor: '#f9fafb' },
  submitBtn: { backgroundColor: '#1f2937', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
