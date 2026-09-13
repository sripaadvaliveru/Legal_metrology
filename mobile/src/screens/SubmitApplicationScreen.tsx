import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { applicationApi, instrumentApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Badge, { getStatusVariant } from '../components/Badge';
import type { Instrument } from '../types';

export default function SubmitApplicationScreen({ navigation }: any) {
  const [selectedInstrument, setSelectedInstrument] = useState('');
  const [appType, setAppType] = useState<'INITIAL_VERIFICATION' | 'RE_VERIFICATION'>('INITIAL_VERIFICATION');

  const { data: instruments, isLoading } = useQuery({
    queryKey: ['my-instruments'],
    queryFn: () => instrumentApi.listMy().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => applicationApi.create(data),
    onSuccess: () => {
      Alert.alert('Success', 'Application submitted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit application');
    },
  });

  const handleSubmit = () => {
    if (!selectedInstrument) {
      Alert.alert('Error', 'Please select an instrument');
      return;
    }
    createMutation.mutate({
      instrumentId: selectedInstrument,
      type: appType,
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Instrument *</Text>
        {instruments && instruments.length > 0 ? (
          instruments.map((inst) => (
            <TouchableOpacity
              key={inst.id}
              style={[styles.instrumentCard, selectedInstrument === inst.id && styles.instrumentCardActive]}
              onPress={() => setSelectedInstrument(inst.id)}
            >
              <View style={styles.instrumentHeader}>
                <Text style={styles.instrumentId}>{inst.instrumentId}</Text>
                <Badge text={inst.status} variant={getStatusVariant(inst.status)} />
              </View>
              <Text style={styles.instrumentType}>{inst.instrumentType?.name ?? 'Unknown'}</Text>
              <Text style={styles.instrumentDetail}>{inst.manufacturer} {inst.model}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon="hardware-chip-outline"
            title="No Instruments"
            message="Register an instrument first before submitting an application."
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application Type *</Text>
        <View style={styles.chipContainer}>
          <TouchableOpacity
            style={[styles.chip, appType === 'INITIAL_VERIFICATION' && styles.chipActive]}
            onPress={() => setAppType('INITIAL_VERIFICATION')}
          >
            <Text style={[styles.chipText, appType === 'INITIAL_VERIFICATION' && styles.chipTextActive]}>
              Initial Verification
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, appType === 'RE_VERIFICATION' && styles.chipActive]}
            onPress={() => setAppType('RE_VERIFICATION')}
          >
            <Text style={[styles.chipText, appType === 'RE_VERIFICATION' && styles.chipTextActive]}>
              Re-Verification
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!selectedInstrument || createMutation.isPending) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!selectedInstrument || createMutation.isPending}
      >
        <Text style={styles.submitBtnText}>
          {createMutation.isPending ? 'Submitting...' : 'Submit Application'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  instrumentCard: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 8 },
  instrumentCardActive: { borderColor: '#1f2937', backgroundColor: '#f9fafb' },
  instrumentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  instrumentId: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  instrumentType: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  instrumentDetail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  chipContainer: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  chipActive: { borderColor: '#1f2937', backgroundColor: '#1f2937' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#1f2937', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
