import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ToggleLeft, ToggleRight, Edit2, Plus, FolderCog, X, Trash2, Check, Loader2, Puzzle, ImageOff } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import AdminEditItemModal from '../../components/AdminEditItemModal.jsx';
import { useToast } from '../../store/toastStore';

export default function MenuAdmin() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editing, setEditing] = useState(null); // item object, or { new: true, category }
  const [showCats, setShowCats] = useState(false);
  const qc = useQueryClient();
  const toast = useToast(s => s.show);

  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => api.get('/admin/categories').then(r => r.data) });
  const { data: items = [], isLoading } = useQuery({ queryKey: ['admin', 'menu'], queryFn: () => api.get('/admin/menu').then(r => r.data) });
  const { data: collections = [] } = useQuery({ queryKey: ['admin', 'collections'], queryFn: () => api.get('/admin/collections').then(r => r.data) });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'menu'] });
    qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    qc.invalidateQueries({ queryKey: ['menu'] });
    qc.invalidateQueries({ queryKey: ['categories'] });
    qc.invalidateQueries({ queryKey: ['admin', 'collections'] });
    qc.invalidateQueries({ queryKey: ['collections'] });
  };

  const toggleAvailability = async (id) => {
    try {
      await api.post(`/admin/menu/${id}/toggle`);
      refresh();
    } catch { toast('Failed', { type: 'error' }); }
  };

  const term = search.toLowerCase();
  const filtered = items.filter(i => i.name.toLowerCase().includes(term) && (catFilter === 'all' || (i.category?._id || 'none') === catFilter));
  const groups = [
    ...categories.map(c => ({ ...c, items: filtered.filter(i => i.category?._id === c._id) })),
    { _id: 'none', name: 'No category', items: filtered.filter(i => !i.category || !categories.some(c => c._id === i.category._id)) },
  ].filter(g => g.items.length || (catFilter === g._id && g._id !== 'none'));

  const outCount = items.filter(i => !i.isAvailable).length;

  return (
    <AdminLayout title="Menu">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-card border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-card border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
          <option value="all">All categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setShowCats(true)} className="flex items-center gap-2 text-sm text-gray-200 bg-card border border-gray-700 rounded-xl px-3.5 py-2.5 hover:border-gray-500">
            <FolderCog className="w-4 h-4" /> Categories
          </button>
          <button onClick={() => categories.length ? setEditing({ new: true, category: catFilter !== 'all' ? catFilter : undefined }) : setShowCats(true)}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl px-4 py-2.5 shadow-lg shadow-brand/20">
            <Plus className="w-4 h-4" /> New item
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4">{items.length} item{items.length === 1 ? '' : 's'}{outCount ? ` · ${outCount} out of stock` : ''}</p>

      {isLoading ? <p className="text-gray-500">Loading…</p>
      : items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-gray-700 p-10 text-center">
          <p className="text-white font-medium">Your menu is empty</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">{categories.length ? 'Add your first dish.' : 'Start by creating a category, then add dishes to it.'}</p>
          <button onClick={() => categories.length ? setEditing({ new: true }) : setShowCats(true)} className="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> {categories.length ? 'New item' : 'Create a category'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(cat => (
            <div key={cat._id} className="bg-card rounded-2xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 bg-sunken flex items-center justify-between">
                <h2 className="text-sm font-semibold">{cat.name} <span className="text-gray-500 font-normal">· {cat.items.length}</span></h2>
                {cat._id !== 'none' && (
                  <button onClick={() => setEditing({ new: true, category: cat._id })} className="text-xs text-brand hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add here</button>
                )}
              </div>
              {cat.items.length === 0 ? <p className="px-5 py-4 text-sm text-gray-500">No items in this category yet.</p> : (
                <div className="divide-y divide-gray-800">
                  {cat.items.map(item => (
                    <div key={item._id} className={`px-5 py-3 flex items-center gap-4 hover:bg-raised transition ${item.isAvailable ? '' : 'opacity-60'}`}>
                      {item.image
                        ? <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-800" />
                        : <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center"><ImageOff className="w-4 h-4 text-gray-600" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate flex items-center gap-1.5">
                          {item.name}
                          {item.addonOnly && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded"><Puzzle className="w-3 h-3" /> ADD-ON</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.discount > 0
                            ? <><span className="text-white">Ksh {(item.price - item.discount) / 100}</span> <s>Ksh {item.price / 100}</s></>
                            : <>Ksh {item.price / 100}</>}
                          {(() => { const n = (item.addonItems?.length || 0) + (item.addons?.length || 0); return n ? ` · ${n} add-on${n === 1 ? '' : 's'}` : ''; })()}
                          {(() => { const cs = collections.filter(c => (c.items || []).some(i => String(i?._id || i) === String(item._id))); return cs.length ? ` · in ${cs.map(c => c.title).join(', ')}` : ''; })()}
                        </p>
                      </div>
                      <button onClick={() => toggleAvailability(item._id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${item.isAvailable ? 'border-green-800 text-green-500' : 'border-red-800 text-red-500'}`}>
                        {item.isAvailable ? <><ToggleRight className="w-3 h-3" /> In stock</> : <><ToggleLeft className="w-3 h-3" /> Out</>}
                      </button>
                      <button onClick={() => setEditing(item)} className="p-2 bg-raised text-white rounded-lg hover:bg-brand transition" aria-label="Edit"><Edit2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {groups.length === 0 && <p className="text-sm text-gray-500">No items match your search.</p>}
        </div>
      )}

      {editing && (
        <AdminEditItemModal
          item={editing.new ? null : editing}
          defaultCategory={editing.new ? editing.category : undefined}
          categories={categories}
          allItems={items}
          collections={collections}
          onClose={() => setEditing(null)}
          onSave={() => { refresh(); setEditing(null); }}
          onDelete={() => { refresh(); setEditing(null); }}
        />
      )}
      {showCats && <CategoriesModal categories={categories} onClose={() => setShowCats(false)} onChange={refresh} />}
    </AdminLayout>
  );
}

function CategoriesModal({ categories, onClose, onChange }) {
  const toast = useToast(s => s.show);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const run = async (fn, ok) => {
    setBusy(true);
    try { await fn(); onChange(); if (ok) toast(ok, { type: 'success' }); return true; }
    catch (e) { toast(e.response?.data?.error || 'Failed', { type: 'error' }); return false; }
    finally { setBusy(false); }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (await run(() => api.post('/admin/categories', { name }), `Category “${name.trim()}” added`)) setName('');
  };
  const rename = async (id) => {
    if (await run(() => api.put(`/admin/categories/${id}`, { name: editName }))) setEditId(null);
  };
  const move = (idx, dir) => {
    const list = [...categories];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    run(() => api.post('/admin/categories/reorder', { ids: list.map(c => c._id) }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:pt-16 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-gray-800 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-white">Categories</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-5">Shown to customers in this order. A category can only be deleted when it’s empty.</p>

        <form onSubmit={add} className="flex gap-2 mb-5">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="New category, e.g. Drinks"
            className="flex-1 bg-sunken border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-brand" />
          <button disabled={busy || !name.trim()} className="px-4 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </form>

        <div className="space-y-1.5">
          {categories.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No categories yet.</p>}
          {categories.map((c, i) => (
            <div key={c._id} className="flex items-center gap-2 bg-sunken border border-gray-800 rounded-lg pl-3 pr-1.5 py-1.5">
              <div className="flex flex-col -my-1">
                <button onClick={() => move(i, -1)} disabled={i === 0 || busy} className="text-gray-500 hover:text-white disabled:opacity-20 text-[10px] leading-none py-0.5" aria-label="Move up">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === categories.length - 1 || busy} className="text-gray-500 hover:text-white disabled:opacity-20 text-[10px] leading-none py-0.5" aria-label="Move down">▼</button>
              </div>
              {editId === c._id ? (
                <>
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && rename(c._id)}
                    className="flex-1 bg-transparent text-sm text-white outline-none border-b border-brand" />
                  <button onClick={() => rename(c._id)} className="p-1.5 text-green-500"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditId(null)} className="p-1.5 text-gray-500"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditId(c._id); setEditName(c.name); }} className="flex-1 text-left text-sm text-white truncate">{c.name}</button>
                  <span className="text-xs text-gray-500">{c.itemCount ?? 0}</span>
                  <button onClick={() => run(() => api.delete(`/admin/categories/${c._id}`), `“${c.name}” deleted`)} disabled={busy}
                    className="p-1.5 text-gray-500 hover:text-red-400" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
