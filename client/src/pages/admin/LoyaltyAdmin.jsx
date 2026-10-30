import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Search, Loader2, Save, Plus, Minus, X } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useToast } from '../../store/toastStore';

const ksh = (c) => `Ksh ${(Math.round(c) / 100).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

export default function LoyaltyAdmin() {
  const toast = useToast(s => s.show);
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [adjust, setAdjust] = useState(null); // { member, points, note }

  const { data: settings } = useQuery({ queryKey: ['admin', 'loyalty', 'settings'], queryFn: () => api.get('/loyalty/admin/settings').then(r => r.data) });
  const { data: m, isLoading } = useQuery({
    queryKey: ['admin', 'loyalty', 'members', q],
    queryFn: () => api.get('/loyalty/admin/members', { params: { q } }).then(r => r.data),
  });

  useEffect(() => {
    if (settings && !form) setForm({ ...settings, pointValue: settings.pointValue / 100 });
  }, [settings]); // eslint-disable-line

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/loyalty/admin/settings', { ...form, pointValue: Math.round(Number(form.pointValue) * 100) });
      setForm({ ...data, pointValue: data.pointValue / 100 });
      qc.invalidateQueries({ queryKey: ['admin', 'loyalty'] });
      toast('Loyalty settings saved', { type: 'success' });
    } catch (err) { toast(err.response?.data?.error || 'Save failed', { type: 'error' }); }
    finally { setSaving(false); }
  };

  const doAdjust = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/loyalty/admin/adjust', { userId: adjust.member._id, points: Number(adjust.points), note: adjust.note });
      toast(`${adjust.member.name || adjust.member.phone} now has ${data.balance} points`, { type: 'success' });
      setAdjust(null);
      qc.invalidateQueries({ queryKey: ['admin', 'loyalty', 'members'] });
    } catch (err) { toast(err.response?.data?.error || 'Failed', { type: 'error' }); }
  };

  // Example for the owner: what a Ksh 1,000 order gives
  const ex = form && Number(form.earnPerKsh) > 0 ? Math.floor(1000 / Number(form.earnPerKsh)) : 0;
  const exValue = form ? ex * Number(form.pointValue || 0) : 0;
  const pct = form ? (Number(form.pointValue || 0) / Number(form.earnPerKsh || 1)) * 100 : 0;
  const input = 'w-full bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand';

  return (
    <AdminLayout title="Loyalty points">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Settings */}
        <form onSubmit={save} className="xl:col-span-2 bg-card border border-gray-800 rounded-2xl p-5 h-fit space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" /> Rules</h2>
          {!form ? <p className="text-gray-500 text-sm">Loading…</p> : (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-transparent text-brand focus:ring-brand" />
                <span className="text-sm text-white">Points switched on</span>
              </label>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Customers earn 1 point for every … spent on food</label>
                <div className="flex items-center gap-2"><span className="text-sm text-gray-400">Ksh</span>
                  <input type="number" min="1" value={form.earnPerKsh} onChange={e => setForm({ ...form, earnPerKsh: e.target.value })} className={input} /></div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Each point is worth</label>
                <div className="flex items-center gap-2"><span className="text-sm text-gray-400">Ksh</span>
                  <input type="number" min="0.01" step="0.01" value={form.pointValue} onChange={e => setForm({ ...form, pointValue: e.target.value })} className={input} /></div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Points needed before they can redeem</label>
                <input type="number" min="0" value={form.minRedeem} onChange={e => setForm({ ...form, minRedeem: e.target.value })} className={input} />
              </div>
              <div className="text-xs text-gray-400 bg-sunken border border-gray-800 rounded-xl p-3 leading-relaxed">
                Example: a Ksh 1,000 order earns <b className="text-white">{ex} points</b> (worth {ksh(exValue * 100)}), so customers get
                about <b className="text-white">{pct.toFixed(1)}% back</b>. They can redeem from {Number(form.minRedeem || 0).toLocaleString()} points
                ({ksh(Number(form.minRedeem || 0) * Number(form.pointValue || 0) * 100)} off).
              </div>
              <button disabled={saving} className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save rules
              </button>
            </>
          )}
        </form>

        {/* Members */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-card border border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500">Customers with points</p>
              <p className="text-xl font-semibold mt-1">{m?.memberCount ?? '—'}</p>
            </div>
            <div className="bg-card border border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500">Points not yet used</p>
              <p className="text-xl font-semibold mt-1">{(m?.totalPoints ?? 0).toLocaleString()}
                {settings && <span className="text-xs text-gray-500 font-normal"> · {ksh((m?.totalPoints || 0) * settings.pointValue)}</span>}</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a customer by name or phone"
              className="w-full bg-card border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand" />
          </div>

          <div className="bg-card border border-gray-800 rounded-2xl overflow-hidden">
            {isLoading ? <p className="p-5 text-sm text-gray-500">Loading…</p>
            : !m?.members?.length ? <p className="p-8 text-center text-sm text-gray-500">{q ? 'No customer found.' : 'No customer has points yet.'}</p>
            : m.members.map((u, i) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 last:border-0">
                <span className="w-6 text-xs text-gray-500 tabular-nums">{q ? '' : i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{u.name || 'Customer'}</p>
                  <p className="text-xs text-gray-500">{u.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{(u.points || 0).toLocaleString()} pts</p>
                  {settings && <p className="text-[11px] text-gray-500">{ksh((u.points || 0) * settings.pointValue)}{(u.points || 0) >= settings.minRedeem ? ' · can redeem' : ''}</p>}
                </div>
                <button onClick={() => setAdjust({ member: u, points: '', note: '' })} className="text-xs text-gray-300 px-3 py-1.5 rounded-full hover:bg-raised">Adjust</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {adjust && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setAdjust(null)}>
          <form onSubmit={doAdjust} onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-card border border-gray-800 rounded-2xl p-6 relative space-y-4">
            <button type="button" onClick={() => setAdjust(null)} className="absolute top-4 right-4 text-gray-500"><X className="w-5 h-5" /></button>
            <h3 className="font-semibold">Adjust points</h3>
            <p className="text-sm text-gray-400">{adjust.member.name || adjust.member.phone} has <b className="text-white">{adjust.member.points}</b> points.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAdjust({ ...adjust, points: String(Math.abs(Number(adjust.points) || 50)) })} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-500/10 text-green-400 text-xs"><Plus className="w-3 h-3" /> Add</button>
              <button type="button" onClick={() => setAdjust({ ...adjust, points: String(-Math.abs(Number(adjust.points) || 50)) })} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs"><Minus className="w-3 h-3" /> Remove</button>
            </div>
            <input type="number" autoFocus value={adjust.points} onChange={e => setAdjust({ ...adjust, points: e.target.value })} placeholder="e.g. 50 or -50" className={input} />
            <input value={adjust.note} onChange={e => setAdjust({ ...adjust, note: e.target.value })} placeholder="Reason (shown to the customer)" className={input} />
            <button className="w-full bg-brand text-white py-2.5 rounded-lg font-semibold text-sm">Save</button>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
