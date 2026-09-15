import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { instrumentApi, applicationApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

const ACTIVE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ASSIGNED', 'SCHEDULED', 'UNDER_INSPECTION', 'PASSED', 'CERTIFICATE_GENERATED'];

export default function InstrumentDetailScreen({ route, navigation }: any) {
  const { instrumentId } = route.params ?? {};

  const { data: instrument, isLoading, isError } = useQuery({
    queryKey: ['instrument', instrumentId],
    queryFn: () => instrumentApi.get(instrumentId).then(res => res.data),
  });

  const { data: appHistory } = useQuery({
    queryKey: ['instrument-app-history', instrumentId],
    queryFn: () => applicationApi.getByInstrument(instrumentId).then(res => res.data),
    enabled: !!instrumentId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !instrument) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load instrument details</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasActiveApplication = appHistory?.some((app: any) => ACTIVE_STATUSES.includes(app.status));
  const lastApp = appHistory?.[0];
  const isRejected = lastApp?.status === 'REJECTED';
  const canApply = (instrument.status === 'VERIFIED' || instrument.status === 'EXPIRED' || instrument.status === 'REGISTERED') && (!hasActiveApplication || isRejected);

  const handleApplyVerification = () => {
    navigation.navigate('SubmitApplication', { instrumentId: instrument.id });
  };

  const handleVerificationHistory = () => {
    navigation.navigate('VerificationHistory', { instrumentId: instrument.id, instrumentName: instrument.instrumentType?.name });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.passportHeader}>
        <Text style={styles.passportLabel}>DIGITAL INSTRUMENT PASSPORT</Text>
        <Text style={styles.typeName}>{instrument.instrumentType?.name ?? 'Unknown Type'}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Instrument ID</Text>
          <Text style={styles.cardValue}>{instrument.instrumentId}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Status</Text>
          <Badge text={instrument.status} variant={getStatusVariant(instrument.status)} />
        </View>
        <View style={styles.divider} />
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Manufacturer</Text>
          <Text style={styles.cardValue}>{instrument.manufacturer}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Model</Text>
          <Text style={styles.cardValue}>{instrument.model}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Serial Number</Text>
          <Text style={styles.cardValue}>{instrument.serialNumber}</Text>
        </View>
        {instrument.capacityRange && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Capacity / Range</Text>
            <Text style={styles.cardValue}>{instrument.capacityRange}</Text>
          </View>
        )}
        {instrument.yearOfManufacture && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Year of Manufacture</Text>
            <Text style={styles.cardValue}>{instrument.yearOfManufacture}</Text>
          </View>
        )}
        {instrument.usage && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Usage</Text>
            <Text style={styles.cardValue}>{instrument.usage}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity activeOpacity={0.7} style={styles.historyBtn} onPress={handleVerificationHistory}>
        <Ionicons name="time-outline" size={20} color="#3b82f6" />
        <Text style={styles.historyBtnText}>Verification History</Text>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>

      {canApply && (
        <TouchableOpacity activeOpacity={0.7} style={styles.applyBtn} onPress={handleApplyVerification}>
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.applyBtnText}>
            {instrument.status === 'EXPIRED' ? 'Apply for Re-verification' : 'Apply for Verification'}
          </Text>
        </TouchableOpacity>
      )}

      {hasActiveApplication && !isRejected && (
        <View style={styles.activeAppBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
          <Text style={styles.activeAppText}>This instrument already has an active application ({lastApp?.applicationNumber}). Wait for it to complete or get rejected before applying again.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#6b7280', marginTop: 12, marginBottom: 20 },
  backBtn: { backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  passportHeader: { backgroundColor: '#1f2937', padding: 20, alignItems: 'center' },
  passportLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 2 },
  typeName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, margin: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  cardLabel: { fontSize: 14, color: '#6b7280' },
  cardValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  historyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  historyBtnText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1f2937' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 16, gap: 8 },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  activeAppBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#eff6ff', borderRadius: 12, marginHorizontal: 16, marginBottom: 32, padding: 14 },
  activeAppText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 18 },
});
