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
        <Route path="instruments" element={
          <ProtectedRoute allowedRoles={['BUSINESS']}><BusinessDashboard /></ProtectedRoute>
        } />
        <Route path="applications" element={
          user?.role === 'SUPER_ADMIN'
            ? <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><ApplicationsReview /></ProtectedRoute>
            : <ProtectedRoute allowedRoles={['BUSINESS']}><BusinessDashboard /></ProtectedRoute>
        } />
        <Route path="certificates" element={
          <ProtectedRoute allowedRoles={['BUSINESS']}><BusinessDashboard /></ProtectedRoute>
        } />
        <Route path="notifications" element={
          <ProtectedRoute allowedRoles={['BUSINESS', 'LMO', 'GATC', 'SUPER_ADMIN']}><BusinessDashboard /></ProtectedRoute>
        } />

        {/* LMO routes */}
        <Route path="assignments" element={
          user?.role === 'SUPER_ADMIN'
            ? <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AssignmentPanel /></ProtectedRoute>
            : <ProtectedRoute allowedRoles={['LMO', 'GATC']}><LmoDashboard /></ProtectedRoute>
        } />
        <Route path="schedule" element={
          user?.role === 'SUPER_ADMIN'
            ? <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><ScheduleAppointment /></ProtectedRoute>
            : <ProtectedRoute allowedRoles={['LMO']}><LmoDashboard /></ProtectedRoute>
        } />

        {/* GATC routes */}
        <Route path="tests" element={
          <ProtectedRoute allowedRoles={['GATC']}><AssignedTests /></ProtectedRoute>
        } />
        <Route path="tests/:id" element={
          <ProtectedRoute allowedRoles={['GATC']}><TestDetail /></ProtectedRoute>
        } />
        <Route path="appointments" element={
          <ProtectedRoute allowedRoles={['GATC']}><GatcDashboard /></ProtectedRoute>
        } />
        <Route path="equipment" element={
          <ProtectedRoute allowedRoles={['GATC']}><GatcDashboard /></ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="overview" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="analytics" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="enforcement" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="roles" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="districts" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="jurisdictions" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="rules" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><RulesChecklists /></ProtectedRoute>
        } />
        <Route path="audit" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
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
