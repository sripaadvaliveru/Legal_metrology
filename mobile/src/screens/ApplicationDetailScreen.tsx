import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { applicationApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_STEPS = [
  { key: 'SUBMITTED', label: 'Submitted', icon: 'document-text-outline' },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: 'eye-outline' },
  { key: 'APPROVED', label: 'Approved', icon: 'checkmark-circle-outline' },
  { key: 'ASSIGNED', label: 'Assigned', icon: 'person-outline' },
  { key: 'SCHEDULED', label: 'Scheduled', icon: 'calendar-outline' },
  { key: 'INSPECTION', label: 'Inspection', icon: 'search-outline' },
  { key: 'CERTIFICATE', label: 'Certificate', icon: 'ribbon-outline' },
];

function getStepIndex(status: string): number {
  const order: Record<string, number> = {
    SUBMITTED: 0, UNDER_REVIEW: 1, APPROVED: 2, ASSIGNMENT_PENDING: 2,
    ASSIGNED: 3, SCHEDULED: 4, INSPECTION_PENDING: 4, UNDER_INSPECTION: 5,
    PASSED: 6, CERTIFICATE_GENERATED: 6, COMPLETED: 6,
  };
  return order[status] ?? -1;
}

export default function ApplicationDetailScreen({ route, navigation }: any) {
  const { applicationId } = route.params;

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationApi.get(applicationId).then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !application) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load application details</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getStepIndex(application.status);
  const isRejected = application.status === 'REJECTED';
  const isCancelled = application.status === 'CANCELLED';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appNumber}>{application.applicationNumber}</Text>
        <Badge text={application.status.replace(/_/g, ' ')} variant={getStatusVariant(application.status)} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Type</Text>
          <Text style={styles.cardValue}>{application.type.replace(/_/g, ' ')}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Instrument</Text>
          <Text style={styles.cardValue}>{application.instrument?.instrumentType?.name ?? application.instrumentId}</Text>
        </View>
        {application.submittedAt && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Submitted</Text>
            <Text style={styles.cardValue}>{new Date(application.submittedAt).toLocaleDateString()}</Text>
          </View>
        )}
        {application.createdAt && !application.submittedAt && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Created</Text>
            <Text style={styles.cardValue}>{new Date(application.createdAt).toLocaleDateString()}</Text>
          </View>
        )}
      </View>

      {isRejected ? (
        <View style={styles.rejectedBanner}>
          <Ionicons name="close-circle" size={24} color="#ef4444" />
          <Text style={styles.rejectedText}>This application has been rejected.</Text>
        </View>
      ) : isCancelled ? (
        <View style={styles.rejectedBanner}>
          <Ionicons name="ban-outline" size={24} color="#6b7280" />
          <Text style={[styles.rejectedText, { color: '#6b7280' }]}>This application has been cancelled.</Text>
        </View>
      ) : (
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={[styles.timelineDot, isCompleted && styles.timelineDotActive, isCurrent && styles.timelineDotCurrent]}>
                  <Ionicons
                    name={isCompleted ? 'checkmark' : step.icon as any}
                    size={14}
                    color={isCompleted ? '#fff' : '#9ca3af'}
                  />
                </View>
                {index < STATUS_STEPS.length - 1 && (
                  <View style={[styles.timelineLine, isCompleted && styles.timelineLineActive]} />
                )}
                <Text style={[styles.timelineLabel, isCompleted && styles.timelineLabelActive]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#6b7280', marginTop: 12, marginBottom: 20 },
  retryBtn: { backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  appNumber: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  card: { backgroundColor: '#fff', borderRadius: 12, margin: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  cardLabel: { fontSize: 14, color: '#6b7280' },
  cardValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  rejectedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', margin: 16, padding: 16, borderRadius: 12, gap: 12 },
  rejectedText: { fontSize: 14, fontWeight: '500', color: '#ef4444', flex: 1 },
  timelineSection: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  timelineDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDotActive: { backgroundColor: '#10b981' },
  timelineDotCurrent: { backgroundColor: '#3b82f6' },
  timelineLine: { position: 'absolute', left: 13, top: 28, width: 2, height: 24, backgroundColor: '#e5e7eb' },
  timelineLineActive: { backgroundColor: '#10b981' },
  timelineLabel: { fontSize: 14, color: '#9ca3af', marginLeft: 12, marginTop: 4 },
  timelineLabelActive: { color: '#1f2937', fontWeight: '500' },
});
