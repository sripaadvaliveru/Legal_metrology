import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { certificateApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Certificate } from '../types';

export default function CertificatesScreen({ navigation }: any) {
  const { data: certificates, isLoading, refetch } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateApi.listMy().then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <FlatList
      data={certificates}
      keyExtractor={(item) => item.id}
      onRefresh={refetch}
      refreshing={isLoading}
      style={styles.container}
      contentContainerStyle={certificates?.length === 0 ? styles.emptyContainer : styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('CertificateDetail', { certificateId: item.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.certNumber}>{item.certificateNumber}</Text>
            <Badge text={item.status} variant={getStatusVariant(item.status)} />
          </View>
          <Text style={styles.detail}>Issued: {item.verificationDate}</Text>
          <Text style={styles.detail}>Valid Until: {item.validUntil}</Text>
          {item.issuedBy && <Text style={styles.detail}>Issued by: {item.issuedBy}</Text>}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="ribbon-outline"
          title="No Certificates"
          message="Certificates will appear here after successful inspections."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  certNumber: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  detail: { fontSize: 14, color: '#6b7280', marginTop: 2 },
});
