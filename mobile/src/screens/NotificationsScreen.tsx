import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Notification } from '../types';

export default function NotificationsScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(res => res.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications?.filter((n: Notification) => !n.isRead) || [];
      await Promise.all(unread.map((n: Notification) => notificationApi.markAsRead(n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const handlePress = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.entityType && notification.entityId) {
      switch (notification.entityType) {
        case 'APPLICATION':
          navigation.navigate('ApplicationDetail', { applicationId: notification.entityId });
          break;
        case 'CERTIFICATE':
          navigation.navigate('CertificateDetail', { certificateId: notification.entityId });
          break;
        case 'INSTRUMENT':
          navigation.navigate('InstrumentDetail', { instrumentId: notification.entityId });
          break;
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const hasUnread = notifications?.some((n: Notification) => !n.isRead);

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      onRefresh={refetch}
      refreshing={false}
      style={styles.container}
      contentContainerStyle={notifications?.length === 0 ? styles.emptyContainer : styles.list}
      ListHeaderComponent={
        hasUnread ? (
          <TouchableOpacity activeOpacity={0.7} style={styles.markAllBtn} onPress={() => markAllReadMutation.mutate()}>
            <Ionicons name="checkmark-done-outline" size={18} color="#3b82f6" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        ) : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.card, !item.isRead && styles.cardUnread]}
          onPress={() => handlePress(item)}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={item.isRead ? 'notifications-outline' : 'notifications'}
              size={20}
              color={item.isRead ? '#9ca3af' : '#3b82f6'}
            />
          </View>
          <View style={styles.content}>
            <Text style={[styles.message, !item.isRead && styles.messageUnread]}>{item.message}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="notifications-outline"
          title="No Notifications"
          message="You're all caught up!"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, marginBottom: 12, gap: 6 },
  markAllText: { fontSize: 14, fontWeight: '500', color: '#3b82f6' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardUnread: { backgroundColor: '#eff6ff' },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  message: { fontSize: 14, color: '#6b7280' },
  messageUnread: { color: '#1f2937', fontWeight: '500' },
  time: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
});
