import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { inspectionApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function LmoHistoryScreen({ navigation }: any) {
  const { data: inspections, isLoading, refetch } = useQuery({
    queryKey: ['lmo-history'],
    queryFn: () => inspectionApi.listMy().then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const completed = (inspections || []).filter((i: any) => i.result === 'PASS' || i.result === 'FAIL');
  const pending = (inspections || []).filter((i: any) => i.result === 'PENDING');

  const stats = [
    { label: 'Completed', value: completed.length, color: '#10b981' },
    { label: 'Passed', value: completed.filter((i: any) => i.result === 'PASS').length, color: '#3b82f6' },
    { label: 'Failed', value: completed.filter((i: any) => i.result === 'FAIL').length, color: '#ef4444' },
    { label: 'Pending', value: pending.length, color: '#f59e0b' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={completed}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={completed.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.card}
            onPress={() => navigation.navigate('InspectionDetail', { appointmentId: item.appointment?.id })}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name={item.result === 'PASS' ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={item.result === 'PASS' ? '#10b981' : '#ef4444'}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  {item.appointment?.application?.applicationNumber || 'Inspection'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {item.appointment?.application?.instrument?.instrumentType?.name || 'Instrument'}
                </Text>
              </View>
              <Badge text={item.result} variant={item.result === 'PASS' ? 'success' : 'error'} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.detailText}>
                {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'No date'}
              </Text>
              {item.appointment?.location && (
                <Text style={styles.detailText}>{item.appointment.location}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-outline"
            title="No Inspection History"
            message="Completed inspections will appear here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  list: { padding: 12 },
  emptyContainer: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  cardSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  detailText: { fontSize: 12, color: '#9ca3af' },
});
