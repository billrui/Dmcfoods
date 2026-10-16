import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => api.get('/orders/my').then(r => r.data) });
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My orders</h1>
      {orders.length === 0 && <p className="text-gray-500">No orders yet.</p>}
      <div className="space-y-3">
        {orders.map(o => (
          <Link key={o._id} to={`/orders/${o._id}`} className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md">
            <div className="flex justify-between">
              <span className="font-medium">#{o._id.slice(-6).toUpperCase()}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{o.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{o.items.length} item(s) · Ksh{o.total/100}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(o.createdAt).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
