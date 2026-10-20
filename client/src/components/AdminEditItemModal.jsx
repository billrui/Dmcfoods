import { useState } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../store/toastStore';

export default function AdminEditItemModal({ item, onClose, onSave }) {
  const toast = useToast(s => s.show);
  const [form, setForm] = useState({
    name: item.name,
    price: item.price / 100,
    image: item.image,
    description: item.description || '',
    addons: item.addons || [],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ─── Image Upload Handler ───
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast('File too large. Max 5MB.', { type: 'error' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // The backend returns e.g. "/uploads/1698765-image.jpg"
      // We need to prepend the server base URL so the browser can display it
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const fullUrl = `${baseUrl}${data.url}`;
      
      setForm({ ...form, image: fullUrl });
      toast('Image uploaded successfully', { type: 'success' });
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.error || 'Upload failed', { type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleAddonChange = (index, field, value) => {
    const newAddons = [...form.addons];
    newAddons[index][field] = value;
    setForm({ ...form, addons: newAddons });
  };

  const addAddonRow = () => {
    setForm({ ...form, addons: [...form.addons, { name: '', price: 0 }] });
  };

  const removeAddonRow = (index) => {
    const newAddons = form.addons.filter((_, i) => i !== index);
    setForm({ ...form, addons: newAddons });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Math.round(form.price * 100),
        addons: form.addons.map(a => ({
          name: a.name,
          price: Math.round(a.price * 100),
        })),
      };
      
      const { data } = await api.put(`/admin/menu/${item._id}/update`, payload);
      toast('Item updated successfully', { type: 'success' });
      onSave(data);
    } catch (err) {
      toast('Failed to update item', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:pt-12 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl w-full max-w-2xl p-6 mb-12" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Item</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Price (Ksh)</label>
              <input type="number" step="1" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand outline-none" required />
            </div>
          </div>

          {/* IMAGE UPLOAD SECTION */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Item Image</label>
            <div className="flex gap-4 items-start">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-700 bg-[#14171A] flex items-center justify-center overflow-hidden shrink-0">
                {form.image ? (
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                )}
              </div>
              
              {/* Upload Button */}
              <div className="flex-1">
                <label className={`
                  flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-gray-700 text-sm font-medium cursor-pointer transition
                  ${uploading ? 'bg-gray-800 text-gray-400' : 'bg-[#23272B] text-white hover:bg-[#333] hover:border-brand'}
                `}>
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Choose Image (Max 5MB)</>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
                <p className="text-[10px] text-gray-500 mt-2">
                  Or paste a URL below:
                </p>
                <input 
                  type="url" 
                  value={form.image} 
                  onChange={e => setForm({...form, image: e.target.value})} 
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 mt-1 focus:border-brand outline-none" 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full bg-[#14171A] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand outline-none resize-none" />
          </div>

          {/* Add-ons Editor */}
          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-medium text-gray-400">Add-ons / Dips</label>
              <button type="button" onClick={addAddonRow} className="text-xs text-brand hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Add-on
              </button>
            </div>
            
            {form.addons.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No add-ons configured for this item.</p>
            ) : (
              <div className="space-y-2">
                {form.addons.map((addon, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input type="text" placeholder="Add-on name" value={addon.name} onChange={e => handleAddonChange(idx, 'name', e.target.value)} className="flex-1 bg-[#14171A] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none" required />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Ksh</span>
                      <input type="number" value={addon.price} onChange={e => handleAddonChange(idx, 'price', e.target.value)} className="w-full bg-[#14171A] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white outline-none" required />
                    </div>
                    <button type="button" onClick={() => removeAddonRow(idx)} className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-950/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-700 text-sm font-semibold text-white hover:bg-[#23272B]">Cancel</button>
            <button type="submit" disabled={loading || uploading} className="px-5 py-2.5 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover disabled:bg-gray-700">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
