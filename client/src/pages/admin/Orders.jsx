import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';
import AdminOrderModal from '../../components/AdminOrderModal.jsx';

const TABS = ['CREATED', 'PAID', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELED', 'ALL'];

export default function Orders() {
  const [tab, setTab] = useState('CREATED');
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', tab],
    queryFn: () => api.get(`/admin/orders?status=${tab}`).then(r => r.data),
    refetchInterval: 5000,
  });

  const orders = data?.orders || [];

  const handleUpdate = (updated) => {
    setSelected(updated);
    qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  return (
    <AdminLayout title="Orders">
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${tab === t ? 'bg-brand text-white' : 'bg-[#1A1D21] text-gray-400 border border-gray-800 hover:border-brand/50'}`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-gray-500 py-12 text-center">Loading…</p> : orders.length === 0 ? (
        <div className="bg-[#1A1D21] rounded-2xl p-12 text-center border border-gray-800">
          <Package className="w-8 h-8 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500">No orders with status <strong>{tab}</strong>.</p>
        </div>
      ) : (
        <div className="bg-[#1A1D21] rounded-2xl border border-gray-800 overflow-hidden">
          {orders.map(o => (
            <button key={o._id} onClick={() => setSelected(o)} className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-[#23272B] border-b border-gray-800 last:border-0 transition">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">#{o._id.slice(-6).toUpperCase()}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">{o.status}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{o.user?.name || 'Guest'} · {o.items.length} item(s) · {new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-sm font-semibold ml-4 shrink-0">Ksh{o.total / 100}</span>
            </button>
          ))}
        </div>
      )}

      <AdminOrderModal order={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
    </AdminLayout>
  );
}
