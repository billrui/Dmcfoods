import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff, UserX } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useToast } from '../../store/toastStore';

export default function UsersAdmin() {
  const toast = useToast(s => s.show);
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  const toggleAdmin = async (id) => {
    try {
      await api.post(`/admin/users/${id}/toggle-admin`);
      toast('Admin status updated', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) { toast(err.response?.data?.error || 'Failed', { type: 'error' }); }
  };

  return (
    <AdminLayout title="Customers & Staff">
      {isLoading ? <p className="text-gray-500">Loading…</p> : (
        <div className="bg-[#1A1D21] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 bg-[#14171A] text-xs font-semibold text-gray-400 uppercase tracking-wider grid grid-cols-12 gap-4">
            <div className="col-span-6">User</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          {users.map(u => (
            <div key={u._id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-[#23272B] transition">
              <div className="col-span-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold shrink-0">
                  {(u.name?.[0] || 'U').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name || 'Guest'}</p>
                  <p className="text-xs text-gray-500 truncate">{u.phone || u.email || '—'}</p>
                </div>
              </div>
              <div className="col-span-3">
                <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded ${u.isAdmin ? 'text-brand bg-brand/10' : 'text-gray-400 bg-gray-800'}`}>
                  {u.isAdmin ? 'ADMIN' : 'CUSTOMER'}
                </span>
              </div>
              <div className="col-span-3 flex items-center justify-end">
                <button onClick={() => toggleAdmin(u._id)} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full transition ${u.isAdmin ? 'text-gray-400 hover:bg-[#333]' : 'text-brand bg-brand/10 hover:bg-brand/20'}`}>
                  {u.isAdmin ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                  {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
