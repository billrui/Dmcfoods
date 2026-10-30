import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useToast } from '../../store/toastStore';

export default function DeliveryZonesAdmin() {
  const qc = useQueryClient();
  const toast = useToast(s => s.show);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', fee: '', isActive: true });

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['admin', 'delivery-zones'],
    queryFn: () => api.get('/delivery-zones/admin').then(r => r.data),
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, fee: Number(form.fee) * 100, isActive: form.isActive };
      
      if (editing) {
        await api.put(`/delivery-zones/admin/${editing}`, payload);
        toast('Zone updated', { type: 'success' });
      } else {
        await api.post('/delivery-zones/admin', payload);
        toast('Zone created', { type: 'success' });
      }
      qc.invalidateQueries({ queryKey: ['admin', 'delivery-zones'] });
      setEditing(null);
      setForm({ name: '', fee: '', isActive: true });
    } catch (err) {
      toast('Failed to save zone', { type: 'error' });
    }
  };

  const handleEdit = (z) => {
    setEditing(z._id);
    setForm({ name: z.name, fee: z.fee / 100, isActive: z.isActive });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this zone?')) return;
    try {
      await api.delete(`/delivery-zones/admin/${id}`);
      toast('Zone deleted', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['admin', 'delivery-zones'] });
    } catch (err) {
      toast('Failed to delete', { type: 'error' });
    }
  };

  return (
    <AdminLayout title="Delivery Zones">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? <p className="text-gray-500">Loading…</p> : zones.map(z => (
            <div key={z._id} className="bg-card border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${z.isActive ? 'bg-green-950/50' : 'bg-gray-800'}`}>
                <MapPin className={`w-5 h-5 ${z.isActive ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{z.name}</h3>
                <p className="text-sm text-brand font-medium mt-0.5">Ksh{z.fee / 100} delivery fee</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(z)} className="p-2 bg-raised rounded-lg hover:text-white text-gray-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(z._id)} className="p-2 bg-raised rounded-lg hover:text-red-500 text-gray-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Form */}
        <div className="bg-card border border-gray-800 rounded-2xl p-5 h-fit sticky top-6">
          <h3 className="font-semibold text-white mb-4">{editing ? 'Edit Zone' : 'Add New Zone'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Zone Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Kericho Town" className="w-full bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Delivery Fee (Ksh)</label>
              <input type="number" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} placeholder="150" className="w-full bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" required />
            </div>
            
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4 rounded border-gray-600 bg-transparent text-brand focus:ring-brand" />
              <span className="text-sm text-white">Zone is Active</span>
            </label>

            <button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mt-2">
              {editing ? 'Save Changes' : <><Plus className="w-4 h-4" /> Create Zone</>}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm({ name: '', fee: '', isActive: true }); }} className="w-full py-2 text-sm text-gray-400 hover:text-white">
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
