import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { applicationApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Application } from '../types';

export default function ApplicationsScreen({ navigation }: any) {
  const { data: applications, isLoading, refetch, isError } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationApi.list().then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 12 }}>Failed to load applications</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12, backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={applications?.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.appNumber}>{item.applicationNumber}</Text>
              <Badge text={item.status} variant={getStatusVariant(item.status)} />
            </View>
            <Text style={styles.type}>{item.type.replace(/_/g, ' ')}</Text>
            <Text style={styles.detail}>Instrument: {item.instrumentId.slice(0, 8)}...</Text>
            {item.submittedAt && (
              <Text style={styles.detail}>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No Applications"
            message="Submit a verification application to get started."
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SubmitApplication')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  appNumber: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  type: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  detail: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
