import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff, KeyRound, Copy, Check, X, Loader2, Search } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../store/toastStore';

export default function UsersAdmin() {
  const toast = useToast(s => s.show);
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [confirmUser, setConfirmUser] = useState(null);   // user we're about to reset
  const [result, setResult] = useState(null);             // { user, tempPassword }
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const doReset = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/users/${confirmUser._id}/reset-password`);
      setResult({ user: confirmUser, tempPassword: data.tempPassword });
      setConfirmUser(null);
      setCopied(false);
    } catch (err) {
      toast(err.response?.data?.error || 'Reset failed', { type: 'error' });
    } finally { setBusy(false); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(result.tempPassword); setCopied(true); } catch {}
  };

  const term = q.trim().toLowerCase();
  const shown = !term ? users : users.filter(u =>
    [u.name, u.phone, u.email].some(v => v?.toLowerCase().includes(term)));
  const admins = shown.filter(u => u.isAdmin);
  const customers = shown.filter(u => !u.isAdmin);

  const Row = (u) => {
    const isMe = u._id === me?._id;
    return (
      <div key={u._id} className="flex flex-wrap sm:flex-nowrap gap-3 items-center px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-raised transition">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold shrink-0">
            {(u.name?.[0] || 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {u.name || 'Guest'} {isMe && <span className="text-[10px] text-gray-500 font-normal">(you)</span>}
            </p>
            <p className="text-xs text-gray-500 truncate">{u.phone || u.email || '—'}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${u.isAdmin ? 'text-brand bg-brand/10' : 'text-gray-400 bg-gray-800'}`}>
          {u.isAdmin ? 'ADMIN' : 'CUSTOMER'}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {!isMe && (me?.isSuperAdmin || !u.isAdmin) && (
            <button onClick={() => setConfirmUser(u)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full text-gray-300 hover:bg-raised2 transition">
              <KeyRound className="w-3 h-3" /> Reset password
            </button>
          )}
          {!isMe && me?.isSuperAdmin && !u.isSuperAdmin && (
            <button onClick={() => toggleAdmin(u._id)} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full transition ${u.isAdmin ? 'text-gray-400 hover:bg-raised2' : 'text-brand bg-brand/10 hover:bg-brand/20'}`}>
              {u.isAdmin ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
              {u.isAdmin ? 'Remove admin' : 'Make admin'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, list }) => list.length > 0 && (
    <section>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title} · {list.length}</h3>
      <div className="bg-card rounded-2xl border border-gray-800 overflow-hidden">{list.map(Row)}</div>
    </section>
  );

  return (
    <AdminLayout title="Customers & Staff">
      <div className="bg-card border border-gray-800 rounded-2xl p-4 mb-6 text-sm text-gray-400 leading-relaxed">
        <span className="text-white font-medium">Adding staff:</span> ask them to register a normal account on the store,
        then click <span className="text-brand">Make admin</span> next to their name. They sign in at <code className="text-gray-300">/dmc-console/login</code>.
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or phone"
          className="w-full bg-sunken border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand" />
      </div>

      {isLoading ? <p className="text-gray-500">Loading…</p> : (
        <div className="space-y-8">
          <Section title="Admins" list={admins} />
          <Section title="Customers" list={customers} />
          {!shown.length && <p className="text-gray-500 text-sm">No users match “{q}”.</p>}
        </div>
      )}

      {(confirmUser || result) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-gray-800 rounded-2xl p-6 relative">
            <button onClick={() => { setConfirmUser(null); setResult(null); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white" aria-label="Close"><X className="w-5 h-5" /></button>

            {confirmUser && (
              <>
                <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center mb-4"><KeyRound className="w-5 h-5 text-brand" /></div>
                <h3 className="text-lg font-semibold text-white">Reset password?</h3>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                  <span className="text-white">{confirmUser.name || 'This user'}</span> ({confirmUser.phone}) will be signed out everywhere
                  and given a temporary password. They'll choose a new one the next time they sign in.
                </p>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setConfirmUser(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-raised hover:bg-raised2">Cancel</button>
                  <button onClick={doReset} disabled={busy}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-hover disabled:opacity-60 flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />} Reset password
                  </button>
                </div>
              </>
            )}

            {result && (
              <>
                <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center mb-4"><Check className="w-5 h-5 text-green-500" /></div>
                <h3 className="text-lg font-semibold text-white">Temporary password created</h3>
                <p className="text-sm text-gray-400 mt-1.5">Give this to {result.user.name || result.user.phone} in person or by SMS. It is shown only once.</p>
                <div className="mt-5 flex items-center gap-2 bg-app border border-gray-800 rounded-xl p-3">
                  <code className="flex-1 text-lg tracking-wider text-white font-mono select-all">{result.tempPassword}</code>
                  <button onClick={copy} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-raised text-gray-200 hover:bg-raised2">
                    {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
                <button onClick={() => setResult(null)} className="w-full mt-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-hover">Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
