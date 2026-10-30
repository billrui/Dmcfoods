import { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../store/toastStore';
import api from '../lib/api';

export default function AddressModal({ open, onClose, initialData, onSave }) {
  const { user } = useAuth();
  const toast = useToast(s => s.show);
  
  const [form, setForm] = useState({
    name: initialData?.name || user?.name || '',
    phone: initialData?.phone || user?.phone?.replace('+254', '') || '',
    address: initialData?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Fetch available delivery zones
  const { data: zones = [] } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => api.get('/delivery-zones').then(r => r.data),
  });

  // Auto-detect location using browser API
  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser', { type: 'error' });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // In a real production app, you would use a Reverse Geocoding API here
        // (e.g., Google Maps API or OpenStreetMap Nominatim) to convert coordinates to an address.
        // Since we don't have API keys, we will simulate finding the nearest zone.
        
        const { latitude, longitude } = position.coords;
        
        // Simulate API delay for reverse geocoding
        await new Promise(r => setTimeout(r, 1500)); 

        // Simulate finding the closest zone (just pick the first one for demo)
        const nearestZone = zones[0]?.name || 'Kericho Town';
        
        setForm(prev => ({ 
          ...prev, 
          address: `${nearestZone} (Auto-detected)` 
        }));
        
        toast('Location detected successfully!', { type: 'success' });
        setLocating(false);
      },
      (error) => {
        console.error(error);
        toast('Could not get your location. Please enable GPS.', { type: 'error' });
        setLocating(false);
      },
      { timeout: 10000 } // 10 seconds timeout
    );
  };

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      toast('Please fill all fields.', { type: 'error' });
      return;
    }

    setSaving(true);
    try {
      // Save to DB if needed
      await new Promise(r => setTimeout(r, 500));
      
      onSave(form);
      toast('Delivery info updated', { type: 'success' });
      onClose();
    } catch (err) {
      toast('Failed to update info', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Update Delivery Info</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-sunken border border-gray-700 rounded-xl outline-none text-white focus:border-brand"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-sunken border border-gray-700 rounded-xl">
                <span className="text-sm text-gray-400 font-medium">+254</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0,9) })}
                placeholder="712345678"
                className="flex-1 px-4 py-3 bg-sunken border border-gray-700 rounded-xl outline-none text-white focus:border-brand"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-400">Delivery Address</label>
              <button 
                type="button" 
                onClick={handleLocate}
                disabled={locating}
                className="text-xs text-brand hover:text-brand-hover flex items-center gap-1 font-medium"
              >
                {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
                {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>
            
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-500 absolute left-4 top-3" />
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 34 Sosiot, Kericho"
                className="w-full pl-11 pr-4 py-3 bg-sunken border border-gray-700 rounded-xl outline-none text-white focus:border-brand"
                required
              />
            </div>
            
            {/* Quick select zones */}
            {zones.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {zones.slice(0, 3).map(z => (
                  <button
                    key={z._id}
                    type="button"
                    onClick={() => setForm({ ...form, address: z.name })}
                    className="text-[10px] bg-raised text-gray-300 px-2 py-1 rounded hover:bg-brand hover:text-white transition"
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-white font-semibold hover:bg-raised">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Info'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
