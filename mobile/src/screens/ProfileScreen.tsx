import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../App';
import { businessApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { data: business, isLoading, isError, refetch } = useQuery({
    queryKey: ['business-me'],
    queryFn: () => businessApi.getMyBusiness().then(res => res.data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading && !refreshing) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role?.replace(/_/g, ' ') || 'Account'}</Text>
      </View>

      {isError ? (
        <View style={styles.card}>
          <Text style={styles.errorText}>Failed to load business details</Text>
        </View>
      ) : business && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Business Details</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Business Name</Text>
              <Text style={styles.fieldValue}>{business.businessName}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Registration No.</Text>
              <Text style={styles.fieldValue}>{business.registrationNumber || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>GST Number</Text>
              <Text style={styles.fieldValue}>{business.gstNumber || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Text style={styles.fieldValue}>{business.address || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>City</Text>
              <Text style={styles.fieldValue}>{business.city || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>State</Text>
              <Text style={styles.fieldValue}>{business.state || '—'}</Text>
            </View>
          </View>

          {business.establishments && business.establishments.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Establishments ({business.establishments.length})</Text>
              {business.establishments.map((est) => (
                <View key={est.id} style={styles.estItem}>
                  <Ionicons name="location-outline" size={18} color="#6b7280" />
                  <View style={styles.estInfo}>
                    <Text style={styles.estName}>{est.name}</Text>
                    <Text style={styles.estAddress}>{est.address}, {est.city}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <TouchableOpacity activeOpacity={0.7} style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#1f2937', padding: 24, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  role: { fontSize: 12, color: '#6b7280', marginTop: 4, backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, margin: 16, marginBottom: 0, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 },
  fieldValue: { fontSize: 15, color: '#1f2937' },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center' },
  estItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  estInfo: { flex: 1 },
  estName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  estAddress: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
});
