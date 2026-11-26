import { ShieldCheck } from 'lucide-react';

const roles = [
  { role: 'BUSINESS', dashboard: 'Business', access: 'Register instruments, apply for verification, track status, download certificates' },
  { role: 'LMO', dashboard: 'LMO + Mobile', access: 'Field inspections, measurements, evidence capture, PASS/FAIL recording' },
  { role: 'GATC', dashboard: 'GATC', access: 'Lab tests, equipment management, test result submission' },
  { role: 'DISTRICT_OFFICER', dashboard: 'Admin', access: 'District-level oversight, enforcement and workload monitoring' },
  { role: 'STATE_OFFICER', dashboard: 'Admin', access: 'Statewide analytics, compliance and district comparison' },
  { role: 'SUPER_ADMIN', dashboard: 'Admin', access: 'Full system administration, users, rules and audit logs' },
  { role: 'PUBLIC', dashboard: 'Verification portal', access: 'Scan QR and check certificate authenticity (no login)' },
];

export default function RolesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roles &amp; Permissions</h1>
        <p className="text-sm text-gray-500">
          Role-based access control with jurisdiction scoping. Permissions are enforced by the backend.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Dashboard</th>
              <th className="px-4 py-3">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles.map(item => (
              <tr key={item.role} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  {item.role.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.dashboard}</td>
                <td className="px-4 py-3 text-gray-600">{item.access}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
