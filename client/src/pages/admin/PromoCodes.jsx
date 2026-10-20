import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Ticket, Copy } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useToast } from '../../store/toastStore';

export default function PromoCodesAdmin() {
  const qc = useQueryClient();
  const toast = useToast(s => s.show);
  const [editing, setEditing] = useState(null);
  const emptyForm = { code: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxUses: '', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['admin', 'promos'],
    queryFn: () => api.get('/admin/promos').then(r => r.data),
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) * 100,
        maxUses: Number(form.maxUses),
      };
      if (editing) {
        await api.put(`/admin/promos/${editing}`, payload);
        toast('Promo updated', { type: 'success' });
      } else {
        await api.post('/admin/promos', payload);
        toast('Promo created', { type: 'success' });
      }
      qc.invalidateQueries({ queryKey: ['admin', 'promos'] });
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save promo', { type: 'error' });
    }
  };

  const handleEdit = (p) => {
    setEditing(p._id);
    setForm({ 
      code: p.code, 
      discountType: p.discountType, 
      discountValue: p.discountValue, 
      minOrderValue: p.minOrderValue / 100, 
      maxUses: p.maxUses,
      isActive: p.isActive 
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      await api.delete(`/admin/promos/${id}`);
      toast('Promo deleted', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['admin', 'promos'] });
    } catch (err) { toast('Failed to delete', { type: 'error' }); }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm({ ...form, code: result });
  };

  return (
    <AdminLayout title="Promo Codes">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? <p className="text-gray-500">Loading…</p> : promos.map(p => (
            <div key={p._id} className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.isActive ? 'bg-brand/10' : 'bg-gray-800'}`}>
                <Ticket className={`w-5 h-5 ${p.isActive ? 'text-brand' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-lg tracking-wider">{p.code}</h3>
                  <button onClick={() => { navigator.clipboard.writeText(p.code); toast('Copied!'); }} className="text-gray-500 hover:text-white"><Copy className="w-3 h-3" /></button>
                </div>
                <p className="text-sm text-gray-400">
                  {p.discountType === 'percentage' ? `${p.discountValue}% OFF` : `Ksh${p.discountValue / 100} OFF`}
                  {p.minOrderValue > 0 && ` • Min order Ksh${p.minOrderValue / 100}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">Used {p.currentUses} {p.maxUses > 0 ? `/ ${p.maxUses}` : ''} times</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="p-2 bg-[#23272B] rounded-lg hover:text-white text-gray-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(p._id)} className="p-2 bg-[#23272B] rounded-lg hover:text-red-500 text-gray-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 h-fit sticky top-6">
          <h3 className="font-semibold text-white mb-4">{editing ? 'Edit Promo' : 'Create Promo'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Promo Code</label>
              <div className="flex gap-2">
                <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g. SAVE20" className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none uppercase" required />
                <button type="button" onClick={generateCode} className="px-3 bg-gray-800 text-xs text-white rounded-lg hover:bg-gray-700">Gen</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (Ksh)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Value</label>
                <input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} placeholder={form.discountType === 'percentage' ? '10' : '100'} className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Min Order (Ksh)</label>
                <input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: e.target.value})} placeholder="0" className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Max Uses</label>
                <input type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} placeholder="0 (Unlimited)" className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4 rounded border-gray-600 bg-transparent text-brand focus:ring-brand" />
              <span className="text-sm text-white">Active</span>
            </label>

            <button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mt-2">
              {editing ? 'Save Changes' : <><Plus className="w-4 h-4" /> Create Promo</>}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
