import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#d1fae5', text: '#065f46' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  error: { bg: '#fee2e2', text: '#991b1b' },
  info: { bg: '#dbeafe', text: '#1e40af' },
  default: { bg: '#f3f4f6', text: '#374151' },
};

export function getStatusVariant(status: string): BadgeVariant {
  const s = status.toUpperCase();
  if (['VERIFIED', 'VALID', 'PASS', 'PASSED', 'COMPLETED', 'APPROVED'].includes(s)) return 'success';
  if (['EXPIRED', 'REVOKED', 'SUSPENDED', 'FAIL', 'FAILED', 'REJECTED', 'CANCELLED'].includes(s)) return 'error';
  if (['PENDING', 'DRAFT', 'SUBMITTED', 'SCHEDULED', 'REGISTERED'].includes(s)) return 'warning';
  if (['UNDER_REVIEW', 'ASSIGNED', 'UNDER_INSPECTION', 'INSPECTION_PENDING', 'REINSPECTION_REQUIRED'].includes(s)) return 'info';
  return 'default';
}

export default function Badge({ text, variant = 'default' }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{text.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
