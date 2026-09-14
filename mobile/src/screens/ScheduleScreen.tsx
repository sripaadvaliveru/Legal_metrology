import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Calendar, DateData } from 'react-native-calendars';
import { appointmentApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Appointment } from '../types';

export default function ScheduleScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: appointments, isLoading, refetch, isError } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentApi.listMy().then(res => res.data),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (appointments) {
      appointments.forEach(a => {
        const date = new Date(a.scheduledAt).toISOString().split('T')[0];
        if (!marks[date]) {
          marks[date] = { dots: [] };
        }
        const color = a.status === 'COMPLETED' ? '#10b981' :
                      a.status === 'CANCELLED' ? '#ef4444' :
                      new Date(a.scheduledAt) < new Date() ? '#f97316' : '#3b82f6';
        marks[date].dots.push({ color });
      });
    }
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = '#1f2937';
    } else {
      marks[selectedDate] = { selected: true, selectedColor: '#1f2937' };
    }
    return marks;
  }, [appointments, selectedDate]);

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments
      .filter(a => new Date(a.scheduledAt).toISOString().split('T')[0] === selectedDate)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [appointments, selectedDate]);

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load schedule</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const app = item.application;
    const instrument = app?.instrument;
    const typeName = instrument?.instrumentType?.name || 'Instrument';
    const isOverdue = new Date(item.scheduledAt) < new Date() && item.status !== 'COMPLETED' && item.status !== 'CANCELLED';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.card, isOverdue && styles.cardOverdue]}
        onPress={() => navigation.navigate('InspectionDetail', { appointmentId: item.id })}
      >
        <View style={styles.cardTime}>
          <Text style={styles.timeText}>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardType}>{typeName}</Text>
            <Badge text={item.status} variant={getStatusVariant(item.status)} />
          </View>
          {instrument?.serialNumber && (
            <Text style={styles.cardDetail}>S/N: {instrument.serialNumber}</Text>
          )}
          {item.location && (
            <View style={styles.cardDetailRow}>
              <Ionicons name="location-outline" size={12} color="#9ca3af" />
              <Text style={styles.cardDetail}>{item.location}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#6b7280',
          selectedDayBackgroundColor: '#1f2937',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3b82f6',
          dayTextColor: '#1f2937',
          textDisabledColor: '#d1d5db',
          dotColor: '#3b82f6',
          arrowColor: '#1f2937',
          monthTextColor: '#1f2937',
          textMonthFontWeight: '600',
        }}
      />

      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <Text style={styles.dayCount}>{filteredAppointments.length} inspection{filteredAppointments.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={filteredAppointments.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={renderAppointment}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No Inspections"
            message="No inspections scheduled for this date."
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
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  dayTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  dayCount: { fontSize: 13, color: '#6b7280' },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: '#f97316' },
  cardTime: { backgroundColor: '#f3f4f6', padding: 12, justifyContent: 'center', alignItems: 'center', minWidth: 72 },
  timeText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  cardContent: { flex: 1, padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardType: { fontSize: 14, fontWeight: '600', color: '#1f2937', flex: 1 },
  cardDetail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
});
