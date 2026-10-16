import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import api from '../lib/api';

const STEPS = ['CREATED','PAID','PREPARING','READY','DELIVERING','COMPLETED'];

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Not found</div>;

  const currentIdx = STEPS.indexOf(order.status);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link to="/orders" className="text-sm text-gray-600 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> My orders
      </Link>
      <h1 className="text-2xl font-bold mb-1">Order #{order._id.slice(-6).toUpperCase()}</h1>
      <p className="text-sm text-gray-500 mb-6">{new Date(order.createdAt).toLocaleString()}</p>
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <Check className="w-4 h-4" /> : <span className="text-xs">{i + 1}</span>}
                </div>
                <span className={`text-sm ${done ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
        <h2 className="font-semibold mb-3">Items</h2>
        <div className="space-y-2 text-sm">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{i.quantity} × {i.name}</span>
              <span>Ksh{(i.price * i.quantity)/100}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-3 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>Ksh{order.subtotal/100}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>Ksh{order.deliveryFee/100}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>Ksh{order.total/100}</span></div>
        </div>
      </div>
    </div>
  );
}
