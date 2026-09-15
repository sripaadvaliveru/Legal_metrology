import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { applicationApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Application } from '../types';

export default function VerificationHistoryScreen({ route, navigation }: any) {
  const { instrumentId, instrumentName } = route.params ?? {};

  const { data: applications, isLoading, refetch, isError } = useQuery({
    queryKey: ['instrument-applications', instrumentId],
    queryFn: () => applicationApi.getByInstrument(instrumentId).then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load verification history</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sorted = (applications || []).sort((a, b) => {
    const dateA = new Date(a.submittedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.submittedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const getTimelineIcon = (status: string) => {
    const s = status.toUpperCase();
    if (['COMPLETED', 'CERTIFICATE_GENERATED', 'PASSED', 'APPROVED'].includes(s)) return { name: 'checkmark-circle' as const, color: '#10b981' };
    if (['FAILED', 'REJECTED', 'CANCELLED'].includes(s)) return { name: 'close-circle' as const, color: '#ef4444' };
    if (['REINSPECTION_REQUIRED'].includes(s)) return { name: 'refresh-circle' as const, color: '#f59e0b' };
    return { name: 'time-outline' as const, color: '#6b7280' };
  };

  const renderApplication = ({ item, index }: { item: Application; index: number }) => {
    const icon = getTimelineIcon(item.status);
    const date = item.submittedAt || item.createdAt;

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineDot, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={16} color="#fff" />
          </View>
          {index < sorted.length - 1 && <View style={styles.timelineLine} />}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.card}
          onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.appNumber}>{item.applicationNumber}</Text>
            <Badge text={item.status} variant={getStatusVariant(item.status)} />
          </View>

          <View style={styles.cardField}>
            <Text style={styles.cardLabel}>Type</Text>
            <Text style={styles.cardValue}>{item.type?.replace(/_/g, ' ')}</Text>
          </View>

          {date && (
            <View style={styles.cardField}>
              <Text style={styles.cardLabel}>Submitted</Text>
              <Text style={styles.cardValue}>{new Date(date).toLocaleDateString()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verification History</Text>
        {instrumentName && <Text style={styles.headerSubtitle}>{instrumentName}</Text>}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={sorted.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={renderApplication}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No History"
            message="This instrument has no verification applications yet."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6b7280', marginTop: 12, marginBottom: 20 },
  retryBtn: { backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  header: { backgroundColor: '#1f2937', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#d1d5db', marginTop: 4 },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { width: 32, alignItems: 'center' },
  timelineDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginTop: 4 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, marginLeft: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  appNumber: { fontSize: 14, fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' },
  cardField: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardLabel: { fontSize: 12, color: '#9ca3af' },
  cardValue: { fontSize: 13, fontWeight: '500', color: '#374151' },
});
