import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../App';
import { analyticsApi, notificationApi, applicationApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge, { getStatusVariant } from '../components/Badge';
import ErrorState, { isNetworkError } from '../components/ErrorState';

export default function BusinessDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const { data: kpis, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => analyticsApi.dashboard().then(res => res.data),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.unreadCount().then(res => res.data),
    staleTime: 30000,
  });
  const { data: applications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationApi.list().then((res: any) => res.data),
    staleTime: 60000,
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
    return <ErrorState onRetry={() => refetch()} isNetworkError={isNetworkError(error)} />;
  }

  const failedApps = (applications || []).filter((a: any) => a.status === 'REJECTED' || a.status === 'FAILED');

  const stats = [
    { label: 'Instruments', value: kpis?.totalInstruments ?? 0, icon: 'hardware-chip-outline' as const, color: '#3b82f6' },
    { label: 'Verified', value: kpis?.verifiedInstruments ?? 0, icon: 'checkmark-circle-outline' as const, color: '#10b981' },
    { label: 'Pending', value: kpis?.pendingApplications ?? 0, icon: 'document-text-outline' as const, color: '#f59e0b' },
    { label: 'Failed', value: failedApps.length, icon: 'close-circle-outline' as const, color: '#ef4444' },
    { label: 'Expiring', value: kpis?.expiringSoon ?? 0, icon: 'time-outline' as const, color: '#f97316' },
    { label: 'Expired', value: kpis?.expiredInstruments ?? 0, icon: 'alert-circle-outline' as const, color: '#ef4444' },
  ];

  const alerts: { icon: any; color: string; text: string }[] = [];
  if (kpis && kpis.expiringSoon > 0) alerts.push({ icon: 'warning-outline', color: '#f97316', text: `${kpis.expiringSoon} certificate(s) expiring soon` });
  if (kpis && kpis.expiredInstruments > 0) alerts.push({ icon: 'alert-circle-outline', color: '#ef4444', text: `${kpis.expiredInstruments} instrument(s) expired` });
  if (unreadData && unreadData.count > 0) alerts.push({ icon: 'notifications-outline', color: '#3b82f6', text: `${unreadData.count} unread notification(s)` });

  const menuItems = [
    { label: 'My Instruments', icon: 'hardware-chip-outline' as const, screen: 'InstrumentsTab' },
    { label: 'Register Instrument', icon: 'add-circle-outline' as const, screen: 'RegisterInstrument' },
    { label: 'Apply for Verification', icon: 'document-text-outline' as const, screen: 'SubmitApplication' },
    { label: 'My Applications', icon: 'document-text-outline' as const, screen: 'ApplicationsTab' },
    { label: 'My Certificates', icon: 'ribbon-outline' as const, screen: 'Certificates' },
    { label: 'Notifications', icon: 'notifications-outline' as const, screen: 'Notifications', badge: unreadData?.count },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.business}>{user?.businessName || ''}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutBtn}>
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

      {alerts.length > 0 && (
        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          {alerts.map((alert, index) => (
            <View key={index} style={[styles.alertCard, { borderLeftColor: alert.color }]}>
              <Ionicons name={alert.icon} size={20} color={alert.color} />
              <Text style={styles.alertText}>{alert.text}</Text>
            </View>
          ))}
        </View>
      )}

      {kpis?.compliancePercentage != null && (
        <View style={styles.complianceSection}>
          <Text style={styles.sectionTitle}>Compliance</Text>
          <View style={styles.complianceBar}>
            <View style={[styles.complianceFill, { width: `${Math.min(kpis.compliancePercentage, 100)}%` }]} />
          </View>
          <Text style={styles.complianceText}>{Math.min(kpis.compliancePercentage, 100)}% compliant</Text>
        </View>
      )}

      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={24} color="#1f2937" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.badge ? (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            )}
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
  complianceSection: { padding: 16 },
  complianceBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  complianceFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 4 },
  complianceText: { fontSize: 13, color: '#6b7280' },
  alertsSection: { padding: 16, paddingBottom: 0 },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, gap: 10, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  alertText: { fontSize: 14, color: '#1f2937', flex: 1 },
  badgeContainer: { backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
