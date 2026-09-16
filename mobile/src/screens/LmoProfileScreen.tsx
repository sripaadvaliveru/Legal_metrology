import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../App';

export default function LmoProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleChangeRole = () => {
    Alert.alert('Change Account Type', 'This will log you out and return to role selection.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Change', onPress: async () => {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('selectedRole');
        logout();
      }},
    ]);
  };

  const menuItems = [
    { label: 'My Inspections', icon: 'clipboard-outline', screen: 'History' },
    { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
    { label: 'Change Account Type', icon: 'swap-horizontal-outline', action: handleChangeRole },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'O'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Officer'}</Text>
        <Text style={styles.role}>Legal Metrology Officer</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => item.action ? item.action() : navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon as any} size={22} color="#1f2937" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity activeOpacity={0.7} style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 12 },
  role: { fontSize: 14, color: '#10b981', fontWeight: '500', marginTop: 4 },
  email: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  menu: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1f2937', marginLeft: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { fontSize: 16, fontWeight: '500', color: '#ef4444' },
});
