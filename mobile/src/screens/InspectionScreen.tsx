import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

export default function InspectionScreen({ route, navigation }: any) {
  const { appointmentId } = route.params;
  const [serialNumber, setSerialNumber] = useState('');
  const [measurement, setMeasurement] = useState('');
  const [remarks, setRemarks] = useState('');
  const [result, setResult] = useState<'PASS' | 'FAIL' | null>(null);

  const handleSubmit = () => {
    if (!result) {
      Alert.alert('Error', 'Please select PASS or FAIL');
      return;
    }
    Alert.alert('Inspection Submitted', `Result: ${result}`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspection Details</Text>
        <Text style={styles.label}>Appointment ID: {appointmentId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrument Verification</Text>
        <TextInput
          style={styles.input}
          placeholder="Serial Number"
          value={serialNumber}
          onChangeText={setSerialNumber}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Measurements</Text>
        <TextInput
          style={styles.input}
          placeholder="Measurement Reading"
          value={measurement}
          onChangeText={setMeasurement}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Result</Text>
        <View style={styles.resultRow}>
          <TouchableOpacity
            style={[styles.resultBtn, result === 'PASS' && styles.resultBtnActive]}
            onPress={() => setResult('PASS')}
          >
            <Text style={[styles.resultBtnText, result === 'PASS' && styles.resultBtnTextActive]}>PASS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resultBtn, styles.resultBtnFail, result === 'FAIL' && styles.resultBtnFailActive]}
            onPress={() => setResult('FAIL')}
          >
            <Text style={[styles.resultBtnText, result === 'FAIL' && styles.resultBtnTextActive]}>FAIL</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remarks</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional observations..."
          value={remarks}
          onChangeText={setRemarks}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Submit Inspection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  label: { fontSize: 14, color: '#6b7280' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8 },
  textArea: { height: 100, textAlignVertical: 'top' },
  resultRow: { flexDirection: 'row', gap: 12 },
  resultBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#10b981', alignItems: 'center' },
  resultBtnActive: { backgroundColor: '#10b981' },
  resultBtnFail: { borderColor: '#ef4444' },
  resultBtnFailActive: { backgroundColor: '#ef4444' },
  resultBtnText: { fontSize: 16, fontWeight: '600', color: '#10b981' },
  resultBtnTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#1f2937', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
