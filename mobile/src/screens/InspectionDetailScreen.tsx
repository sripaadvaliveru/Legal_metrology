import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { appointmentApi, inspectionApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge, { getStatusVariant } from '../components/Badge';

export default function InspectionDetailScreen({ route, navigation }: any) {
  const { appointmentId } = route.params;

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentApi.get(appointmentId).then(res => res.data),
  });

  const createInspectionMutation = useMutation({
    mutationFn: (apptId: string) => inspectionApi.create(apptId),
    onSuccess: (data) => {
      navigation.navigate('RecordMeasurements', { inspectionId: data.data.id });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to start inspection');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!appointment) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Appointment Details</Text>
          <Badge text={appointment.status} variant={getStatusVariant(appointment.status)} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Scheduled At</Text>
          <Text style={styles.value}>{new Date(appointment.scheduledAt).toLocaleString()}</Text>
        </View>

        {appointment.location && (
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{appointment.location}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Appointment ID</Text>
          <Text style={[styles.value, styles.mono]}>{appointment.id}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.startBtn, createInspectionMutation.isPending && styles.startBtnDisabled]}
        onPress={() => createInspectionMutation.mutate(appointmentId)}
        disabled={createInspectionMutation.isPending}
      >
        <Ionicons name="play-circle-outline" size={22} color="#fff" />
        <Text style={styles.startBtnText}>
          {createInspectionMutation.isPending ? 'Starting...' : 'Start Inspection'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 16, color: '#1f2937' },
  mono: { fontSize: 13, fontFamily: 'monospace', color: '#6b7280' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', borderRadius: 12, padding: 16, gap: 8 },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
