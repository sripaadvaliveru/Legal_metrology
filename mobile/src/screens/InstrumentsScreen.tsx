import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { instrumentApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Instrument } from '../types';

export default function InstrumentsScreen({ navigation }: any) {
  const { data: instruments, isLoading, refetch, isError } = useQuery({
    queryKey: ['my-instruments'],
    queryFn: () => instrumentApi.listMy().then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 12 }}>Failed to load instruments</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12, backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={instruments}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={instruments?.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('InstrumentDetail', { instrumentId: item.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.instrumentId}>{item.instrumentId}</Text>
              <Badge text={item.status} variant={getStatusVariant(item.status)} />
            </View>
            <Text style={styles.type}>{item.instrumentType?.name ?? 'Unknown Type'}</Text>
            <Text style={styles.detail}>{item.manufacturer} {item.model}</Text>
            <Text style={styles.detail}>S/N: {item.serialNumber}</Text>
            {item.capacityRange && <Text style={styles.detail}>Capacity: {item.capacityRange}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="hardware-chip-outline"
            title="No Instruments"
            message="Register your first instrument to get started."
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('RegisterInstrument')}>
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
  instrumentId: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  type: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  detail: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
});
