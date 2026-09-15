import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
}

export default function ErrorState({ title, message, onRetry, isNetworkError }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons
        name={isNetworkError ? "cloud-offline-outline" : "alert-circle-outline"}
        size={56}
        color={isNetworkError ? "#f59e0b" : "#ef4444"}
      />
      <Text style={styles.title}>
        {title || (isNetworkError ? 'Server Unreachable' : 'Something went wrong')}
      </Text>
      <Text style={styles.message}>
        {message || (isNetworkError
          ? 'Unable to connect to the server. Please check your network connection and try again.'
          : 'An unexpected error occurred. Please try again.')}
      </Text>
      {onRetry && (
        <TouchableOpacity activeOpacity={0.7} style={styles.retryBtn} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function isNetworkError(error: any): boolean {
  if (!error) return false;
  const msg = error.message || '';
  return (
    msg.includes('Network Error') ||
    msg.includes('timeout') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ERR_NETWORK') ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED'
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginTop: 16, textAlign: 'center' },
  message: { fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, marginTop: 20 },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
