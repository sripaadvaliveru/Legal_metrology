import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { inspectionApi } from '../services/api';

interface MeasurementItem {
  parameter: string;
  observedValue: string;
  tolerance: string;
}

export default function RecordMeasurementsScreen({ route, navigation }: any) {
  const { inspectionId } = route.params;
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([
    { parameter: '', observedValue: '', tolerance: '' },
  ]);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const recordMutation = useMutation({
    mutationFn: async () => {
      const readings = measurements
        .filter(m => m.parameter && m.observedValue)
        .map(m => ({
          parameter: m.parameter,
          observedValue: m.observedValue,
          tolerance: m.tolerance || undefined,
          withinTolerance: undefined,
        }));
      await inspectionApi.recordMeasurements(inspectionId, readings);
    },
    onSuccess: () => {
      navigation.navigate('SubmitInspection', { inspectionId });
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
    setMeasurements([...measurements, { parameter: '', observedValue: '', tolerance: '' }]);
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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GPS Location</Text>
        <TouchableOpacity style={styles.gpsBtn} onPress={captureGps} disabled={gpsLoading}>
          <Ionicons name={gpsLoading ? "sync-outline" : "location-outline"} size={20} color="#fff" />
          <Text style={styles.gpsBtnText}>
            {gpsLoading ? 'Capturing...' : gpsCoords ? `Captured: ${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'Capture GPS Location'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          <TouchableOpacity onPress={addMeasurement}>
            <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {measurements.map((m, index) => (
          <View key={index} style={styles.measurementCard}>
            <View style={styles.measurementHeader}>
              <Text style={styles.measurementNum}>#{index + 1}</Text>
              {measurements.length > 1 && (
                <TouchableOpacity onPress={() => removeMeasurement(index)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Parameter (e.g. Weight)"
              value={m.parameter}
              onChangeText={(v) => updateMeasurement(index, 'parameter', v)}
            />
            <TextInput
              style={styles.input}
              placeholder="Observed Value"
              value={m.observedValue}
              onChangeText={(v) => updateMeasurement(index, 'observedValue', v)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Tolerance (optional)"
              value={m.tolerance}
              onChangeText={(v) => updateMeasurement(index, 'tolerance', v)}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, recordMutation.isPending && styles.submitBtnDisabled]}
        onPress={() => recordMutation.mutate()}
        disabled={recordMutation.isPending}
      >
        <Text style={styles.submitBtnText}>
          {recordMutation.isPending ? 'Saving...' : 'Save & Continue'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', borderRadius: 8, padding: 12, gap: 8 },
  gpsBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  measurementCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  measurementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  measurementNum: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 8, backgroundColor: '#f9fafb' },
  submitBtn: { backgroundColor: '#1f2937', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
