import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import LoginPage from '@/modules/user/LoginPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BusinessDashboard from '@/modules/user/BusinessDashboard';
import LmoDashboard from '@/modules/lmo/LmoDashboard';
import GatcDashboard from '@/modules/gatc/GatcDashboard';
import AdminDashboard from '@/modules/admin/AdminDashboard';
import ApplicationsReview from '@/modules/admin/ApplicationsReview';
import AssignmentPanel from '@/modules/admin/AssignmentPanel';
import ScheduleAppointment from '@/modules/admin/ScheduleAppointment';
import RulesChecklists from '@/modules/admin/RulesChecklists';
import AssignedTests from '@/modules/gatc/AssignedTests';
import TestDetail from '@/modules/gatc/TestDetail';
import PublicVerify from '@/modules/public-verification/PublicVerify';

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'BUSINESS': return '/dashboard';
      case 'LMO': return '/dashboard';
      case 'GATC': return '/dashboard';
      case 'DISTRICT_OFFICER':
      case 'STATE_OFFICER':
      case 'SUPER_ADMIN': return '/dashboard';
      default: return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify/:token" element={<PublicVerify />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        {/* Index route - role-based dashboard */}
        <Route index element={
          user?.role === 'BUSINESS' ? <BusinessDashboard /> :
          user?.role === 'LMO' ? <LmoDashboard /> :
          user?.role === 'GATC' ? <GatcDashboard /> :
          <AdminDashboard />
        } />

        {/* Business routes */}
        <Route path="instruments" element={<BusinessDashboard />} />
        <Route path="applications" element={
          user?.role === 'SUPER_ADMIN' ? <ApplicationsReview /> : <BusinessDashboard />
        } />
        <Route path="certificates" element={<BusinessDashboard />} />
        <Route path="notifications" element={<BusinessDashboard />} />

        {/* LMO routes */}
        <Route path="assignments" element={
          user?.role === 'SUPER_ADMIN' ? <AssignmentPanel /> : <LmoDashboard />
        } />
        <Route path="schedule" element={
          user?.role === 'SUPER_ADMIN' ? <ScheduleAppointment /> : <LmoDashboard />
        } />

        {/* GATC routes */}
        <Route path="tests" element={<AssignedTests />} />
        <Route path="tests/:id" element={<TestDetail />} />
        <Route path="appointments" element={<GatcDashboard />} />
        <Route path="equipment" element={<GatcDashboard />} />

        {/* Admin routes */}
        <Route path="overview" element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminDashboard />} />
        <Route path="enforcement" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
        <Route path="roles" element={<AdminDashboard />} />
        <Route path="districts" element={<AdminDashboard />} />
        <Route path="jurisdictions" element={<AdminDashboard />} />
        <Route path="rules" element={<RulesChecklists />} />
        <Route path="audit" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
