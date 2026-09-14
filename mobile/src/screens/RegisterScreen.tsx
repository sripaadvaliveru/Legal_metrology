import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const ownerNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const districtRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const pincodeRef = useRef<TextInput>(null);

  const registerMutation = useMutation({
    mutationFn: (data: any) => authApi.register(data),
    onSuccess: () => {
      Alert.alert('Success', 'Account created! You can now login.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Registration Failed', err.response?.data?.error || err.response?.data?.message || 'Failed to register');
    },
  });

  const handleRegister = () => {
    Keyboard.dismiss();
    if (!businessName || !ownerName || !email || !password || !mobile) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    registerMutation.mutate({
      name: ownerName,
      email,
      password,
      role: 'BUSINESS',
      businessName,
      mobile,
      address: address || undefined,
      state: state || undefined,
      district: district || undefined,
      city: city || undefined,
      pincode: pincode || undefined,
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register your business</Text>

            <Text style={styles.label}>Business Name *</Text>
            <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="e.g. ABC Traders" returnKeyType="next" onSubmitEditing={() => ownerNameRef.current?.focus()} />

            <Text style={styles.label}>Owner / Authorized Person *</Text>
            <TextInput ref={ownerNameRef} style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="e.g. John Doe" autoComplete="name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />

            <Text style={styles.label}>Email *</Text>
            <TextInput ref={emailRef} style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" onSubmitEditing={() => mobileRef.current?.focus()} textContentType="emailAddress" />

            <Text style={styles.label}>Mobile *</Text>
            <TextInput ref={mobileRef} style={styles.input} value={mobile} onChangeText={setMobile} placeholder="e.g. 9876543210" keyboardType="phone-pad" maxLength={10} returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />

            <Text style={styles.label}>Password *</Text>
            <TextInput ref={passwordRef} style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry autoComplete="password" returnKeyType="next" onSubmitEditing={() => addressRef.current?.focus()} textContentType="newPassword" />

            <Text style={styles.label}>Address</Text>
            <TextInput ref={addressRef} style={styles.input} value={address} onChangeText={setAddress} placeholder="Full address" returnKeyType="next" onSubmitEditing={() => stateRef.current?.focus()} />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>State</Text>
                <TextInput ref={stateRef} style={styles.input} value={state} onChangeText={setState} placeholder="e.g. Telangana" returnKeyType="next" onSubmitEditing={() => districtRef.current?.focus()} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>District</Text>
                <TextInput ref={districtRef} style={styles.input} value={district} onChangeText={setDistrict} placeholder="e.g. Hyderabad" returnKeyType="next" onSubmitEditing={() => cityRef.current?.focus()} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>City</Text>
                <TextInput ref={cityRef} style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Hyderabad" returnKeyType="next" onSubmitEditing={() => pincodeRef.current?.focus()} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput ref={pincodeRef} style={styles.input} value={pincode} onChangeText={setPincode} placeholder="e.g. 500001" keyboardType="numeric" maxLength={6} returnKeyType="done" onSubmitEditing={handleRegister} />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.button, registerMutation.isPending && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.linkBtn}>
              <Text style={styles.linkText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#1f2937' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6b7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 4, backgroundColor: '#f9fafb', color: '#1f2937' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  button: { backgroundColor: '#1f2937', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#3b82f6', fontWeight: '500' },
});
