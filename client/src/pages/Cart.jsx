import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartStore';

export default function Cart() {
  const { items, setQty, remove, subtotal } = useCart();
  const navigate = useNavigate();
  const total = subtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Cart</h1>
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm p-12 text-center">
          <ShoppingBag className="w-8 h-8 mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-bold mb-2 dark:text-white">Your cart is empty</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Browse the menu to add items.
          </p>
          <Link
            to="/"
            className="inline-block bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-full font-semibold text-sm"
          >
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Cart</h1>
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm p-4 space-y-4">
        {items.map(item => (
          <div key={item._id} className="flex gap-3">
            <img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt="" />
            <div className="flex-1">
              <h3 className="text-sm font-medium dark:text-white">{item.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ksh{item.price / 100}</p>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => setQty(item._id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center dark:text-white">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm dark:text-white">{item.quantity}</span>
                <button onClick={() => setQty(item._id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center dark:text-white">
                  <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => remove(item._id)} className="ml-auto text-gray-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between mb-3 font-semibold dark:text-white">
            <span>Subtotal</span>
            <span>Ksh{total / 100}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
