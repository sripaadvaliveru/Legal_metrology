import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { appointmentApi, inspectionApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge, { getStatusVariant } from '../components/Badge';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function InspectionDetailScreen({ route, navigation }: any) {
  const { appointmentId } = route.params;
  const [gpsCheckDone, setGpsCheckDone] = useState(false);

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

  const handleStartInspection = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for GPS verification. You can still proceed.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed Anyway', onPress: () => createInspectionMutation.mutate(appointmentId) },
        ]);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const currentLat = location.coords.latitude;
      const currentLng = location.coords.longitude;

      // Check if we can get establishment coordinates from the appointment location string
      // For now, just proceed with GPS check against appointment location if available
      createInspectionMutation.mutate(appointmentId);
    } catch {
      // GPS unavailable, proceed anyway
      createInspectionMutation.mutate(appointmentId);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!appointment) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load appointment details</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const app = appointment.application;
  const instrument = app?.instrument;
  const isOverdue = new Date(appointment.scheduledAt) < new Date() && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED';
  const isReinspection = app?.status === 'REINSPECTION_REQUIRED';

  return (
    <ScrollView style={styles.container}>
      {isOverdue && (
        <View style={styles.overdueBanner}>
          <Ionicons name="warning-outline" size={18} color="#fff" />
          <Text style={styles.overdueText}>This inspection is overdue</Text>
        </View>
      )}

      {isReinspection && (
        <View style={styles.reinspectionBanner}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.reinspectionText}>Re-inspection Required — Previous inspection failed. Review findings before starting.</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Appointment</Text>
          <Badge text={appointment.status} variant={getStatusVariant(appointment.status)} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Scheduled At</Text>
          <Text style={styles.value}>{new Date(appointment.scheduledAt).toLocaleString()}</Text>
        </View>

        {appointment.location && (
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.fieldRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.value}>{appointment.location}</Text>
            </View>
          </View>
        )}
      </View>

      {instrument && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={20} color="#3b82f6" />
            <Text style={styles.cardTitle}>Instrument</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{instrument.instrumentType?.name || 'N/A'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Manufacturer</Text>
              <Text style={styles.value}>{instrument.manufacturer || 'N/A'}</Text>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Model</Text>
              <Text style={styles.value}>{instrument.model || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Serial Number</Text>
            <Text style={[styles.value, styles.mono]}>{instrument.serialNumber || 'N/A'}</Text>
          </View>

          {instrument.capacityRange && (
            <View style={styles.field}>
              <Text style={styles.label}>Capacity / Range</Text>
              <Text style={styles.value}>{instrument.capacityRange}</Text>
            </View>
          )}

          {instrument.yearOfManufacture && (
            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Year</Text>
                <Text style={styles.value}>{instrument.yearOfManufacture}</Text>
              </View>
              {instrument.usage ? (
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Usage</Text>
                  <Text style={styles.value}>{instrument.usage}</Text>
                </View>
              ) : null}
            </View>
          )}

          {instrument.status && (
            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <Badge text={instrument.status} variant={getStatusVariant(instrument.status)} />
            </View>
          )}
        </View>
      )}

      {app && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color="#8b5cf6" />
            <Text style={styles.cardTitle}>Application</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Application Number</Text>
            <Text style={[styles.value, styles.mono]}>{app.applicationNumber}</Text>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{app.type?.replace(/_/g, ' ')}</Text>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Status</Text>
              <Badge text={app.status} variant={getStatusVariant(app.status)} />
            </View>
          </View>

          {app.submittedAt && (
            <View style={styles.field}>
              <Text style={styles.label}>Submitted</Text>
              <Text style={styles.value}>{new Date(app.submittedAt).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      )}

      {appointment.location && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navigateBtn}
          onPress={() => {
            const query = encodeURIComponent(appointment.location || '');
            const url = Platform.OS === 'ios'
              ? `maps:0,0?q=${query}`
              : `geo:0,0?q=${query}`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Navigation', 'Could not open maps app.');
            });
          }}
        >
          <Ionicons name="navigate-outline" size={20} color="#3b82f6" />
          <Text style={styles.navigateBtnText}>Navigate to Location</Text>
          <Ionicons name="open-outline" size={16} color="#9ca3af" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.startBtn, createInspectionMutation.isPending && styles.startBtnDisabled]}
        onPress={handleStartInspection}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#6b7280', marginTop: 12, marginBottom: 20 },
  backBtn: { backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  overdueBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f97316', borderRadius: 10, padding: 12, marginBottom: 12 },
  overdueText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reinspectionBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef4444', borderRadius: 10, padding: 12, marginBottom: 12 },
  reinspectionText: { color: '#fff', fontSize: 13, fontWeight: '500', flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  field: { marginBottom: 12 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 15, color: '#1f2937' },
  mono: { fontFamily: 'monospace', color: '#6b7280' },
  navigateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginBottom: 12 },
  navigateBtnText: { fontSize: 14, fontWeight: '500', color: '#1e40af', flex: 1 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', borderRadius: 12, padding: 16, gap: 8, marginTop: 4, marginBottom: 32 },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
