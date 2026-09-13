import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect, createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import BusinessDashboard from './src/screens/BusinessDashboard';
import InstrumentsScreen from './src/screens/InstrumentsScreen';
import RegisterInstrumentScreen from './src/screens/RegisterInstrumentScreen';
import InstrumentDetailScreen from './src/screens/InstrumentDetailScreen';
import ApplicationsScreen from './src/screens/ApplicationsScreen';
import SubmitApplicationScreen from './src/screens/SubmitApplicationScreen';
import ApplicationDetailScreen from './src/screens/ApplicationDetailScreen';
import CertificatesScreen from './src/screens/CertificatesScreen';
import CertificateDetailScreen from './src/screens/CertificateDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import LmoDashboard from './src/screens/LmoDashboard';
import AssignmentsScreen from './src/screens/AssignmentsScreen';
import InspectionDetailScreen from './src/screens/InspectionDetailScreen';
import RecordMeasurementsScreen from './src/screens/RecordMeasurementsScreen';
import SubmitInspectionScreen from './src/screens/SubmitInspectionScreen';
import { authApi, setAuthLogoutHandler } from './src/services/api';
import type { User } from './src/types';

const queryClient = new QueryClient();

type RootStackParamList = {
  Login: undefined;
  BusinessHome: undefined;
  Instruments: undefined;
  RegisterInstrument: undefined;
  InstrumentDetail: { instrumentId: string };
  Applications: undefined;
  SubmitApplication: { instrumentId?: string } | undefined;
  ApplicationDetail: { applicationId: string };
  Certificates: undefined;
  CertificateDetail: { certificateId: string };
  Notifications: undefined;
  LmoHome: undefined;
  Assignments: undefined;
  InspectionDetail: { appointmentId: string };
  RecordMeasurements: { inspectionId: string };
  SubmitInspection: { inspectionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthLogoutHandler(() => {
      setToken(null);
      setUser(null);
    });
    return () => setAuthLogoutHandler(null);
  }, []);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isBusiness = user?.role === 'BUSINESS';

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1f2937' }, headerTintColor: '#fff' }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          ) : isBusiness ? (
            <>
              <Stack.Screen name="BusinessHome" component={BusinessDashboard} options={{ title: 'Dashboard' }} />
              <Stack.Screen name="Instruments" component={InstrumentsScreen} options={{ title: 'My Instruments' }} />
              <Stack.Screen name="RegisterInstrument" component={RegisterInstrumentScreen} options={{ title: 'Register Instrument' }} />
              <Stack.Screen name="InstrumentDetail" component={InstrumentDetailScreen} options={{ title: 'Instrument' }} />
              <Stack.Screen name="Applications" component={ApplicationsScreen} options={{ title: 'My Applications' }} />
              <Stack.Screen name="SubmitApplication" component={SubmitApplicationScreen} options={{ title: 'Submit Application' }} />
              <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: 'Application' }} />
              <Stack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'My Certificates' }} />
              <Stack.Screen name="CertificateDetail" component={CertificateDetailScreen} options={{ title: 'Certificate' }} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
            </>
          ) : (
            <>
              <Stack.Screen name="LmoHome" component={LmoDashboard} options={{ title: 'Dashboard' }} />
              <Stack.Screen name="Assignments" component={AssignmentsScreen} options={{ title: 'My Assignments' }} />
              <Stack.Screen name="InspectionDetail" component={InspectionDetailScreen} options={{ title: 'Inspection' }} />
              <Stack.Screen name="RecordMeasurements" component={RecordMeasurementsScreen} options={{ title: 'Record Measurements' }} />
              <Stack.Screen name="SubmitInspection" component={SubmitInspectionScreen} options={{ title: 'Submit Inspection' }} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
              <Stack.Screen name="Certificates" component={CertificatesScreen} options={{ title: 'Certificates' }} />
              <Stack.Screen name="CertificateDetail" component={CertificateDetailScreen} options={{ title: 'Certificate' }} />
            </>
          )}
        </Stack.Navigator>
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
