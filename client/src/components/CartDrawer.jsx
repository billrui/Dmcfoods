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
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl transform transition-transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Your cart</h2>
          <button onClick={closeDrawer}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-180px)]">
          {items.length === 0 && <p className="text-center text-gray-500 py-10">Cart is empty</p>}
          {items.map(item => (
            <div key={item._id} className="flex gap-3">
              <img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt="" />
              <div className="flex-1">
                <h3 className="text-sm font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600">Ksh{item.price / 100}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setQty(item._id, item.quantity - 1)} className="w-6 h-6 rounded-full border flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm">{item.quantity}</span>
                  <button onClick={() => setQty(item._id, item.quantity + 1)} className="w-6 h-6 rounded-full border flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => remove(item._id)} className="ml-auto text-gray-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex justify-between mb-3 font-semibold">
            <span>Subtotal</span>
            <span>Ksh{total / 100}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { closeDrawer(); navigate('/checkout'); }}
            className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-300 text-white py-3 rounded-full font-semibold"
          >Checkout</button>
        </div>
      </aside>
    </>
  );
}
