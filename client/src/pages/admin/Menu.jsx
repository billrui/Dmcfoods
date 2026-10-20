import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import AdminEditItemModal from '../../components/AdminEditItemModal.jsx';
import { useToast } from '../../store/toastStore';

export default function MenuAdmin() {
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const qc = useQueryClient();
  const toast = useToast(s => s.show);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const { data: items = [], isLoading } = useQuery({ queryKey: ['menu', 'all'], queryFn: () => api.get('/menu').then(r => r.data) });

  const toggleAvailability = async (id) => {
    try {
      await api.post(`/admin/menu/${id}/toggle`);
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast('Availability updated', { type: 'success' });
    } catch (err) { toast('Failed', { type: 'error' }); }
  };

  const handleSave = () => {
    qc.invalidateQueries({ queryKey: ['menu'] });
    setEditingItem(null);
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Menu">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand" />
        </div>
      </div>

      {isLoading ? <p className="text-gray-500">Loading…</p> : (
        <div className="space-y-6">
          {categories.map(cat => {
            const catItems = filteredItems.filter(i => i.category?._id === cat._id);
            if (catItems.length === 0) return null;
            return (
              <div key={cat._id} className="bg-[#1A1D21] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 bg-[#14171A]"><h2 className="text-sm font-semibold">{cat.name}</h2></div>
                <div className="divide-y divide-gray-800">
                  {catItems.map(item => (
                    <div key={item._id} className="px-5 py-3 flex items-center gap-4 hover:bg-[#23272B] transition">
                      <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-800" />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Ksh{item.price / 100}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleAvailability(item._id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${item.isAvailable ? 'border-green-800 text-green-500' : 'border-red-800 text-red-500'}`}>
                          {item.isAvailable ? <><ToggleRight className="w-3 h-3"/> In Stock</> : <><ToggleLeft className="w-3 h-3"/> Out</>}
                        </button>
                        
                        <button onClick={() => setEditingItem(item)} className="p-2 bg-[#23272B] text-white rounded-lg hover:bg-brand hover:text-white transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingItem && (
        <AdminEditItemModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSave={handleSave} 
        />
      )}
    </AdminLayout>
  );
}
