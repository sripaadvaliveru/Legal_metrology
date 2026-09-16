import { Buffer } from 'buffer';
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState, useEffect, createContext, useContext } from 'react';
import { ActivityIndicator, View, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BusinessDashboard from './src/screens/BusinessDashboard';
import InstrumentsScreen from './src/screens/InstrumentsScreen';
import RegisterInstrumentScreen from './src/screens/RegisterInstrumentScreen';
import InstrumentDetailScreen from './src/screens/InstrumentDetailScreen';
import VerificationHistoryScreen from './src/screens/VerificationHistoryScreen';
import ApplicationsScreen from './src/screens/ApplicationsScreen';
import SubmitApplicationScreen from './src/screens/SubmitApplicationScreen';
import ApplicationDetailScreen from './src/screens/ApplicationDetailScreen';
import CertificatesScreen from './src/screens/CertificatesScreen';
import CertificateDetailScreen from './src/screens/CertificateDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';
import LmoDashboard from './src/screens/LmoDashboard';
import ScheduleScreen from './src/screens/ScheduleScreen';
import AssignmentsScreen from './src/screens/AssignmentsScreen';
import InspectionDetailScreen from './src/screens/InspectionDetailScreen';
import InspectionReviewScreen from './src/screens/InspectionReviewScreen';
import RecordMeasurementsScreen from './src/screens/RecordMeasurementsScreen';
import SubmitInspectionScreen from './src/screens/SubmitInspectionScreen';
import LmoHistoryScreen from './src/screens/LmoHistoryScreen';
import LmoProfileScreen from './src/screens/LmoProfileScreen';
import { authApi, setAuthLogoutHandler } from './src/services/api';
import type { User } from './src/types';
import OfflineBanner from './src/components/OfflineBanner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const AuthStack = createNativeStackNavigator();
const BusinessStack = createNativeStackNavigator();
const LmoStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const LmoTab = createBottomTabNavigator();

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Business Bottom Tabs ───

function BusinessTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1f2937' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#1f2937',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: Math.max(insets.bottom, 4), height: 56 + Math.max(insets.bottom - 4, 0) },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={BusinessDashboard}
        options={{
          title: 'Home',
          headerTitle: 'Dashboard',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="InstrumentsTab"
        component={InstrumentsScreen}
        options={{
          title: 'Instruments',
          headerTitle: 'My Instruments',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="hardware-chip-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ApplicationsTab"
        component={ApplicationsScreen}
        options={{
          title: 'Applications',
          headerTitle: 'My Applications',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── LMO Bottom Tabs ───

function LmoTabs() {
  const insets = useSafeAreaInsets();
  return (
    <LmoTab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1f2937' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: Math.max(insets.bottom, 4), height: 56 + Math.max(insets.bottom - 4, 0) },
      }}
    >
      <LmoTab.Screen
        name="DashboardTab"
        component={LmoDashboard}
        options={{
          title: 'Home',
          headerTitle: 'Dashboard',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <LmoTab.Screen
        name="AssignmentsTab"
        component={AssignmentsScreen}
        options={{
          title: 'Assignments',
          headerTitle: 'My Assignments',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="clipboard-outline" size={size} color={color} />,
        }}
      />
      <LmoTab.Screen
        name="ScheduleTab"
        component={ScheduleScreen}
        options={{
          title: 'Schedule',
          headerTitle: 'My Schedule',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <LmoTab.Screen
        name="HistoryTab"
        component={LmoHistoryScreen}
        options={{
          title: 'History',
          headerTitle: 'Inspection History',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <LmoTab.Screen
        name="ProfileTab"
        component={LmoProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </LmoTab.Navigator>
  );
}

// ─── Business Stack Navigator ───

function BusinessNavigator() {
  return (
    <BusinessStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1f2937' }, headerTintColor: '#fff' }}>
      <BusinessStack.Screen name="BusinessHome" component={BusinessTabs} options={{ headerShown: false }} />
      <BusinessStack.Screen name="RegisterInstrument" component={RegisterInstrumentScreen} options={{ title: 'Register Instrument' }} />
      <BusinessStack.Screen name="InstrumentDetail" component={InstrumentDetailScreen} options={{ title: 'Instrument' }} />
      <BusinessStack.Screen name="VerificationHistory" component={VerificationHistoryScreen} options={{ title: 'Verification History' }} />
      <BusinessStack.Screen name="SubmitApplication" component={SubmitApplicationScreen} options={{ title: 'Submit Application' }} />
      <BusinessStack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: 'Application' }} />
      <BusinessStack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'My Certificates' }} />
      <BusinessStack.Screen name="CertificateDetail" component={CertificateDetailScreen} options={{ title: 'Certificate' }} />
      <BusinessStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <BusinessStack.Screen name="Appointments" component={AppointmentScreen} options={{ title: 'Appointments' }} />
    </BusinessStack.Navigator>
  );
}

// ─── LMO Stack Navigator (for screens pushed on top of tabs) ───

function LmoNavigator() {
  return (
    <LmoStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1f2937' }, headerTintColor: '#fff' }}>
      <LmoStack.Screen name="LmoTabs" component={LmoTabs} options={{ headerShown: false }} />
      <LmoStack.Screen name="InspectionDetail" component={InspectionDetailScreen} options={{ title: 'Inspection' }} />
      <LmoStack.Screen name="RecordMeasurements" component={RecordMeasurementsScreen} options={{ title: 'Record Measurements' }} />
      <LmoStack.Screen name="InspectionReview" component={InspectionReviewScreen} options={{ title: 'Review Inspection' }} />
      <LmoStack.Screen name="SubmitInspection" component={SubmitInspectionScreen} options={{ title: 'Submit Inspection' }} />
      <LmoStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <LmoStack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: 'Application' }} />
      <LmoStack.Screen name="InstrumentDetail" component={InstrumentDetailScreen} options={{ title: 'Instrument' }} />
      <LmoStack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'Certificates' }} />
      <LmoStack.Screen name="CertificateDetail" component={CertificateDetailScreen} options={{ title: 'Certificate' }} />
    </LmoStack.Navigator>
  );
}

// ─── Auth Navigator (role-specific login) ───

function AuthNavigator({ selectedRole }: { selectedRole: string }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} initialParams={{ expectedRole: selectedRole }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#1f2937' }, headerTintColor: '#fff', title: 'Register' }} />
    </AuthStack.Navigator>
  );
}

// ─── Main App Content ───

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    setAuthLogoutHandler(() => {
      setToken(null);
      setUser(null);
    });
    const handleAppActive = (state: AppStateStatus) => {
      if (state === 'active') {
        import('./src/services/syncService').then(({ processSyncQueue }) => {
          processSyncQueue().catch(() => {});
        });
      }
    };
    const subscription = AppState.addEventListener('change', handleAppActive);
    return () => {
      setAuthLogoutHandler(null);
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('selectedRole');
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedRole) {
          setSelectedRole(storedRole);
        }
        setRoleChecked(true);

        if (storedToken && storedUser) {
          setToken(storedToken);
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user');
          }
        }
      } catch {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  };

  const handleRoleSelect = async (role: string) => {
    setSelectedRole(role);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isLmo = user?.role === 'LMO' || user?.role === 'GATC' || user?.role === 'DISTRICT_OFFICER' || user?.role === 'STATE_OFFICER' || user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <OfflineBanner />
      <NavigationContainer>
        {!user ? (
          !roleChecked ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          ) : !selectedRole ? (
            <RoleSelectionScreen onSelect={handleRoleSelect} />
          ) : (
            <AuthNavigator selectedRole={selectedRole} />
          )
        ) : user.role === 'BUSINESS' ? (
          <BusinessNavigator />
        ) : isLmo ? (
          <LmoNavigator />
        ) : (
          <AuthNavigator selectedRole={selectedRole || 'BUSINESS'} />
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
