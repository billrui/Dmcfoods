import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, KeyRound, UserMinus, Crown, Copy, Check, X, Loader2, Phone, User } from 'lucide-react';
import api from '../../../lib/api';
import AdminLayout from '../../../components/AdminLayout.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../store/toastStore';
import { Card } from './superUi.jsx';

const since = (d) => {
  if (!d) return 'Never';
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 2) return 'Just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

export default function SuperAdmins() {
  const { user: me } = useAuth();
  const toast = useToast(s => s.show);
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // 'create' | {confirm:'reset'|'remove', admin} | {done, admin, tempPassword}
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['super', 'admins'],
    queryFn: () => api.get('/super/admins').then(r => r.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['super', 'admins'] });
  const close = () => { setModal(null); setErr(''); setName(''); setPhone(''); setCopied(false); };

  const create = async (e) => {
    e.preventDefault();
    setErr('');
    if (!name.trim()) return setErr('Enter their name.');
    if (phone.length < 9) return setErr('Enter a valid phone number.');
    setBusy(true);
    try {
      const { data } = await api.post('/super/admins', { name, phone });
      setModal({ done: 'created', admin: data, tempPassword: data.tempPassword });
      refresh();
    } catch (e2) { setErr(e2.response?.data?.error || 'Could not create the account.'); }
    finally { setBusy(false); }
  };

  const confirmAction = async () => {
    const { confirm, admin } = modal;
    setBusy(true);
    try {
      if (confirm === 'reset') {
        const { data } = await api.post(`/super/admins/${admin._id}/reset-password`);
        setModal({ done: 'reset', admin, tempPassword: data.tempPassword });
      } else {
        await api.post(`/super/admins/${admin._id}/remove`);
        toast(`${admin.name || admin.phone} is no longer an admin`, { type: 'success' });
        close();
      }
      refresh();
    } catch (e2) { toast(e2.response?.data?.error || 'Failed', { type: 'error' }); }
    finally { setBusy(false); }
  };

  return (
    <AdminLayout title="Admin accounts">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-400 max-w-xl">
          Create accounts for your staff here. Each person gets a temporary password and chooses their own the first time they sign in at <code className="text-gray-300">/dmc-console/login</code>.
        </p>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand/20">
          <UserPlus className="w-4 h-4" /> New admin
        </button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <p className="p-6 text-gray-500 text-sm">Loading…</p> : admins.map(a => {
          const isMe = a._id === me?._id;
          return (
            <div key={a._id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 px-5 py-4 border-b border-gray-800 last:border-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${a.isSuperAdmin ? 'bg-amber-500/15 text-amber-400' : 'bg-brand/15 text-brand'}`}>
                {a.isSuperAdmin ? <Crown className="w-4 h-4" /> : (a.name?.[0] || 'A').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.name || 'Admin'} {isMe && <span className="text-gray-500 font-normal text-xs">(you)</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {a.phone} · last active {since(a.lastActive)}
                  {a.mustChangePassword && <span className="text-amber-400"> · hasn’t set own password yet</span>}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${a.isSuperAdmin ? 'text-amber-400 bg-amber-500/10' : 'text-brand bg-brand/10'}`}>
                {a.isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
              </span>
              {!isMe && (
                <div className="flex gap-1 ml-auto">
                  <button onClick={() => setModal({ confirm: 'reset', admin: a })}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full text-gray-300 hover:bg-raised">
                    <KeyRound className="w-3 h-3" /> Reset password
                  </button>
                  {!a.isSuperAdmin && (
                    <button onClick={() => setModal({ confirm: 'remove', admin: a })}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full text-red-400 hover:bg-red-950/30">
                      <UserMinus className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-gray-800 rounded-2xl p-6 relative">
            <button onClick={close} className="absolute top-4 right-4 text-gray-500 hover:text-white" aria-label="Close"><X className="w-5 h-5" /></button>

            {modal === 'create' && (
              <form onSubmit={create} noValidate>
                <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center mb-4"><UserPlus className="w-5 h-5 text-brand" /></div>
                <h3 className="text-lg font-semibold">New admin account</h3>
                <p className="text-sm text-gray-400 mt-1">You’ll get a temporary password to give them.</p>
                <label className="block text-xs text-gray-400 mt-5 mb-1.5">Name</label>
                <div className="flex items-center bg-sunken border border-gray-800 rounded-xl focus-within:border-brand">
                  <User className="w-4 h-4 text-gray-500 ml-3.5" />
                  <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Wanjiru"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none" />
                </div>
                <label className="block text-xs text-gray-400 mt-4 mb-1.5">Phone number</label>
                <div className="flex items-center bg-sunken border border-gray-800 rounded-xl focus-within:border-brand">
                  <span className="flex items-center gap-2 pl-3.5 pr-3 text-sm text-gray-400 border-r border-gray-800"><Phone className="w-4 h-4" /> +254</span>
                  <input type="tel" inputMode="numeric" value={phone} placeholder="712 345 678"
                    onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.startsWith('254')) v = v.slice(3); if (v.startsWith('0')) v = v.slice(1); setPhone(v.slice(0, 9)); }}
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none" />
                </div>
                {err && <p className="text-sm text-red-300 bg-red-950/40 border border-red-900/60 rounded-xl px-3.5 py-2.5 mt-4">{err}</p>}
                <button type="submit" disabled={busy}
                  className="w-full mt-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-hover disabled:opacity-60 flex items-center justify-center gap-2">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Create account
                </button>
              </form>
            )}

            {modal?.confirm && (
              <>
                <h3 className="text-lg font-semibold">{modal.confirm === 'reset' ? 'Reset password?' : 'Remove admin access?'}</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  <span className="text-white">{modal.admin.name || modal.admin.phone}</span> will be signed out everywhere.
                  {modal.confirm === 'reset'
                    ? ' You’ll get a temporary password to give them.'
                    : ' They keep their customer account but can no longer open the console.'}
                </p>
                <div className="flex gap-3 mt-6">
                  <button onClick={close} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-raised hover:bg-raised2">Cancel</button>
                  <button onClick={confirmAction} disabled={busy}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2 ${modal.confirm === 'remove' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-hover'}`}>
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />} {modal.confirm === 'reset' ? 'Reset password' : 'Remove'}
                  </button>
                </div>
              </>
            )}

            {modal?.done && (
              <>
                <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center mb-4"><Check className="w-5 h-5 text-green-500" /></div>
                <h3 className="text-lg font-semibold">{modal.done === 'created' ? 'Account created' : 'Password reset'}</h3>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                  Give these details to {modal.admin.name || 'them'}. The password is shown only once — they’ll choose their own when they sign in.
                </p>
                <div className="mt-5 bg-app border border-gray-800 rounded-xl p-4 space-y-2 text-sm">
                  <p className="flex justify-between"><span className="text-gray-500">Sign in at</span><span className="text-white">{window.location.host}/dmc-console/login</span></p>
                  <p className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-white">{modal.admin.phone}</span></p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Password</span>
                    <code className="text-white font-mono text-base tracking-wider select-all">{modal.tempPassword}</code>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`Admin console: ${window.location.origin}/dmc-console/login\nPhone: ${modal.admin.phone}\nTemporary password: ${modal.tempPassword}`);
                      setCopied(true);
                    } catch {}
                  }}
                  className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-gray-200 bg-raised hover:bg-raised2 flex items-center justify-center gap-2">
                  {copied ? <><Check className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy details to send</>}
                </button>
                <button onClick={close} className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-hover">Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
