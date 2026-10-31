import { useState } from 'react';
import { ArrowLeft, Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../store/toastStore';

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'credit', label: 'Top-up',         amount: 50000, date: 'Oct 12, 2026' },
  { id: 2, type: 'debit',  label: 'Order #A4F2C1',  amount: 39000, date: 'Oct 11, 2026' },
  { id: 3, type: 'credit', label: 'Refund #8B1D',   amount: 18000, date: 'Oct 08, 2026' },
];

export default function Wallet() {
  const toast = useToast(s => s.show);
  const [balance] = useState(29000);   // Ksh290

  const soon = () => toast('Top-up — coming soon.', { type: 'info' });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/profile"
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-6 dark:text-white">Wallet</h1>

      {/* Balance card */}
      <div className="relative bg-gradient-to-br from-brand to-brand-hover rounded-3xl p-6 text-white shadow-lg mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-12 -mb-12" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3 opacity-90">
            <WalletIcon className="w-4 h-4" />
            <span className="text-xs font-medium tracking-wider">DMC FLAVOURS WALLET</span>
          </div>
          <p className="text-4xl font-bold mb-1">Ksh{balance / 100}</p>
          <p className="text-sm opacity-80 mb-6">Available balance</p>
          <button
            onClick={soon}
            className="inline-flex items-center gap-2 bg-white text-brand font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-gray-100 transition"
          >
            <Plus className="w-4 h-4" /> Top up
          </button>
        </div>
      </div>

      {/* Transactions */}
      <h2 className="text-lg font-semibold mb-3 dark:text-white">Recent activity</h2>
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        {MOCK_TRANSACTIONS.map(t => {
          const isCredit = t.type === 'credit';
          const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isCredit ? 'bg-green-100 dark:bg-green-950/40' : 'bg-red-100 dark:bg-red-950/40'
              }`}>
                <Icon className={`w-4 h-4 ${isCredit ? 'text-green-600' : 'text-brand'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium dark:text-white">{t.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.date}</p>
              </div>
              <span className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-brand'}`}>
                {isCredit ? '+' : '-'} Ksh{t.amount / 100}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Top-up and payment integration coming soon.
      </p>
    </div>
  );
}
