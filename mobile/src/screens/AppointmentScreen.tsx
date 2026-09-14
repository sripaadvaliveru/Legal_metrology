import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function AppointmentScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: appointments, isLoading, refetch, isError } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentApi.listMy().then(res => res.data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) return <LoadingSpinner />;

  if (isError && !refreshing) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 12 }}>Failed to load appointments</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={appointments?.length === 0 ? styles.emptyContainer : styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {appointments && appointments.length > 0 ? (
        appointments.map((appt) => (
          <View key={appt.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
              <Text style={styles.date}>{new Date(appt.scheduledAt).toLocaleDateString()}</Text>
              <Badge text={appt.status} variant={getStatusVariant(appt.status)} />
            </View>
            <Text style={styles.time}>
              <Ionicons name="time-outline" size={14} color="#6b7280" /> {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {appt.location && (
              <Text style={styles.location}>
                <Ionicons name="location-outline" size={14} color="#6b7280" /> {appt.location}
              </Text>
            )}
          </View>
        ))
      ) : (
        <EmptyState
          icon="calendar-outline"
          title="No Appointments"
          message="You have no scheduled appointments yet."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryBtn: { marginTop: 12, backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  date: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1f2937' },
  time: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  location: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});
