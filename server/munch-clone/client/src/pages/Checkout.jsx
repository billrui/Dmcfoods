import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useCart } from '../store/cartStore';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [type, setType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const subtotalKsh = subtotal();
  const deliveryFee = type === 'delivery' ? 15000 : 0;
  const total = subtotalKsh + deliveryFee;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ menuItem: i._id, quantity: i.quantity })),
        address: { street, city },
        paymentMethod,
        type,
      };
      const { data } = await api.post('/orders', payload);
      clear();
      navigate(`/orders/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return <div className="max-w-lg mx-auto p-8 text-center text-gray-500">
      Cart is empty. <button onClick={() => navigate('/')} className="text-brand underline">Go shopping</button>
    </div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-brand">{error}</p>}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Order type</label>
          <div className="flex gap-2">
            {['delivery','pickup'].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 rounded-full border text-sm capitalize ${type === t ? 'bg-brand text-white border-brand' : 'border-gray-200'}`}>{t}</button>
            ))}
          </div>
        </div>
        {type === 'delivery' && (
          <>
            <input value={street} onChange={e => setStreet(e.target.value)} placeholder="Street address" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" required />
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" required />
          </>
        )}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Payment</label>
          <div className="flex gap-2">
            {[['cod','Cash on delivery'],['card','Card']].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setPaymentMethod(v)} className={`flex-1 py-2 rounded-full border text-sm ${paymentMethod === v ? 'bg-brand text-white border-brand' : 'border-gray-200'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>Ksh{subtotalKsh/100}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>Ksh{deliveryFee/100}</span></div>
          <div className="flex justify-between font-semibold text-base pt-2"><span>Total</span><span>Ksh{total/100}</span></div>
        </div>
        <button disabled={loading} className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-300 text-white py-3 rounded-full font-semibold">
          {loading ? 'Placing order…' : `Place order · Ksh${total/100}`}
        </button>
      </form>
    </div>
  );
}
