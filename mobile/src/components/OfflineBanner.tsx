import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { processSyncQueue } from '../services/syncService';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<{ synced: number; failed: number } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (isOnline && !syncing) {
      setSyncing(true);
      processSyncQueue()
        .then(result => {
          if (result.synced > 0) setLastSync(result);
        })
        .finally(() => setSyncing(false));
    }
  }, [isOnline]);

  if (Platform.OS === 'web') return null;
  if (isOnline && !syncing && !lastSync) return null;

  return (
    <View style={[styles.banner, isOnline ? styles.online : styles.offline]}>
      <Ionicons
        name={isOnline ? (syncing ? "sync-outline" : "cloud-done-outline") : "cloud-offline-outline"}
        size={14}
        color="#fff"
      />
      <Text style={styles.text}>
        {!isOnline ? 'You are offline. Changes will sync when connected.' :
         syncing ? 'Syncing pending changes...' :
         lastSync ? `Synced ${lastSync.synced} change${lastSync.synced > 1 ? 's' : ''}${lastSync.failed > 0 ? `, ${lastSync.failed} failed` : ''}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12 },
  offline: { backgroundColor: '#f97316' },
  online: { backgroundColor: '#10b981' },
  text: { color: '#fff', fontSize: 12, fontWeight: '500' },
});
