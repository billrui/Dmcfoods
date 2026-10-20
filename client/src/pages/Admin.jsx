import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, Package, Users, DollarSign, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import AdminOrderModal from '../components/AdminOrderModal.jsx';

const TABS = ['CREATED', 'PAID', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELED', 'ALL'];

export default function Admin() {
  const [tab, setTab] = useState('CREATED');
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 10000,
  });

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
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to store
      </Link>

      <h1 className="text-3xl font-bold mb-6 dark:text-white">Admin dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat icon={Package}    label="Today's orders"   value={stats?.today.orders ?? '—'} />
        <Stat icon={DollarSign} label="Today's revenue"  value={stats ? `Ksh${(stats.today.revenue / 100).toLocaleString()}` : '—'} />
        <Stat icon={TrendingUp} label="Pending"          value={stats?.today.pending ?? '—'} />
        <Stat icon={Users}      label="Total users"      value={stats?.allTime.users ?? '—'} />
      </div>

      {/* Top items */}
      {stats?.topItems?.length > 0 && (
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
          <h2 className="text-sm font-semibold mb-3 dark:text-white">Top items (all time)</h2>
          <div className="flex flex-wrap gap-2">
            {stats.topItems.map(t => (
              <span key={t.name} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#23272B] dark:text-gray-300">
                {t.name} <span className="text-gray-400">×{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              tab === t
                ? 'bg-brand text-white'
                : 'bg-white dark:bg-[#1A1D21] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <p className="text-center py-12 text-gray-500">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800">
          <Package className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No orders with status <strong>{tab}</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <button
              key={o._id}
              onClick={() => setSelected(o)}
              className="w-full text-left bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-brand transition"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold dark:text-white">
                  #{o._id.slice(-6).toUpperCase()}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  o.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                  : o.status === 'CANCELED' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                  : 'bg-brand/10 text-brand'
                }`}>
                  {o.status}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{o.user?.name || 'Guest'} · {o.items.length} item(s)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Ksh{o.total / 100}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(o.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      <AdminOrderModal
        order={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <Icon className="w-5 h-5 text-brand mb-2" />
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold dark:text-white">{value}</p>
    </div>
  );
}
