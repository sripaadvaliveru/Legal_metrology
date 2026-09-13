import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../App';
import { analyticsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge, { getStatusVariant } from '../components/Badge';

export default function BusinessDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const { data: kpis, isLoading, refetch, isError } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => analyticsApi.dashboard().then(res => res.data),
  });
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 12 }}>Failed to load dashboard</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12, backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = [
    { label: 'Instruments', value: kpis?.totalInstruments ?? 0, icon: 'hardware-chip-outline' as const, color: '#3b82f6' },
    { label: 'Verified', value: kpis?.verifiedInstruments ?? 0, icon: 'checkmark-circle-outline' as const, color: '#10b981' },
    { label: 'Pending', value: kpis?.pendingApplications ?? 0, icon: 'document-text-outline' as const, color: '#f59e0b' },
    { label: 'Expiring', value: kpis?.expiringSoon ?? 0, icon: 'time-outline' as const, color: '#f97316' },
    { label: 'Expired', value: kpis?.expiredInstruments ?? 0, icon: 'alert-circle-outline' as const, color: '#ef4444' },
  ];

  const menuItems = [
    { label: 'My Instruments', icon: 'hardware-chip-outline' as const, screen: 'Instruments' },
    { label: 'Register Instrument', icon: 'add-circle-outline' as const, screen: 'RegisterInstrument' },
    { label: 'My Applications', icon: 'document-text-outline' as const, screen: 'Applications' },
    { label: 'My Certificates', icon: 'ribbon-outline' as const, screen: 'Certificates' },
    { label: 'Notifications', icon: 'notifications-outline' as const, screen: 'Notifications' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.business}>{user?.businessName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon} size={24} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={24} color="#1f2937" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {kpis?.recentActivity && kpis.recentActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {kpis.recentActivity.slice(0, 5).map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityContent}>
                <Text style={styles.activityDesc}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.timestamp}</Text>
              </View>
              <Badge text={activity.status} variant={getStatusVariant(activity.status)} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, backgroundColor: '#1f2937' },
  greeting: { fontSize: 14, color: '#9ca3af' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  business: { fontSize: 14, color: '#d1d5db', marginTop: 2 },
  logoutBtn: { padding: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statCard: { width: '31%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  menuSection: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1f2937', marginLeft: 12 },
  activitySection: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  activityContent: { flex: 1 },
  activityDesc: { fontSize: 14, color: '#1f2937' },
  activityTime: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
