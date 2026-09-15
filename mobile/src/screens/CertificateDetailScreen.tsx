import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { certificateApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CertificateDetailScreen({ route }: any) {
  const { certificateId } = route.params ?? {};
  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => certificateApi.get(certificateId).then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !cert) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 16, color: '#6b7280' }}>Certificate not found</Text>
      </View>
    );
  }

  const verifyUrl = `https://legalmetrology.gov.in/verify/${cert.qrToken}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Legal Metrology Certificate\nNumber: ${cert.certificateNumber}\nValid Until: ${cert.validUntil}\nVerify at: ${verifyUrl}`,
        title: 'Share Certificate',
      });
    } catch {}
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.certNumber}>{cert.certificateNumber}</Text>
          <Badge text={cert.status} variant={getStatusVariant(cert.status)} />
        </View>

        <View style={styles.qrContainer}>
          <QRCode
            value={verifyUrl}
            size={180}
            color="#1f2937"
            backgroundColor="#ffffff"
          />
          <Text style={styles.qrLabel}>Scan to verify</Text>
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

        <TouchableOpacity activeOpacity={0.7} style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>Share Certificate</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  certNumber: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  qrContainer: { alignItems: 'center', paddingVertical: 20, marginBottom: 16, backgroundColor: '#f9fafb', borderRadius: 12 },
  qrLabel: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 16, color: '#1f2937' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937', borderRadius: 12, padding: 14, marginTop: 8, gap: 8 },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
