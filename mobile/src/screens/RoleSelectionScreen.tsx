import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  onSelect: (role: string) => void;
}

export default function RoleSelectionScreen({ onSelect }: Props) {
  const handleSelect = async (role: string) => {
    await AsyncStorage.setItem('selectedRole', role);
    onSelect(role);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={48} color="#1f2937" />
        <Text style={styles.title}>Legal Metrology</Text>
        <Text style={styles.subtitle}>Verification System</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.question}>How will you use the application?</Text>
        <Text style={styles.hint}>Select your role to continue</Text>
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.optionCard}
          onPress={() => handleSelect('BUSINESS')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="business-outline" size={32} color="#3b82f6" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Business / Instrument Owner</Text>
            <Text style={styles.optionDesc}>
              Register instruments, apply for verification, track applications, and manage certificates.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.optionCard}
          onPress={() => handleSelect('LMO')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="clipboard-outline" size={32} color="#10b981" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Legal Metrology Officer</Text>
            <Text style={styles.optionDesc}>
              View assigned inspections, record measurements, capture evidence, and submit verification results.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Ministry of Consumer Affairs, Food & Public Distribution
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  options: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 'auto',
    paddingTop: 24,
  },
});
