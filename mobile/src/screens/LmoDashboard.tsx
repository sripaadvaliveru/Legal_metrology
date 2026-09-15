import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../App';
import { analyticsApi, notificationApi, appointmentApi } from '../services/api';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState, { isNetworkError } from '../components/ErrorState';

export default function LmoDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const { data: kpis, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['lmo-dashboard-kpis'],
    queryFn: () => analyticsApi.dashboard().then(res => res.data),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: appointments } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentApi.listMy().then(res => res.data),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.unreadCount().then(res => res.data),
    staleTime: 30000,
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

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const todayAppointments = (appointments || []).filter(a => {
    const d = new Date(a.scheduledAt).toISOString().split('T')[0];
    return d === todayStr && a.status !== 'COMPLETED' && a.status !== 'CANCELLED';
  });

  const upcomingAppointments = (appointments || []).filter(a => {
    const d = new Date(a.scheduledAt);
    return d > now && a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && d.toISOString().split('T')[0] !== todayStr;
  });

  const overdueAppointments = (appointments || []).filter(a => {
    const d = new Date(a.scheduledAt);
    return d < now && a.status !== 'COMPLETED' && a.status !== 'CANCELLED';
  });

  const stats = [
    { label: "Today's", value: todayAppointments.length, icon: 'calendar-outline' as const, color: '#3b82f6' },
    { label: 'Upcoming', value: upcomingAppointments.length, icon: 'time-outline' as const, color: '#8b5cf6' },
    { label: 'Overdue', value: overdueAppointments.length, icon: 'alert-outline' as const, color: '#f97316' },
    { label: 'Completed', value: kpis?.completedApplications ?? 0, icon: 'checkmark-circle-outline' as const, color: '#10b981' },
    { label: 'Failed', value: kpis?.failedInspections ?? 0, icon: 'close-circle-outline' as const, color: '#ef4444' },
  ];

  const menuItems = [
    { label: 'My Assignments', icon: 'clipboard-outline' as const, screen: 'Assignments' },
    { label: 'Schedule', icon: 'calendar-outline' as const, screen: 'Schedule' },
    { label: 'Notifications', icon: 'notifications-outline' as const, screen: 'Notifications', badge: unreadData?.count },
    { label: 'Certificates', icon: 'ribbon-outline' as const, screen: 'Certificates' },
  ];

  const renderAppointmentCard = (item: any) => {
    const app = item.application;
    const instrument = app?.instrument;
    const typeName = instrument?.instrumentType?.name || 'Instrument';
    const serialNum = instrument?.serialNumber || '';
    const appNumber = app?.applicationNumber || '';
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.7}
        style={styles.appointmentCard}
        onPress={() => navigation.navigate('InspectionDetail', { appointmentId: item.id })}
      >
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentAppNumber}>{appNumber || 'No Application'}</Text>
          <Badge text={item.status} variant={getStatusVariant(item.status)} />
        </View>
        <Text style={styles.appointmentType}>{typeName}</Text>
        {serialNum ? <Text style={styles.appointmentDetail}>S/N: {serialNum}</Text> : null}
        <Text style={styles.appointmentTime}>{new Date(item.scheduledAt).toLocaleString()}</Text>
        {item.location ? <Text style={styles.appointmentLocation}>{item.location}</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{user?.name || 'Officer'}</Text>
          <Text style={styles.role}>Legal Metrology Officer</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <Ionicons name={stat.icon} size={22} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

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

      {todayAppointments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="today-outline" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Today's Inspections</Text>
          </View>
          {todayAppointments.slice(0, 5).map(renderAppointmentCard)}
        </View>
      )}

      {overdueAppointments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color="#f97316" />
            <Text style={[styles.sectionTitle, { color: '#f97316' }]}>Overdue</Text>
          </View>
          {overdueAppointments.slice(0, 5).map(renderAppointmentCard)}
        </View>
      )}

      {upcomingAppointments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#8b5cf6" />
            <Text style={[styles.sectionTitle, { color: '#8b5cf6' }]}>Upcoming</Text>
          </View>
          {upcomingAppointments.slice(0, 3).map(renderAppointmentCard)}
          {upcomingAppointments.length > 3 && (
            <TouchableOpacity activeOpacity={0.7} style={styles.seeAllBtn} onPress={() => navigation.navigate('Assignments')}>
              <Text style={styles.seeAllText}>See All ({upcomingAppointments.length})</Text>
              <Ionicons name="chevron-forward" size={16} color="#8b5cf6" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {todayAppointments.length === 0 && upcomingAppointments.length === 0 && overdueAppointments.length === 0 && (
        <View style={styles.emptySection}>
          <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Appointments</Text>
          <Text style={styles.emptyText}>Your assigned inspections will appear here.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  retryBtn: { marginTop: 12, backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, backgroundColor: '#1f2937' },
  greeting: { fontSize: 14, color: '#9ca3af' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  role: { fontSize: 14, color: '#d1d5db', marginTop: 2 },
  logoutBtn: { padding: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statCard: { width: '31%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  menuSection: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1f2937', marginLeft: 12 },
  badgeContainer: { backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  section: { padding: 16, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  appointmentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  appointmentAppNumber: { fontSize: 15, fontWeight: '700', color: '#1f2937', flex: 1 },
  appointmentType: { fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 4 },
  appointmentDetail: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  appointmentTime: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  appointmentLocation: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  emptySection: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 4, gap: 4 },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#8b5cf6' },
});
