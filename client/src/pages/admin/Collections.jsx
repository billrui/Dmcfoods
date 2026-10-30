import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, LayoutGrid, List, AlignLeft, Search } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useToast } from '../../store/toastStore';

export default function CollectionsAdmin() {
  const qc = useQueryClient();
  const toast = useToast(s => s.show);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', type: 'horizontal', items: [] });
  const [search, setSearch] = useState('');

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['admin', 'collections'],
    queryFn: () => api.get('/admin/collections').then(r => r.data),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['admin', 'menu'],
    queryFn: () => api.get('/admin/menu').then(r => r.data.filter(i => !i.addonOnly)),
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        items: form.items.map(i => i._id)
      };
      if (editing) {
        await api.put(`/admin/collections/${editing}`, payload);
        toast('Collection updated', { type: 'success' });
      } else {
        await api.post('/admin/collections', payload);
        toast('Collection created', { type: 'success' });
      }
      qc.invalidateQueries({ queryKey: ['admin', 'collections'] });
      setEditing(null);
      setForm({ title: '', slug: '', type: 'horizontal', items: [] });
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save', { type: 'error' });
    }
  };

  const handleEdit = (col) => {
    setEditing(col._id);
    setForm({ title: col.title, slug: col.slug, type: col.type, items: col.items || [] });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this collection?')) return;
    try {
      await api.delete(`/admin/collections/${id}`);
      toast('Collection deleted', { type: 'success' });
      qc.invalidateQueries({ queryKey: ['admin', 'collections'] });
    } catch (err) { toast('Failed to delete', { type: 'error' }); }
  };

  const toggleItem = (item) => {
    setForm(prev => {
      const exists = prev.items.some(i => i._id === item._id);
      return {
        ...prev,
        items: exists ? prev.items.filter(i => i._id !== item._id) : [...prev.items, item]
      };
    });
  };

  const filteredItems = allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Menu Collections">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* List */}
        <div className="xl:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Collections</h2>
          {isLoading ? <p className="text-gray-500">Loading…</p> : collections.map(col => (
            <div key={col._id} className="bg-card border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-raised flex items-center justify-center shrink-0">
                {col.type === 'grid' ? <LayoutGrid className="w-5 h-5 text-brand" /> : col.type === 'list' ? <AlignLeft className="w-5 h-5 text-brand" /> : <List className="w-5 h-5 text-brand" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{col.title}</h3>
                <p className="text-xs text-gray-500">{col.items.length} items · {col.type}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(col)} className="p-2 bg-raised rounded-lg hover:text-white text-gray-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(col._id)} className="p-2 bg-raised rounded-lg hover:text-red-500 text-gray-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="xl:col-span-2 bg-card border border-gray-800 rounded-2xl p-6 h-fit">
          <h3 className="font-semibold text-white mb-4">{editing ? 'Edit Collection' : 'Create New Collection'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="e.g. Today's Offers" className="w-full bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Slug (URL)</label>
                <input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="e.g. todays-offers" className="w-full bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" required />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Layout Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
                <option value="horizontal">Horizontal Scroll (Popular/Latest)</option>
                <option value="grid">Grid (All Foods)</option>
                <option value="list">Vertical List (Flavorful Set)</option>
              </select>
            </div>

            {/* Item Selection */}
            <div className="border-t border-gray-800 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-white">Select Items ({form.items.length} selected)</label>
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-sunken border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none" />
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                {filteredItems.map(item => {
                  const isSelected = form.items.some(i => i._id === item._id);
                  return (
                    <label key={item._id} className="flex items-center gap-3 p-2 hover:bg-raised rounded-lg cursor-pointer">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item)} className="w-4 h-4 rounded border-gray-600 bg-transparent text-brand focus:ring-brand" />
                      <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" />
                      <span className="text-sm text-gray-200 flex-1">{item.name}</span>
                      <span className="text-xs text-gray-500">Ksh{item.price / 100}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button type="submit" className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold">
                {editing ? 'Save Changes' : 'Create Collection'}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm({ title: '', slug: '', type: 'horizontal', items: [] }); }} className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
