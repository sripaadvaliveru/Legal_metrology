import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { instrumentApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Instrument } from '../types';

const STATUS_FILTERS = ['All', 'VERIFIED', 'REGISTERED', 'PENDING_VERIFICATION', 'EXPIRED', 'REJECTED'] as const;

export default function InstrumentsScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const { data: instruments, isLoading, refetch, isError } = useQuery({
    queryKey: ['my-instruments'],
    queryFn: () => instrumentApi.listMy().then(res => res.data),
  });

  const filtered = instruments?.filter((inst: Instrument) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      inst.instrumentType?.name?.toLowerCase().includes(q) ||
      inst.manufacturer.toLowerCase().includes(q) ||
      inst.serialNumber.toLowerCase().includes(q) ||
      inst.instrumentId.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load instruments</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search instruments..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search ? <TouchableOpacity activeOpacity={0.7} onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color="#9ca3af" /></TouchableOpacity> : null}
      </View>
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.filterChip, statusFilter === item && styles.filterChipActive]}
            onPress={() => setStatusFilter(item)}
          >
            <Text style={[styles.filterText, statusFilter === item && styles.filterTextActive]}>{item === 'All' ? 'All' : item.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={false}
        contentContainerStyle={filtered?.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.7} style={styles.card} onPress={() => navigation.navigate('InstrumentDetail', { instrumentId: item.id })}>
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
      <TouchableOpacity activeOpacity={0.7} style={styles.fab} onPress={() => navigation.navigate('RegisterInstrument')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  retryBtn: { marginTop: 12, backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, marginBottom: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1f2937' },
  filterBar: { maxHeight: 44, marginBottom: 4 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  filterChipActive: { borderColor: '#1f2937', backgroundColor: '#1f2937' },
  filterText: { fontSize: 12, color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 8 },
  emptyContainer: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  instrumentId: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  type: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  detail: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
});
