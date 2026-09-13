import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../App';
import { instrumentApi, businessApi, instrumentTypeApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RegisterInstrumentScreen({ navigation }: any) {
  const { user } = useAuth();
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [capacityRange, setCapacityRange] = useState('');
  const [yearOfManufacture, setYearOfManufacture] = useState('');
  const [usage, setUsage] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedEstablishment, setSelectedEstablishment] = useState('');

  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ['business-me'],
    queryFn: () => businessApi.getMyBusiness().then(res => res.data),
  });

  const { data: instrumentTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['instrument-types'],
    queryFn: () => instrumentTypeApi.list().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => instrumentApi.create(data),
    onSuccess: () => {
      Alert.alert('Success', 'Instrument registered successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to register instrument');
    },
  });

  const handleSubmit = () => {
    if (!selectedType || !manufacturer || !model || !serialNumber || !selectedEstablishment) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    createMutation.mutate({
      establishmentId: selectedEstablishment,
      type: selectedType,
      manufacturer,
      model,
      serialNumber,
      capacityRange: capacityRange || undefined,
      yearOfManufacture: yearOfManufacture ? parseInt(yearOfManufacture) : undefined,
      usage: usage || undefined,
    });
  };

  if (loadingBusiness || loadingTypes) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrument Type *</Text>
        <View style={styles.chipContainer}>
          {instrumentTypes?.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.chip, selectedType === type.id && styles.chipActive]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text style={[styles.chipText, selectedType === type.id && styles.chipTextActive]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Establishment *</Text>
        <View style={styles.chipContainer}>
          {business?.establishments?.map((est) => (
            <TouchableOpacity
              key={est.id}
              style={[styles.chip, selectedEstablishment === est.id && styles.chipActive]}
              onPress={() => setSelectedEstablishment(est.id)}
            >
              <Text style={[styles.chipText, selectedEstablishment === est.id && styles.chipTextActive]}>
                {est.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manufacturer *</Text>
        <TextInput style={styles.input} value={manufacturer} onChangeText={setManufacturer} placeholder="e.g. Avery India" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model *</Text>
        <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="e.g. WS-500" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serial Number *</Text>
        <TextInput style={styles.input} value={serialNumber} onChangeText={setSerialNumber} placeholder="e.g. SN-12345" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Capacity Range</Text>
        <TextInput style={styles.input} value={capacityRange} onChangeText={setCapacityRange} placeholder="e.g. 0-500kg" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Year of Manufacture</Text>
        <TextInput style={styles.input} value={yearOfManufacture} onChangeText={setYearOfManufacture} placeholder="e.g. 2024" keyboardType="numeric" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage</Text>
        <TextInput style={styles.input} value={usage} onChangeText={setUsage} placeholder="e.g. Commercial weighing" />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={createMutation.isPending}
      >
        <Text style={styles.submitBtnText}>
          {createMutation.isPending ? 'Registering...' : 'Register Instrument'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  chipActive: { borderColor: '#1f2937', backgroundColor: '#1f2937' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9fafb' },
  submitBtn: { backgroundColor: '#1f2937', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
