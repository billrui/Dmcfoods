import { useState } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon, Loader2, Search, LayoutGrid, Puzzle } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../store/toastStore';

// item = existing menu item to edit, or null to create a new one
export default function AdminEditItemModal({ item, categories = [], allItems = [], collections = [], defaultCategory, onClose, onSave, onDelete }) {
  const toast = useToast(s => s.show);
  const isNew = !item?._id;
  const [form, setForm] = useState({
    name: item?.name || '',
    price: item ? item.price / 100 : '',
    discount: item?.discount ? item.discount / 100 : '',
    category: item?.category?._id || item?.category || defaultCategory || categories[0]?._id || '',
    image: item?.image || '',
    description: item?.description || '',
    isAvailable: item?.isAvailable ?? true,
    addonOnly: item?.addonOnly ?? false,
    addonItems: (item?.addonItems || []).map(a => String(a?._id || a)),
    addons: (item?.addons || []).map(a => ({ name: a.name, price: a.price / 100 })), // old typed-in extras
  });
  const [colIds, setColIds] = useState(
    collections.filter(c => item?._id && (c.items || []).some(i => String(i?._id || i) === String(item._id))).map(c => c._id));
  const [addonSearch, setAddonSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast('File too large. Max 5MB.', { type: 'error' });
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post('/upload', fd);
      set('image', data.url); // relative "/uploads/…" works on any domain
      toast('Image uploaded', { type: 'success' });
    } catch (err) {
      toast(err.response?.data?.error || 'Upload failed', { type: 'error' });
    } finally { setUploading(false); }
  };

  const byId = Object.fromEntries(allItems.map(i => [String(i._id), i]));
  const toggleAddonItem = (id) => setForm(f => ({ ...f, addonItems: f.addonItems.includes(id) ? f.addonItems.filter(x => x !== id) : [...f.addonItems, id] }));
  const addonChoices = allItems
    .filter(i => String(i._id) !== String(item?._id) && !form.addonItems.includes(String(i._id)))
    .filter(i => i.name.toLowerCase().includes(addonSearch.toLowerCase()))
    .sort((a, b) => (b.addonOnly ? 1 : 0) - (a.addonOnly ? 1 : 0) || a.name.localeCompare(b.name))
    .slice(0, 8);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast('Enter a name.', { type: 'error' });
    if (!(Number(form.price) > 0)) return toast('Enter a price above 0.', { type: 'error' });
    if (!form.category) return toast('Choose a category.', { type: 'error' });
    if (Number(form.discount) >= Number(form.price)) return toast('Discount must be less than the price.', { type: 'error' });

    setLoading(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        price: Math.round(Number(form.price) * 100),
        discount: Math.round(Number(form.discount || 0) * 100),
        addons: form.addons.filter(a => a.name.trim()).map(a => ({ name: a.name.trim(), price: Math.round(Number(a.price || 0) * 100) })),
      };
      const { data } = isNew
        ? await api.post('/admin/menu', payload)
        : await api.put(`/admin/menu/${item._id}/update`, payload);
      if (collections.length) await api.post(`/admin/menu/${data._id}/collections`, { ids: form.addonOnly ? [] : colIds });
      toast(isNew ? `“${data.name}” added to the menu` : 'Item updated', { type: 'success' });
      onSave(data);
    } catch (err) {
      toast(err.response?.data?.error || 'Could not save the item', { type: 'error' });
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/admin/menu/${item._id}`);
      toast(`“${item.name}” deleted`, { type: 'success' });
      onDelete?.(item);
    } catch (err) {
      toast(err.response?.data?.error || 'Delete failed', { type: 'error' });
      setLoading(false);
    }
  };

  const input = 'w-full bg-sunken border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand outline-none';
  const Toggle = ({ k, icon: Icon, label, hint }) => (
    <button type="button" onClick={() => set(k, !form[k])}
      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${form[k] ? 'border-brand bg-brand/5' : 'border-gray-800 hover:border-gray-700'}`}>
      <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${form[k] ? 'bg-brand border-brand' : 'border-gray-600'}`}>
        {form[k] && <svg viewBox="0 0 12 12" className="w-3 h-3 text-white"><path d="M2.5 6.5l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}
      </span>
      <span>
        <span className="text-sm text-white flex items-center gap-1.5">{Icon && <Icon className="w-3.5 h-3.5" />}{label}</span>
        <span className="text-[11px] text-gray-500">{hint}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:pt-12 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-gray-800 rounded-2xl w-full max-w-2xl p-6 mb-12" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{isNew ? 'New menu item' : 'Edit item'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Create a category first (for example “Burgers” or “Drinks”) using the <b className="text-white">Categories</b> button.</p>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
              <input autoFocus={isNew} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Beef Pilau" className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={input}>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Price (Ksh)</label>
                <input type="number" min="0" step="1" value={form.price} onChange={e => set('price', e.target.value)} placeholder="450" className={input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Discount (Ksh)</label>
                <input type="number" min="0" step="1" value={form.discount} onChange={e => set('discount', e.target.value)} placeholder="0" className={input} />
              </div>
            </div>
          </div>
          {Number(form.discount) > 0 && Number(form.price) > 0 && (
            <p className="text-xs text-gray-400 -mt-2">Customers pay <span className="text-white font-medium">Ksh {(Number(form.price) - Number(form.discount)).toLocaleString()}</span> (was Ksh {Number(form.price).toLocaleString()})</p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Photo</label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-700 bg-sunken flex items-center justify-center overflow-hidden shrink-0">
                {form.image ? <img src={form.image} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-600" />}
              </div>
              <div className="flex-1">
                <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-gray-700 text-sm font-medium cursor-pointer transition ${uploading ? 'bg-gray-800 text-gray-400' : 'bg-raised text-white hover:bg-raised2 hover:border-brand'}`}>
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Choose photo (max 5MB)</>}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
                <input value={form.image} onChange={e => set('image', e.target.value)} placeholder="…or paste an image link"
                  className="w-full bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 mt-2 focus:border-brand outline-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="What’s in it, portion size…" className={`${input} resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle k="isAvailable" label="In stock" hint="Customers can order it" />
            <Toggle k="addonOnly" icon={Puzzle} label="Add-on only" hint="Sold only as an extra on other dishes" />
          </div>

          {!form.addonOnly && collections.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2"><LayoutGrid className="w-3.5 h-3.5" /> Show in collections (home page rows)</label>
              <div className="flex flex-wrap gap-2">
                {collections.map(c => {
                  const on = colIds.includes(c._id);
                  return (
                    <button key={c._id} type="button" onClick={() => setColIds(ids => on ? ids.filter(x => x !== c._id) : [...ids, c._id])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${on ? 'bg-brand border-brand text-white' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                      {on ? '✓ ' : ''}{c.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!form.addonOnly && (
          <div className="pt-4 border-t border-gray-800">
            <label className="block text-xs font-medium text-gray-400 mb-1">Add-ons customers can choose</label>
            <p className="text-[11px] text-gray-500 mb-3">Pick from your menu items. Create extras like “Extra cheese” as a menu item first (tick <b className="text-gray-300">Add-on only</b>), then add them here. They’re charged at their own price.</p>

            {form.addonItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.addonItems.map(id => {
                  const a = byId[id];
                  return (
                    <span key={id} className="inline-flex items-center gap-2 bg-raised border border-gray-700 rounded-full pl-3 pr-1 py-1 text-xs text-white">
                      {a?.name || 'Removed item'} <span className="text-gray-400">Ksh {a ? (a.price - (a.discount || 0)) / 100 : 0}</span>
                      {a && !a.isAvailable && <span className="text-red-400">out</span>}
                      <button type="button" onClick={() => toggleAddonItem(id)} className="p-1 rounded-full hover:bg-gray-700 text-gray-400"><X className="w-3 h-3" /></button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={addonSearch} onChange={e => setAddonSearch(e.target.value)} placeholder="Search menu items to add as an extra…"
                className="w-full bg-sunken border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-brand" />
            </div>
            {addonChoices.length > 0 && (
              <div className="mt-1.5 border border-gray-800 rounded-lg divide-y divide-gray-800 max-h-48 overflow-y-auto">
                {addonChoices.map(i => (
                  <button key={i._id} type="button" onClick={() => toggleAddonItem(String(i._id))}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-raised">
                    <span className="text-gray-200">{i.name}{i.addonOnly && <span className="ml-2 text-[10px] text-sky-400">ADD-ON</span>}</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">Ksh {(i.price - (i.discount || 0)) / 100} <Plus className="w-3.5 h-3.5 text-brand" /></span>
                  </button>
                ))}
              </div>
            )}

            {form.addons.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
                <p className="text-[11px] text-amber-300 mb-2">Old typed-in extras. These still work, but create them as menu items and pick them above so they show in sales reports, then remove these.</p>
                {form.addons.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-300 py-1">
                    <span>{a.name} · Ksh {a.price}</span>
                    <button type="button" onClick={() => set('addons', form.addons.filter((_, j) => j !== i))} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-800">
            {!isNew && (confirmDelete ? (
              <span className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Delete for good?</span>
                <button type="button" onClick={handleDelete} disabled={loading} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold">Yes, delete</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-lg text-gray-300 text-xs">No</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /> Delete</button>
            ))}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-700 text-sm font-semibold text-white hover:bg-raised">Cancel</button>
              <button type="submit" disabled={loading || uploading} className="px-5 py-2.5 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover disabled:bg-gray-700">
                {loading ? 'Saving…' : isNew ? 'Add to menu' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
