import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { inspectionApi, appointmentApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function InspectionReviewScreen({ route, navigation }: any) {
  const { inspectionId } = route.params;

  const { data: inspection, isLoading: inspectionLoading } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => inspectionApi.get(inspectionId).then(res => res.data),
  });

  const { data: measurements, isLoading: measurementsLoading } = useQuery({
    queryKey: ['inspection-measurements', inspectionId],
    queryFn: () => inspectionApi.getMeasurements(inspectionId).then(res => res.data),
    enabled: !!inspectionId,
  });

  const appointmentId = inspection?.appointmentId;
  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentApi.get(appointmentId!).then(res => res.data),
    enabled: !!appointmentId,
  });

  if (inspectionLoading || measurementsLoading) return <LoadingSpinner />;

  const app = appointment?.application;
  const instrument = app?.instrument;
  const withinCount = measurements?.filter(m => m.withinTolerance === true).length ?? 0;
  const outsideCount = measurements?.filter(m => m.withinTolerance === false).length ?? 0;
  const totalMeasurements = measurements?.length ?? 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle-outline" size={40} color="#3b82f6" />
        <Text style={styles.headerTitle}>Review Inspection</Text>
        <Text style={styles.headerSubtitle}>Verify all details before submitting</Text>
      </View>

      {instrument && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={18} color="#3b82f6" />
            <Text style={styles.cardTitle}>Instrument</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{instrument.instrumentType?.name || 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Manufacturer / Model</Text>
            <Text style={styles.value}>{instrument.manufacturer} {instrument.model}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Serial Number</Text>
            <Text style={[styles.value, styles.mono]}>{instrument.serialNumber}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="analytics-outline" size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Measurements</Text>
          <Badge text={`${totalMeasurements} recorded`} variant="info" />
        </View>

        {totalMeasurements === 0 ? (
          <View style={styles.emptyMeasurements}>
            <Text style={styles.emptyText}>No measurements recorded yet.</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryItem, styles.summaryPass]}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={styles.summaryCount}>{withinCount}</Text>
                <Text style={styles.summaryLabel}>Within</Text>
              </View>
              <View style={[styles.summaryItem, styles.summaryFail]}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={styles.summaryCount}>{outsideCount}</Text>
                <Text style={styles.summaryLabel}>Outside</Text>
              </View>
            </View>

            {measurements?.map((m, i) => (
              <View key={m.id || `m-${i}`} style={styles.measurementItem}>
                <View style={styles.measurementHeader}>
                  <Text style={styles.measurementParam}>{m.parameter}</Text>
                  <View style={[styles.toleranceIndicator, { backgroundColor: m.withinTolerance === true ? '#d1fae5' : m.withinTolerance === false ? '#fee2e2' : '#f3f4f6' }]}>
                    <Text style={[styles.toleranceText, { color: m.withinTolerance === true ? '#065f46' : m.withinTolerance === false ? '#991b1b' : '#6b7280' }]}>
                      {m.withinTolerance === true ? 'PASS' : m.withinTolerance === false ? 'FAIL' : 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={styles.measurementValues}>
                  <View style={styles.valuePair}>
                    <Text style={styles.valueLabel}>Observed</Text>
                    <Text style={styles.valueData}>{m.observedValue}</Text>
                  </View>
                  {m.tolerance && (
                    <View style={styles.valuePair}>
                      <Text style={styles.valueLabel}>Tolerance</Text>
                      <Text style={styles.valueData}>{m.tolerance}</Text>
                    </View>
                  )}
                </View>
                {m.remarks ? (
                  <Text style={styles.measurementRemarks}>Note: {m.remarks}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </View>

      {appointment && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={18} color="#f59e0b" />
            <Text style={styles.cardTitle}>Appointment</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Scheduled</Text>
            <Text style={styles.value}>{new Date(appointment.scheduledAt).toLocaleString()}</Text>
          </View>
          {appointment.location && (
            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{appointment.location}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.submitBtn}
        onPress={() => navigation.navigate('SubmitInspection', { inspectionId })}
      >
        <Ionicons name="send-outline" size={20} color="#fff" />
        <Text style={styles.submitBtnText}>Submit Inspection Result</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: { alignItems: 'center', marginBottom: 20, padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1 },
  field: { marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 15, color: '#1f2937' },
  mono: { fontFamily: 'monospace', color: '#6b7280' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8 },
  summaryPass: { backgroundColor: '#d1fae5' },
  summaryFail: { backgroundColor: '#fee2e2' },
  summaryCount: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  summaryLabel: { fontSize: 12, color: '#6b7280' },
  emptyMeasurements: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  measurementItem: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 8 },
  measurementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  measurementParam: { fontSize: 14, fontWeight: '600', color: '#1f2937', flex: 1 },
  toleranceIndicator: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  toleranceText: { fontSize: 11, fontWeight: '600' },
  measurementValues: { flexDirection: 'row', gap: 16 },
  valuePair: {},
  valueLabel: { fontSize: 10, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  valueData: { fontSize: 14, color: '#1f2937', marginTop: 2 },
  measurementRemarks: { fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937', borderRadius: 12, padding: 16, gap: 8, marginTop: 8, marginBottom: 32 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
