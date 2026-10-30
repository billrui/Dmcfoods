import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { X, Heart, Plus, Minus, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartStore';
import { useFavourites } from '../store/favouritesStore';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../store/toastStore';

export default function ProductDetailModal({ item, open, onClose }) {
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const addToCart = useCart(s => s.add);
  const hasFav = useFavourites(s => item ? s.has(item._id) : false);
  const toggleFav = useFavourites(s => s.toggle);

  const { user } = useAuth();
  const toast = useToast(s => s.show);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQty(1);
      setSelectedAddons([]);
    }
  }, [open, item?._id]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || !item) return null;

  const basePrice = item.price - (item.discount || 0);
  const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const totalPerItem = basePrice + addonsPrice;
  const totalPrice = totalPerItem * qty;


  const toggleAddon = (addon) => {
    setSelectedAddons(prev =>
      prev.some(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const handleFav = () => {
    if (!user) {
      toast('Please log in to save favourites.', { type: 'info' });
      onClose();
      navigate('/login');
      return;
    }
    toggleFav(item);
  };

  const handleAddToCart = () => {
    // We pass the item, the selected addons, and the quantity
    addToCart(item, selectedAddons, qty);
    toast(`${qty} × ${item.name} added.`, { type: 'success' });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-sunken w-full max-w-lg h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image area */}
        <div className="relative h-64 shrink-0 bg-gray-800">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />

          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition"
          >
            ← Back
          </button>

          <button
            onClick={handleFav}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-md p-2 rounded-full transition"
          >
            <Heart className={`w-5 h-5 ${hasFav ? 'text-brand fill-brand' : 'text-white'}`} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
            <div className="flex items-center gap-3">
              {item.discount > 0 && (
                <span className="text-gray-500 line-through text-sm">Ksh{item.price / 100}</span>
              )}
              <span className="text-xl font-bold text-white">Ksh{basePrice / 100}</span>
              {item.discount > 0 && (
                <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded">
                  Ksh{item.discount / 100} OFF
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Description</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {item.description || `Delicious ${item.name.toLowerCase()} prepared fresh. Perfect for a quick bite.`}
            </p>
          </div>

          {item.addons && item.addons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Add-ons</h3>
              <div className="bg-card border border-gray-800 rounded-2xl p-2 space-y-1">
                {item.addons.map(addon => {
                  const isSelected = selectedAddons.some(a => a.name === addon.name);
                  return (
                    <label
                      key={addon.name}
                      className="flex items-center justify-between p-3 hover:bg-raised rounded-xl cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAddon(addon)}
                          className="w-4 h-4 rounded border-gray-600 bg-transparent text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-gray-200">{addon.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-400">Ksh{addon.price / 100}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-brand/10 border border-brand/20 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-brand flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-brand" />
              Earn loyalty points with this order
            </span>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-gray-800 bg-sunken shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-400">Total</span>
            <div className="flex items-center gap-2">
              {selectedAddons.length > 0 && (
                <span className="text-xs text-gray-500 line-through">Ksh{(basePrice * qty) / 100}</span>
              )}
              <span className="text-xl font-bold text-white">Ksh{totalPrice / 100}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-card border border-gray-700 rounded-full px-2 py-1 shrink-0">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-raised text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-4 text-center font-semibold text-white">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-8 h-8 rounded-full bg-brand flex items-center justify-center hover:bg-brand-hover text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-bold text-sm shadow-lg shadow-brand/20 transition"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
