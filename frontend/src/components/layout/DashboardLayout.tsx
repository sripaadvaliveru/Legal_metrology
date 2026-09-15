import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Package, FileText, ClipboardCheck,
  Settings, Bell, LogOut, Menu, X, QrCode, Clock, Users, UserCheck
} from 'lucide-react';
import { useState } from 'react';

const roleMenus: Record<string, { label: string; icon: any; path: string }[]> = {
  BUSINESS: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Instruments', icon: Package, path: '/dashboard/instruments' },
    { label: 'Applications', icon: FileText, path: '/dashboard/applications' },
    { label: 'Certificates', icon: QrCode, path: '/dashboard/certificates' },
    { label: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
  ],
  LMO: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Assignments', icon: ClipboardCheck, path: '/dashboard/assignments' },
    { label: 'Schedule', icon: FileText, path: '/dashboard/schedule' },
    { label: 'Instruments', icon: Package, path: '/dashboard/instruments' },
    { label: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
  ],
  GATC: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Assigned Tests', icon: ClipboardCheck, path: '/dashboard/tests' },
    { label: 'Appointments', icon: FileText, path: '/dashboard/appointments' },
    { label: 'Equipment', icon: Settings, path: '/dashboard/equipment' },
    { label: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
  ],
  DISTRICT_OFFICER: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Coming Soon', icon: Clock, path: '/dashboard' },
  ],
  STATE_OFFICER: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Coming Soon', icon: Clock, path: '/dashboard' },
  ],
  SUPER_ADMIN: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Review Applications', icon: FileText, path: '/dashboard/applications' },
    { label: 'Assign Officers', icon: UserCheck, path: '/dashboard/assignments' },
    { label: 'Schedule Inspections', icon: ClipboardCheck, path: '/dashboard/schedule' },
    { label: 'Rules & Checklists', icon: Settings, path: '/dashboard/rules' },
    { label: 'Users', icon: Users, path: '/dashboard/users' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = roleMenus[user?.role || 'BUSINESS'] || [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-lg font-bold text-gray-900">Legal Metrology</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-gray-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center h-16 px-6 bg-white border-b lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-lg font-bold">Legal Metrology</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
