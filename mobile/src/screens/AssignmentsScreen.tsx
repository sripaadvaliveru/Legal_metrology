import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const MOCK_ASSIGNMENTS = [
  { id: '1', applicationId: 'APP-001', instrument: 'Weighing Scale', location: 'East Hyderabad', status: 'SCHEDULED' },
  { id: '2', applicationId: 'APP-002', instrument: 'Measuring Tape', location: 'West Hyderabad', status: 'PENDING' },
];

export default function AssignmentsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_ASSIGNMENTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Inspection', { appointmentId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.appId}>{item.applicationId}</Text>
              <View style={[styles.badge, item.status === 'SCHEDULED' ? styles.badgeGreen : styles.badgeYellow]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.instrument}>{item.instrument}</Text>
            <Text style={styles.location}>{item.location}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No assignments</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  appId: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeGreen: { backgroundColor: '#d1fae5' },
  badgeYellow: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#065f46' },
  instrument: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  location: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
