import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { certificateApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CertificateDetailScreen({ route }: any) {
  const { certificateId } = route.params;
  const { data: cert, isLoading } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => certificateApi.get(certificateId).then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!cert) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.certNumber}>{cert.certificateNumber}</Text>
          <Badge text={cert.status} variant={getStatusVariant(cert.status)} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Verification Date</Text>
          <Text style={styles.value}>{cert.verificationDate}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Valid Until</Text>
          <Text style={styles.value}>{cert.validUntil}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Instrument ID</Text>
          <Text style={styles.value}>{cert.instrumentId}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Inspection ID</Text>
          <Text style={styles.value}>{cert.inspectionId}</Text>
        </View>

        {cert.issuedBy && (
          <View style={styles.field}>
            <Text style={styles.label}>Issued By</Text>
            <Text style={styles.value}>{cert.issuedBy}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>QR Token</Text>
          <Text style={[styles.value, styles.qrToken]}>{cert.qrToken}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  certNumber: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 16, color: '#1f2937' },
  qrToken: { fontSize: 12, color: '#6b7280', fontFamily: 'monospace' },
});
