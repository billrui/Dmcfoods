import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, AlertOctagon, Info, Printer, Receipt, Wallet, ShoppingBag, TrendingUp, Loader2, Trophy,
} from 'lucide-react';
import api from '../../../lib/api';
import AdminLayout from '../../../components/AdminLayout.jsx';
import { ksh, todayStr, prettyDate, time, DatePicker, Segmented, Card } from './superUi.jsx';

const SEV = {
  high:   { icon: AlertOctagon,  cls: 'text-red-400 bg-red-500/10 ring-red-500/20', label: 'Needs checking' },
  medium: { icon: AlertTriangle, cls: 'text-amber-400 bg-amber-500/10 ring-amber-500/20', label: 'Follow up' },
  low:    { icon: Info,          cls: 'text-gray-400 bg-gray-500/10 ring-gray-500/20', label: 'Info' },
};

export default function SuperReport() {
  const [date, setDate] = useState(todayStr());
  const [days, setDays] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['super', 'report', date, days],
    queryFn: () => api.get('/super/report', { params: { date, days } }).then(r => r.data),
    refetchInterval: date === todayStr() ? 30000 : false,
  });

  const s = data?.summary;
  const period = days === 1 ? prettyDate(date) : `${days} days to ${prettyDate(date)}`;
  const maxSales = Math.max(1, ...(data?.timeline || []).map(t => t.sales));
  const maxQty = Math.max(1, ...(data?.topItems || []).map(t => t.quantity));
  const serious = (data?.problems || []).filter(p => p.severity !== 'low');

  return (
    <AdminLayout title="Daily report">
      <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
        <DatePicker value={date} onChange={setDate} />
        <Segmented value={days} onChange={setDays} options={[{ value: 1, label: 'Day' }, { value: 7, label: '7 days' }, { value: 30, label: '30 days' }]} />
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 text-sm text-gray-300 bg-card border border-gray-800 rounded-xl px-3.5 py-2.5 hover:text-white">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
      <p className="hidden print:block text-black text-lg font-bold mb-4">Daily report · {period}</p>

      {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-600" /></div>
      : isError ? <p className="text-red-400 text-sm">Could not load the report.</p>
      : (
        <div className="space-y-6">
          {/* ── Money check ── */}
          <Card className="overflow-hidden">
            <div className={`px-5 py-4 flex items-center gap-3 border-b border-gray-800 ${s.matches ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
              {s.matches
                ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                : <AlertOctagon className="w-6 h-6 text-red-400 shrink-0" />}
              <div className="min-w-0">
                <p className={`font-semibold ${s.matches ? 'text-green-400' : 'text-red-300'}`}>
                  {s.paidOrders === 0 && s.received === 0 ? 'No sales yet for this period'
                    : s.matches ? 'Money received matches sales'
                    : s.difference === 0 ? `Totals match, but ${serious.length} order${serious.length === 1 ? '' : 's'} need checking`
                    : `Difference of ${ksh(Math.abs(s.difference))} — ${s.difference < 0 ? 'less money received than sold' : 'more money received than sold'}`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{period}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-800">
              <Money icon={ShoppingBag} label="Sold (paid orders)" value={ksh(s.sold)} sub={`${s.paidOrders} order${s.paidOrders === 1 ? '' : 's'}`} />
              <Money icon={Wallet} label="Received on M-Pesa" value={ksh(s.received)} sub={s.failedPayments ? `${s.failedPayments} failed attempt${s.failedPayments === 1 ? '' : 's'}` : 'Confirmed by Safaricom'} />
              <Money icon={Receipt} label="Difference" value={(s.difference > 0 ? '+' : s.difference < 0 ? '−' : '') + ksh(Math.abs(s.difference))}
                tone={s.difference === 0 ? 'text-green-400' : 'text-red-300'} sub={s.difference === 0 ? 'Balanced' : 'Check the list below'} />
            </div>
          </Card>

          {/* ── Quick stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Stat label="All orders" value={s.orders} />
            <Stat label="Average order" value={ksh(s.averageOrder)} />
            <Stat label="Items sold" value={s.itemsSold} />
            <Stat label="Unpaid / canceled" value={`${s.pendingOrders} / ${s.canceledOrders}`} />
            <Stat label="Promo discounts given" value={`${ksh(s.discounts || 0)}${s.promoOrders ? ` · ${s.promoOrders} order${s.promoOrders === 1 ? '' : 's'}` : ''}`} />
          </div>

          {/* ── Problems ── */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Orders to check</h2>
              <span className="text-xs text-gray-500">{data.problems.length} found</span>
            </div>
            {data.problems.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">Nothing to check. Every paid order has a matching M-Pesa payment.</p>
            ) : data.problems.map((p, i) => {
              const S = SEV[p.severity];
              return (
                <div key={i} className="px-5 py-3.5 border-b border-gray-800 last:border-0 flex flex-wrap gap-3 items-start">
                  <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg ring-1 ${S.cls}`}>
                    <S.icon className="w-3.5 h-3.5" /> {S.label}
                  </span>
                  <div className="flex-1 min-w-[12rem]">
                    <p className="text-sm text-white">{p.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.orderId
                        ? <Link to={`/dmc-console/orders?id=${p.orderId}`} className="text-gray-300 hover:text-brand">#{p.ref}</Link>
                        : <span className="text-gray-300">{p.ref}</span>}
                      {' · '}{p.customer}{' · '}{time(p.at)}
                      {p.receipts?.length > 0 && <> · Receipt {p.receipts.join(', ')}</>}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-gray-400">Order <span className="text-white">{ksh(p.orderTotal)}</span></p>
                    <p className="text-gray-400">Paid <span className="text-white">{ksh(p.paid)}</span></p>
                  </div>
                </div>
              );
            })}
          </Card>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* ── Top items ── */}
            <Card className="lg:col-span-3">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold">Best-selling items</h2>
              </div>
              {data.topItems.length === 0 ? <p className="px-5 py-8 text-center text-sm text-gray-500">No items sold.</p> : (
                <div className="p-5 space-y-3.5">
                  {data.topItems.map((t, i) => (
                    <div key={t.name}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <p className="truncate"><span className="text-gray-500 tabular-nums w-6 inline-block">{i + 1}.</span>{t.name}</p>
                        <p className="shrink-0 tabular-nums"><span className="text-white font-semibold">{t.quantity}</span> <span className="text-gray-500 text-xs">sold · {ksh(t.revenue)}</span></p>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-gray-800 overflow-hidden ml-6">
                        <div className={`h-full rounded-full ${i === 0 ? 'bg-brand' : 'bg-brand/50'}`} style={{ width: `${(t.quantity / maxQty) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ── Sales over time ── */}
            <Card className="lg:col-span-2">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-semibold">{days === 1 ? 'Sales by hour' : 'Sales by day'}</h2>
              </div>
              <div className="p-5">
                <div className="flex items-end gap-[3px] h-40">
                  {data.timeline.map(t => (
                    <div key={t.label} className="flex-1 h-full flex flex-col justify-end group relative">
                      <div className={`rounded-t ${t.sales ? 'bg-brand' : 'bg-gray-800'} group-hover:bg-brand-hover`}
                        style={{ height: t.sales ? `${Math.max(4, (t.sales / maxSales) * 100)}%` : '2px' }} />
                      <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 z-10">
                        {t.label} · {ksh(t.sales)} · {t.orders} order{t.orders === 1 ? '' : 's'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                  <span>{data.timeline[0]?.label.slice(days === 1 ? 0 : 5)}</span>
                  <span>{data.timeline[Math.floor(data.timeline.length / 2)]?.label.slice(days === 1 ? 0 : 5)}</span>
                  <span>{data.timeline.at(-1)?.label.slice(days === 1 ? 0 : 5)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Money({ icon: Icon, label, value, sub, tone = 'text-white' }) {
  return (
    <div className="p-5">
      <p className="text-xs text-gray-500 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {label}</p>
      <p className={`text-2xl font-bold mt-1.5 tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold mt-1 tabular-nums">{value}</p>
    </Card>
  );
}
