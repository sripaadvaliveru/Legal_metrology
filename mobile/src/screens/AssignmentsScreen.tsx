import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi, assignmentApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorState, { isNetworkError } from '../components/ErrorState';
import type { Appointment } from '../types';

const STATUS_FILTERS = ['All', 'PENDING', 'IN_PROGRESS', 'SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'FAILED', 'RE_INSPECTION', 'CANCELLED'];
const FILTER_LABELS: Record<string, string> = {
  All: 'All',
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  SCHEDULED: 'Scheduled',
  RESCHEDULED: 'Rescheduled',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  RE_INSPECTION: 'Re-inspection',
  CANCELLED: 'Cancelled',
};

export default function AssignmentsScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState('All');
  const { data: appointments, isLoading: loadingAppts, refetch, isError, error } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentApi.listMy().then(res => res.data),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => assignmentApi.listMy().then(res => res.data),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const scheduledAppointmentIds = useMemo(() =>
    new Set((appointments || []).map((a: any) => a.assignment?.id).filter(Boolean)),
    [appointments]
  );

  const unscheduledAssignments = useMemo(() =>
    (assignments || []).filter((a: any) => !scheduledAppointmentIds.has(a.id)),
    [assignments, scheduledAppointmentIds]
  );

  const appointmentItems = useMemo(() =>
    (appointments || []).map((a: any) => ({
      id: a.id,
      type: 'appointment' as const,
      status: a.status === 'SCHEDULED' && new Date(a.scheduledAt) <= new Date() ? 'IN_PROGRESS' : a.status,
      data: a,
    })),
    [appointments]
  );

  const assignmentItems = useMemo(() =>
    unscheduledAssignments.map((a: any) => ({
      id: a.id,
      type: 'assignment' as const,
      status: 'PENDING',
      data: a,
    })),
    [unscheduledAssignments]
  );

  const allItems = useMemo(() => [...appointmentItems, ...assignmentItems], [appointmentItems, assignmentItems]);

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return allItems;
    return allItems.filter(item => item.status === activeFilter);
  }, [allItems, activeFilter]);

  if (loadingAppts || loadingAssignments) return <LoadingSpinner />;

  if (isError) {
    return <ErrorState onRetry={() => refetch()} isNetworkError={isNetworkError(error)} />;
  }

  const renderItem = ({ item }: { item: { id: string; type: 'appointment' | 'assignment'; status: string; data: any } }) => {
    if (item.type === 'appointment') {
      const appt = item.data as Appointment;
      const app = appt.application;
      const instrument = app?.instrument;
      const typeName = instrument?.instrumentType?.name || 'Instrument';
      const serialNum = instrument?.serialNumber || '';
      const manufacturer = instrument?.manufacturer || '';
      const model = instrument?.model || '';
      const isOverdue = new Date(appt.scheduledAt) < new Date() && appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED';

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.card, isOverdue && styles.cardOverdue]}
          onPress={() => navigation.navigate('InspectionDetail', { appointmentId: appt.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardAppNumber}>{app?.applicationNumber || 'No Application'}</Text>
            <Badge text={appt.status} variant={getStatusVariant(appt.status)} />
          </View>
          <Text style={styles.cardType}>{typeName}</Text>
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
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={styles.detailText}>{new Date(appt.scheduledAt).toLocaleString()}</Text>
          </View>
          {appt.location ? (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color="#6b7280" />
              <Text style={styles.detailText}>{appt.location}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    }

    const asgn = item.data;
    const app = asgn.application;
    const instrument = app?.instrument;
    const typeName = instrument?.instrumentType?.name || 'Instrument';

    return (
      <View
        style={[styles.card, styles.cardPending]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardAppNumber}>{app?.applicationNumber || 'No Application'}</Text>
          <Badge text="Pending Scheduling" variant="warning" />
        </View>
        <Text style={styles.cardType}>{typeName}</Text>
        <View style={styles.detailRow}>
          <Ionicons name="clipboard-outline" size={14} color="#f97316" />
          <Text style={[styles.detailText, { color: '#f97316' }]}>Awaiting scheduling by admin</Text>
        </View>
      </View>
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
        keyExtractor={(item) => `${item.type}-${item.id}`}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-outline"
            title="No Assignments"
            message={activeFilter === 'All' ? 'You have no assignments or inspections.' : `No ${FILTER_LABELS[activeFilter].toLowerCase()} items.`}
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
  cardPending: { borderLeftWidth: 3, borderLeftColor: '#f97316' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardAppNumber: { fontSize: 15, fontWeight: '700', color: '#1f2937', flex: 1 },
  cardType: { fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  detailText: { fontSize: 13, color: '#6b7280' },
});
