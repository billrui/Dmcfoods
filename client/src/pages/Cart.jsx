import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Plus, Minus, Sparkles, Tag, AlertCircle } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { useBranch, getBranchStatus, getBranchStatusText } from '../store/branchStore';
import { useToast } from '../store/toastStore';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import ProductCard from '../components/ProductCard.jsx';

export default function Cart() {
  const { items, setQty, remove, subtotal, promo: appliedPromo, setPromo: setAppliedPromo } = useCart();
  const toast = useToast(s => s.show);
  const { branch } = useBranch();
  const navigate = useNavigate();
  const [promo, setPromo] = useState(appliedPromo?.code || '');

  const isClosed = !branch || getBranchStatus(branch) === 'CLOSED';

  const { data: suggested = [] } = useQuery({
    queryKey: ['menu', 'popular'],
    queryFn: () => api.get('/menu?popular=true').then(r => r.data),
    enabled: items.length > 0,
  });

  const itemsTotal = subtotal(); // already includes add-ons
  const promoShort = !!appliedPromo && itemsTotal < (appliedPromo.minOrderValue || 0);
  const discount = !appliedPromo || promoShort ? 0 : Math.min(itemsTotal, appliedPromo.discountType === 'percentage'
    ? Math.round(itemsTotal * appliedPromo.discountValue / 100) : appliedPromo.discountValue);
  const total = itemsTotal - discount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-app py-20 text-center">
        <div className="w-20 h-20 bg-card border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🛒</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-white">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Browse the menu to add items.</p>
        <button onClick={() => navigate('/')} className="bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-full font-semibold transition">
          Browse menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app pb-32">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-card border border-gray-800 rounded-2xl p-5 shadow-sm">
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{branch?.name || 'DMC Foods'}</h2>
                    <p className="text-sm text-gray-400 mt-1">{branch?.address || 'Location'}</p>
                  </div>
                </div>
                <button onClick={() => navigate('/')} className="text-sm font-medium text-brand hover:underline">Change</button>
              </div>

              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-800">
                <div className="w-10 h-10 rounded-full bg-raised flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Estimated delivery time</p>
                  <h3 className="font-semibold text-white">40min - 50min</h3>
                  <p className="text-xs text-gray-500 mt-1">Delivery fee at checkout</p>
                </div>
              </div>

              <div className="space-y-5">
                {items.map(item => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-raised overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      
                      {/* Display Add-ons here */}
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-[11px] text-brand mt-0.5">
                          + {item.addons.map(a => a.name).join(', ')}
                        </p>
                      )}

                      <p className="text-sm font-semibold text-white mt-1">Ksh{(item.price * item.quantity) / 100}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-sunken border border-gray-700 rounded-lg px-2 py-1">
                          {/* FIXED: Using cartItemId instead of _id */}
                          <button onClick={() => setQty(item.cartItemId, item.quantity - 1)} className="p-1 text-white hover:text-brand">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-semibold text-white w-4 text-center">{item.quantity}</span>
                          <button onClick={() => setQty(item.cartItemId, item.quantity + 1)} className="p-1 text-white hover:text-brand">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {/* FIXED: Using cartItemId instead of _id */}
                        <button onClick={() => remove(item.cartItemId)} className="text-xs font-medium text-brand hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/')} className="w-full mt-6 py-3 border border-gray-700 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:bg-raised transition">
                <Sparkles className="w-4 h-4" /> Add more items
              </button>
            </div>

            <div className="pt-4">
              <h2 className="section-title mb-4">Frequently bought together</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {suggested.slice(0, 4).map(item => <ProductCard key={item._id} item={item} />)}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            
            <div className="bg-card border border-gray-800 rounded-2xl p-5 shadow-sm flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Promo code" value={promo} onChange={e => setPromo(e.target.value)} className="w-full bg-sunken border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white outline-none focus:border-brand" />
              </div>
              <button onClick={async () => {
                if (!promo) return;
                try {
                  const { data } = await api.post('/promos/validate', { code: promo, subtotal: itemsTotal });
                  setAppliedPromo(data);
                  toast('Promo applied successfully!', { type: 'success' });
                } catch (err) {
                  toast(err.response?.data?.error || 'Invalid code', { type: 'error' });
                }
              }} className="bg-brand/15 text-brand px-6 py-3 rounded-xl font-semibold text-sm hover:bg-brand/25 transition">
                Apply
              </button>
            </div>

            <div className="bg-card border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between text-sm text-gray-400"><span>Items (incl. add-ons)</span><span className="text-white font-medium">Ksh{itemsTotal / 100}</span></div>
              {appliedPromo && (
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span className="flex items-center gap-2">Promo <span className="text-green-400 font-semibold">{appliedPromo.code}</span>
                    <button onClick={() => { setAppliedPromo(null); setPromo(''); }} className="text-xs text-gray-500 hover:text-white underline">remove</button></span>
                  <span className="text-green-400 font-medium">(-) Ksh{discount / 100}</span>
                </div>
              )}
              {promoShort && <p className="text-xs text-amber-400">Add Ksh{(appliedPromo.minOrderValue - itemsTotal) / 100} more to use {appliedPromo.code}.</p>}
              <p className="text-[11px] text-gray-500">Delivery fee is added at checkout.</p>
              <div className="border-t border-gray-800 pt-4 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-brand text-lg">Ksh{total / 100}</span>
              </div>
            </div>

            {isClosed ? (
              <div className="bg-brand/10 border border-red-900/30 rounded-2xl p-5 text-center">
                <p className="text-sm text-brand font-medium mb-3">
                  <strong>{branch?.name || 'Branch'} is closed</strong> — {branch ? getBranchStatusText(branch).replace(/^Closed · /, '') : 'choose a branch'}.
                </p>
                <button disabled className="w-full bg-card border border-gray-800 text-gray-500 py-4 rounded-xl font-bold cursor-not-allowed">
                  Branch closed — checkout unavailable
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/checkout')} className="w-full bg-brand hover:bg-brand-hover text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand/20 transition">
                Proceed to checkout
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
