import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Appointment } from '../types';

const STATUS_FILTERS = ['All', 'SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'];
const FILTER_LABELS: Record<string, string> = {
  All: 'All',
  SCHEDULED: 'Scheduled',
  RESCHEDULED: 'Rescheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function AssignmentsScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState('All');
  const { data: appointments, isLoading, refetch, isError } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentApi.listMy().then(res => res.data),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const filtered = useMemo(() => {
    if (!appointments) return [];
    if (activeFilter === 'All') return appointments;
    return appointments.filter(a => a.status === activeFilter);
  }, [appointments, activeFilter]);

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load assignments</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Appointment }) => {
    const app = item.application;
    const instrument = app?.instrument;
    const typeName = instrument?.instrumentType?.name || 'Instrument';
    const serialNum = instrument?.serialNumber || '';
    const manufacturer = instrument?.manufacturer || '';
    const model = instrument?.model || '';
    const isOverdue = new Date(item.scheduledAt) < new Date() && item.status !== 'COMPLETED' && item.status !== 'CANCELLED';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.card, isOverdue && styles.cardOverdue]}
        onPress={() => navigation.navigate('InspectionDetail', { appointmentId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardType}>{typeName}</Text>
          <Badge text={item.status} variant={getStatusVariant(item.status)} />
        </View>

        {serialNum ? (
          <View style={styles.detailRow}>
            <Ionicons name="hardware-chip-outline" size={14} color="#6b7280" />
            <Text style={styles.detailText}>{manufacturer} {model}</Text>
          </View>
        ) : null}

        {serialNum ? (
          <View style={styles.detailRow}>
            <Ionicons name="finger-print-outline" size={14} color="#6b7280" />
            <Text style={styles.detailText}>S/N: {serialNum}</Text>
          </View>
        ) : null}

        {app?.applicationNumber ? (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={14} color="#6b7280" />
            <Text style={styles.detailText}>{app.applicationNumber}</Text>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{new Date(item.scheduledAt).toLocaleString()}</Text>
        </View>

        {item.location ? (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            activeOpacity={0.7}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-outline"
            title="No Assignments"
            message={activeFilter === 'All' ? 'You have no scheduled inspections.' : `No ${FILTER_LABELS[activeFilter].toLowerCase()} inspections.`}
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
  filterBar: { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', marginRight: 0 },
  filterChipActive: { backgroundColor: '#1f2937' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: '#f97316' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardType: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  detailText: { fontSize: 13, color: '#6b7280' },
});
