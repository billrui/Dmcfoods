import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartStore';

export default function CartDrawer() {
  const { items, setQty, remove, subtotal, drawerOpen, closeDrawer } = useCart();
  const navigate = useNavigate();
  const total = subtotal();

  return (
    <>
      {drawerOpen && <div onClick={closeDrawer} className="fixed inset-0 bg-black/40 z-40" />}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-card z-50 shadow-xl transform transition-transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-white">Your cart</h2>
          <button onClick={closeDrawer}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-180px)]">
          {items.length === 0 && <p className="text-center text-gray-500 py-10">Cart is empty</p>}
          {items.map(item => (
            <div key={item.cartItemId} className="flex gap-3">
              <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-gray-800" alt="" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">{item.name}</h3>
                {item.addons && item.addons.length > 0 && (
                  <p className="text-[10px] text-brand">{item.addons.map(a=>a.name).join(', ')}</p>
                )}
                <p className="text-sm text-gray-400">Ksh{item.price / 100}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setQty(item.cartItemId, item.quantity - 1)} className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center text-white"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm text-white">{item.quantity}</span>
                  <button onClick={() => setQty(item.cartItemId, item.quantity + 1)} className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center text-white"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => remove(item.cartItemId)} className="ml-auto text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-card">
          <div className="flex justify-between mb-3 font-semibold text-white">
            <span>Subtotal</span>
            <span>Ksh{total / 100}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { closeDrawer(); navigate('/checkout'); }}
            className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-700 text-white py-3 rounded-full font-semibold"
          >Checkout</button>
        </div>
      </aside>
    </>
  );
}
