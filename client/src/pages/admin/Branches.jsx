import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, MapPin, Clock } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useToast } from '../../store/toastStore';
import { getBranchStatus } from '../../store/branchStore';

export default function BranchesAdmin() {
  const qc = useQueryClient();
  const toast = useToast(s => s.show);
  const [editing, setEditing] = useState(null);
  
  const emptyForm = { 
    name: '', 
    address: '', 
    openTime: '08:00', 
    closeTime: '22:00', 
    isOpen: true 
  };
  const [form, setForm] = useState(emptyForm);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['admin', 'branches'],
    queryFn: () => api.get('/branches').then(r => r.data),
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/branches/${editing}`, form);
        toast('Branch updated', { type: 'success' });
      } else {
        await api.post('/admin/branches', form);
        toast('Branch created', { type: 'success' });
      }
      qc.invalidateQueries({ queryKey: ['admin', 'branches'] });
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      toast('Failed to save branch', { type: 'error' });
    }
  };

  const handleEdit = (b) => {
    setEditing(b._id);
    setForm({ 
      name: b.name, 
      address: b.address, 
      openTime: b.openTime || '08:00', 
      closeTime: b.closeTime || '22:00', 
      isOpen: b.isOpen !== false 
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this branch?')) return;
    try {
      await api.delete(`/admin/branches/${id}`);
      toast('Branch deleted', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['admin', 'branches'] });
    } catch (err) {
      toast('Failed to delete', { type: 'error' });
    }
  };

  return (
    <AdminLayout title="Branches">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* List */}
        <div className="xl:col-span-2 space-y-4">
          {isLoading ? <p className="text-gray-500">Loading…</p> : branches.map(b => {
            const currentStatus = getBranchStatus(b);
            return (
              <div key={b._id} className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${currentStatus === 'OPEN' ? 'bg-green-950/50' : 'bg-red-950/50'}`}>
                  <MapPin className={`w-5 h-5 ${currentStatus === 'OPEN' ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{b.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${currentStatus === 'OPEN' ? 'bg-green-950 text-green-500' : 'bg-red-950 text-red-500'}`}>
                      {currentStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{b.address}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Hours: {b.openTime || '08:00'} – {b.closeTime || '22:00'}
                    {b.isOpen === false && <span className="text-red-500 ml-2">(Manually Closed)</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(b)} className="p-2 bg-[#23272B] rounded-lg hover:text-white text-gray-400"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(b._id)} className="p-2 bg-[#23272B] rounded-lg hover:text-red-500 text-gray-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 h-fit sticky top-6">
          <h3 className="font-semibold text-white mb-4">{editing ? 'Edit Branch' : 'Add New Branch'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Branch Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Dmcfoods Nairobi" className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Address</label>
              <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="e.g. CBD, Kenyatta Ave" className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" required />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Opens At</label>
                <input type="time" value={form.openTime} onChange={e => setForm({...form, openTime: e.target.value})} className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Closes At</label>
                <input type="time" value={form.closeTime} onChange={e => setForm({...form, closeTime: e.target.value})} className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" required />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.isOpen} 
                onChange={e => setForm({...form, isOpen: e.target.checked})}
                className="w-4 h-4 rounded border-gray-600 bg-transparent text-brand focus:ring-brand"
              />
              <span className="text-sm text-white">Force Open (Bypasses Schedule)</span>
            </label>

            <button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mt-2">
              {editing ? 'Save Changes' : <><Plus className="w-4 h-4" /> Create Branch</>}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="w-full py-2 text-sm text-gray-400 hover:text-white">
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
