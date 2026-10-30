import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShoppingBag, Wallet, XCircle, Search, Loader2, LogIn } from 'lucide-react';
import api from '../../../lib/api';
import AdminLayout from '../../../components/AdminLayout.jsx';
import { ksh, todayStr, prettyDate, time, DatePicker, Segmented, Card } from './superUi.jsx';

const ID = /[a-f0-9]{24}/i;
const short = (s) => (s || '').toString().slice(-6).toUpperCase();

// Turn raw log actions into plain sentences
function describe(e) {
  if (e.kind === 'order') return `placed order #${e.target} (${ksh(e.amount)})`;
  if (e.kind === 'payment') return e.action === 'payment-received'
    ? `paid ${ksh(e.amount)} by M-Pesa${e.target ? ` for order #${e.target}` : ''}`
    : `M-Pesa payment failed${e.target ? ` for order #${e.target}` : ''}`;

  const a = e.action || '';
  const named = {
    'admin-login': 'signed in to the console',
    'admin-login-failed': 'failed to sign in (wrong password)',
    'admin-setup': 'created the first admin account',
    'password-changed': 'changed their password',
    'advance-order': `moved order #${short(e.target)} to the next status`,
    'cancel-order': `canceled order #${short(e.target)}`,
    'toggle-admin': 'changed a user’s admin access',
    'reset-password': 'reset a user’s password',
  };
  if (named[a]) return named[a];

  const [method, path = ''] = a.split(' ');
  const parts = path.split('/').filter(Boolean);
  const id = parts.find(p => ID.test(p));
  const thing = parts.find(p => !ID.test(p)) || 'item';
  const last = parts.at(-1);
  const nice = {
    menu: 'menu item', users: 'user', branches: 'branch', 'delivery-zones': 'delivery zone',
    promos: 'promo code', collections: 'collection', orders: 'order', admins: 'admin account', upload: 'image',
  }[thing] || thing.replace(/-/g, ' ');
  const ref = id ? ` #${short(id)}` : '';

  if (thing === 'admins' && method === 'POST' && !id) return `created admin account for ${e.details?.name || e.details?.phone || 'a new admin'}`;
  if (last === 'reset-password') return `reset the password of ${nice}${ref}`;
  if (last === 'remove') return `removed admin access from${ref}`;
  if (last === 'toggle') return `turned ${nice}${ref} on/off`;
  if (last === 'price') return `changed the price of ${nice}${ref}${e.details?.price != null ? ` to ${ksh(e.details.price)}` : ''}`;
  if (last === 'ban') return `banned ${nice}${ref}`;
  if (thing === 'upload') return 'uploaded an image';
  if (method === 'DELETE') return `deleted ${nice}${ref}`;
  if (method === 'POST' && !id) return `created a ${nice}${e.details?.name ? ` “${e.details.name}”` : e.details?.code ? ` “${e.details.code}”` : ''}`;
  if (method === 'PUT' || method === 'PATCH' || last === 'update') return `edited ${nice}${ref}${e.details?.name ? ` (${e.details.name})` : ''}`;
  return `${method?.toLowerCase()} ${path}`;
}

const STYLE = {
  admin:   { icon: ShieldCheck, cls: 'bg-blue-500/10 text-blue-400' },
  order:   { icon: ShoppingBag, cls: 'bg-brand/10 text-brand' },
  payment: { icon: Wallet,      cls: 'bg-green-500/10 text-green-400' },
};

export default function SuperActivity() {
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['super', 'activity', date],
    queryFn: () => api.get('/super/activity', { params: { date } }).then(r => r.data),
    refetchInterval: date === todayStr() ? 15000 : false,
  });

  const events = useMemo(() => {
    let list = (data?.events || []).map(e => ({ ...e, text: describe(e) }));
    if (type !== 'all') list = list.filter(e => e.kind === type);
    const t = q.trim().toLowerCase();
    if (t) list = list.filter(e => `${e.actor} ${e.actorPhone || ''} ${e.text} ${e.details?.receipt || ''} ${e.details?.items || ''}`.toLowerCase().includes(t));
    return list;
  }, [data, type, q]);

  // group by hour
  const groups = useMemo(() => {
    const g = [];
    for (const e of events) {
      const h = time(e.at).slice(0, 2) + ':00';
      if (!g.length || g.at(-1).hour !== h) g.push({ hour: h, items: [] });
      g.at(-1).items.push(e);
    }
    return g;
  }, [events]);

  const c = data?.counts || {};

  return (
    <AdminLayout title="Activity log">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DatePicker value={date} onChange={setDate} />
        <Segmented value={type} onChange={setType} options={[
          { value: 'all', label: `All ${(c.admin || 0) + (c.order || 0) + (c.payment || 0)}` },
          { value: 'admin', label: `Staff ${c.admin || 0}` },
          { value: 'order', label: `Orders ${c.order || 0}` },
          { value: 'payment', label: `Payments ${c.payment || 0}` },
        ]} />
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, phone, receipt…"
            className="w-full bg-card border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand" />
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-6">{prettyDate(date)} · newest first</p>

      {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-600" /></div>
      : groups.length === 0 ? <Card className="p-10 text-center text-sm text-gray-500">Nothing happened on this day{q && ' matching your search'}.</Card>
      : (
        <div className="space-y-6">
          {groups.map(g => (
            <div key={g.hour}>
              <p className="text-xs font-semibold text-gray-500 mb-2 tabular-nums">{g.hour}</p>
              <Card className="overflow-hidden">
                {g.items.map(e => {
                  const failed = e.action === 'payment-failed' || e.action === 'admin-login-failed';
                  const St = failed ? { icon: XCircle, cls: 'bg-red-500/10 text-red-400' }
                    : e.action === 'admin-login' ? { icon: LogIn, cls: STYLE.admin.cls } : STYLE[e.kind];
                  return (
                    <div key={e.id} className="flex gap-3 px-4 py-3 border-b border-gray-800 last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${St.cls}`}><St.icon className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          <span className="text-white font-medium">{e.actor}</span> {e.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {time(e.at)}
                          {e.actorPhone && e.actorPhone !== e.actor && ` · ${e.actorPhone}`}
                          {e.details?.items && ` · ${e.details.items}`}
                          {e.details?.receipt && ` · Receipt ${e.details.receipt}`}
                          {e.details?.reason && ` · ${e.details.reason}`}
                          {e.kind === 'order' && e.details?.status && ` · now ${e.details.status.toLowerCase()}`}
                        </p>
                      </div>
                      {e.kind === 'admin' && <span className="hidden sm:block text-[10px] font-semibold text-blue-400/80 self-start mt-1">STAFF</span>}
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
