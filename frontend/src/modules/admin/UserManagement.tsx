import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, jurisdictionApi } from '@/services/api';
import { UserPlus, Search, Shield, ShieldOff, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Role } from '@/types';

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: 'LMO', label: 'LMO', color: 'bg-green-100 text-green-800' },
  { value: 'GATC', label: 'GATC', color: 'bg-blue-100 text-blue-800' },
  { value: 'DISTRICT_OFFICER', label: 'District Officer', color: 'bg-purple-100 text-purple-800' },
  { value: 'STATE_OFFICER', label: 'State Officer', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-red-100 text-red-800' },
];

const roleColor = (role: string) => ROLES.find(r => r.value === role)?.color || 'bg-gray-100 text-gray-800';
const roleLabel = (role: string) => ROLES.find(r => r.value === role)?.label || role;

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'LMO' as Role, phone: '', jurisdictionId: '' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', filterRole],
    // includeInactive is required here: without it the API hides deactivated users
    // entirely, making them impossible to reactivate from this screen.
    queryFn: () => userApi.list(filterRole || undefined, { includeInactive: true }).then(res => res.data),
  });

  // Jurisdictions must be picked, not typed: a hand-typed value can never match
  // jurisdictions.id, which silently broke jurisdiction name display and
  // auto-assignment matching for that officer.
  const { data: jurisdictions = [] } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: () => jurisdictionApi.list().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => userApi.create(data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'LMO', phone: '', jurisdictionId: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      toast.success('User permanently deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      // The backend returns 409 with a readable reason when the account still owns
      // applications/assignments/inspections, and 400 for self-delete / last-admin.
      toast.error(err.response?.data?.error || 'Failed to delete user');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => userApi.update(id, { isActive }),
    onSuccess: (_data, vars) => {
      toast.success(vars.isActive ? 'User activated' : 'User deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update user status');
    },
  });

  const filtered = users.filter(u => {
    const active = u.isActive !== false;
    if (statusFilter === 'active' && !active) return false;
    if (statusFilter === 'inactive' && active) return false;
    return (
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const inactiveCount = users.filter(u => u.isActive === false).length;

  const STATUS_TABS = [
    { value: 'all', label: `All (${users.length})` },
    { value: 'active', label: `Active (${users.length - inactiveCount})` },
    { value: 'inactive', label: `Inactive (${inactiveCount})` },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create, activate and deactivate officer accounts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => setFilterRole(filterRole === r.value ? '' : r.value)}
            className={`p-3 rounded-lg border text-left transition-all ${
              filterRole === r.value ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="text-xs text-gray-500">{r.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{roleCounts[r.value] || 0}</p>
          </button>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden self-start">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* User table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {statusFilter === 'inactive'
                    ? 'No deactivated users — everyone is active'
                    : 'No users found'}
                </td>
              </tr>
            ) : filtered.map(u => {
              const active = u.isActive !== false;
              return (
              <tr key={u.id} className={`hover:bg-gray-50 ${active ? '' : 'bg-red-50/50'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      active ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColor(u.role)}`}>
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${active ? 'text-green-700' : 'text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        const nextActive = !active;
                        if (confirm(`${nextActive ? 'Reactivate' : 'Deactivate'} ${u.name}?`)) {
                          toggleActiveMutation.mutate({ id: u.id, isActive: nextActive });
                        }
                      }}
                      disabled={toggleActiveMutation.isPending}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
                      title={active ? 'Deactivate' : 'Reactivate'}
                    >
                      {active ? (
                        <ShieldOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Shield className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const typed = prompt(
                          `Permanently delete ${u.email}?\n\n` +
                          'This removes the account for good and cannot be undone. ' +
                          'Accounts that still own applications, assignments or inspections are blocked.\n\n' +
                          'Type the email address to confirm:'
                        );
                        if (typed === null) return;
                        if (typed.trim().toLowerCase() !== (u.email || '').toLowerCase()) {
                          toast.error('Email did not match — deletion cancelled');
                          return;
                        }
                        deleteMutation.mutate(u.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
                      title="Permanently delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create User</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900"
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900"
                  placeholder="officer@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jurisdiction</label>
                <select
                  value={form.jurisdictionId}
                  onChange={e => setForm({ ...form, jurisdictionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">None</option>
                  {jurisdictions.map(j => (
                    <option key={j.id} value={j.id}>{j.name} ({j.id})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!form.name || !form.email || !form.password) {
                    toast.error('Please fill in all required fields');
                    return;
                  }
                  createMutation.mutate(form);
                }}
                disabled={createMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
