import { ArrowLeft, Award, Gift, ShoppingBag, Loader2, Plus, Minus, RotateCcw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const ksh = (c) => `Ksh ${(Math.round(c) / 100).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
const TYPE = {
  earn:    { label: 'Earned',   icon: Plus,      cls: 'text-green-400 bg-green-500/10' },
  redeem:  { label: 'Used',     icon: Minus,     cls: 'text-amber-400 bg-amber-500/10' },
  refund:  { label: 'Returned', icon: RotateCcw, cls: 'text-sky-400 bg-sky-500/10' },
  reverse: { label: 'Removed',  icon: Minus,     cls: 'text-red-400 bg-red-500/10' },
  adjust:  { label: 'Adjusted', icon: Award,     cls: 'text-gray-300 bg-gray-500/10' },
};

export default function Loyalty() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['loyalty', 'me'],
    queryFn: () => api.get('/loyalty/me').then(r => r.data),
  });

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>;
  if (isError) return <p className="text-center text-gray-400 py-20">Could not load your points. Please try again.</p>;

  const { points, enabled, value, canRedeem, progress, history } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/profile" className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Loyalty points</h1>

      <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -mr-16 -mt-16" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3 opacity-90">
            <Award className="w-4 h-4" />
            <span className="text-xs font-medium tracking-wider">DMC FLAVOURS REWARDS</span>
          </div>
          <p className="text-5xl font-bold tabular-nums">{points.toLocaleString()}</p>
          <p className="text-sm opacity-90 mb-6">points{canRedeem && <> · worth <strong>{ksh(value)}</strong></>}</p>

          {enabled ? (
            canRedeem ? (
              <div className="bg-white/15 rounded-2xl p-3 flex items-center gap-3">
                <Gift className="w-6 h-6 shrink-0" />
                <p className="text-sm"><strong>You can redeem!</strong> Tick “Use my points” at checkout to take {ksh(value)} off your food.</p>
              </div>
            ) : (
              <>
                <div className="bg-white/25 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div className="bg-white h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs opacity-90">
                  {progress >= 75 ? 'Almost there! A few more orders to unlock your reward.' : 'Keep ordering to unlock your reward.'}
                </p>
              </>
            )
          ) : <p className="text-sm opacity-90">Points are paused at the moment.</p>}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">How it works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {[
          { icon: ShoppingBag, title: 'Order', text: 'Sign in and pay for your order with M-Pesa.' },
          { icon: Sparkles, title: 'Collect', text: 'Every paid order adds points to your balance.' },
          { icon: Gift, title: 'Redeem', text: 'When your reward unlocks, use your points at checkout to pay less.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white dark:bg-card rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <Icon className="w-5 h-5 text-brand mb-2" />
            <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{text}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">History</h2>
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 shadow-sm">
        {history.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No points yet. Your first order starts the count.</p>
        ) : history.map(t => {
          const T = TYPE[t.type] || TYPE.adjust;
          return (
            <div key={t._id} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${T.cls}`}><T.icon className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">{T.label}{t.note ? <span className="text-gray-500 dark:text-gray-400"> · {t.note}</span> : null}</p>
                <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${t.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`}>
                {t.points > 0 ? '+' : ''}{t.points.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 text-center mt-6">Points are added once your M-Pesa payment is confirmed. If an order is canceled, its points are undone.</p>
    </div>
  );
}
