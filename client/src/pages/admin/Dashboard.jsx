import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, DollarSign, TrendingUp, Users, ChefHat, Truck, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import AdminLayout from '../../components/AdminLayout.jsx';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: recent } = useQuery({
    queryKey: ['admin', 'orders', 'recent'],
    queryFn: () => api.get('/admin/orders?limit=5').then(r => r.data),
    refetchInterval: 5000,
  });

  return (
    <AdminLayout title="Dashboard">
      {isLoading ? <p className="text-gray-500">Loading…</p> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Package}    label="Today's orders"  value={stats?.today.orders ?? 0} />
            <StatCard icon={DollarSign} label="Today's revenue" value={`Ksh${((stats?.today.revenue || 0) / 100).toLocaleString()}`} />
            <StatCard icon={TrendingUp} label="Pending"         value={stats?.today.pending ?? 0} accent />
            <StatCard icon={Users}      label="Total users"     value={stats?.allTime.users ?? 0} />
          </div>

          <div className="flex items-center justify-between mb-3 mt-10">
            <h2 className="text-sm font-semibold text-gray-400 tracking-wider">RECENT ORDERS</h2>
            <Link to="/dmc-console/orders" className="text-xs text-brand hover:underline">View all →</Link>
          </div>
          <div className="bg-card rounded-2xl border border-gray-800 overflow-hidden">
            {recent?.orders?.length === 0 ? (
              <p className="text-center py-8 text-gray-500 text-sm">No orders yet.</p>
            ) : (
              recent?.orders?.map(o => (
                <Link key={o._id} to={`/dmc-console/orders?id=${o._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-raised border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium">#{o._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{o.user?.name || 'Guest'} · {o.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">Ksh{o.total / 100}</p>
                    <p className="text-xs text-brand">{o.status}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`bg-card rounded-2xl p-5 border ${accent ? 'border-brand/40' : 'border-gray-800'}`}>
      <Icon className={`w-5 h-5 mb-3 ${accent ? 'text-brand' : 'text-gray-500'}`} />
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
