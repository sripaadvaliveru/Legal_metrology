import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { inspectionApi } from '../services/api';

export default function SubmitInspectionScreen({ route, navigation }: any) {
  const { inspectionId } = route.params ?? {};
  const [result, setResult] = useState<'PASS' | 'FAIL' | null>(null);
  const [remarks, setRemarks] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      await inspectionApi.submit(inspectionId, result!, remarks || undefined);
    },
    onSuccess: () => {
      const msg = result === 'PASS'
        ? 'Inspection passed! Certificate has been generated.'
        : 'Inspection submitted as failed.';
      Alert.alert('Submitted', msg, [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit inspection');
    },
  });

  const handleSubmit = () => {
    if (!result) {
      Alert.alert('Error', 'Please select PASS or FAIL');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspection Result *</Text>
        <View style={styles.resultRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.resultBtn, result === 'PASS' && styles.resultBtnPassActive]}
            onPress={() => setResult('PASS')}
          >
            <Text style={[styles.resultBtnText, result === 'PASS' && styles.resultBtnTextActive]}>
              PASS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.resultBtn, result === 'FAIL' && styles.resultBtnFailActive]}
            onPress={() => setResult('FAIL')}
          >
            <Text style={[styles.resultBtnText, result === 'FAIL' && styles.resultBtnTextActive]}>
              FAIL
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remarks</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add any observations or notes..."
          value={remarks}
          onChangeText={setRemarks}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {result === 'PASS' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            A certificate will be automatically generated upon submission.
          </Text>
        </View>
      )}

      {result === 'FAIL' && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={18} color="#92400e" />
          <Text style={styles.warningText}>
            Marking as FAIL will set the application status to Re-inspection Required. The business will need to apply for re-verification.
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.submitBtn, (!result || submitMutation.isPending) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!result || submitMutation.isPending}
      >
        <Text style={styles.submitBtnText}>
          {submitMutation.isPending ? 'Submitting...' : 'Submit Inspection'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  resultRow: { flexDirection: 'row', gap: 12 },
  resultBtn: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 2, borderColor: '#10b981', alignItems: 'center' },
  resultBtnPassActive: { backgroundColor: '#10b981' },
  resultBtnFailActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  resultBtnText: { fontSize: 16, fontWeight: '600', color: '#10b981' },
  resultBtnTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9fafb' },
  textArea: { height: 100 },
  infoBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 12, marginBottom: 12 },
  infoText: { fontSize: 14, color: '#1e40af' },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginBottom: 12 },
  warningText: { fontSize: 13, color: '#92400e', flex: 1 },
  submitBtn: { backgroundColor: '#1f2937', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
