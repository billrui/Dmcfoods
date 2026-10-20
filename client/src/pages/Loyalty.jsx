import { ArrowLeft, Award, Gift, TrendingUp, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const REWARDS = [
  { points: 500,  label: 'Free Plain Chips',       icon: '🍟' },
  { points: 1000, label: 'Free Single Beef Burger', icon: '🍔' },
  { points: 2000, label: 'Free SuperBowl',          icon: '🥗' },
  { points: 5000, label: 'Free TWIN COMBO',         icon: '🍗' },
];

export default function Loyalty() {
  const points = 340;
  const nextTier = 500;
  const progress = Math.min(100, (points / nextTier) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/profile"
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-6 dark:text-white">Loyalty points</h1>

      {/* Points card */}
      <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -mr-16 -mt-16" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3 opacity-90">
            <Award className="w-4 h-4" />
            <span className="text-xs font-medium tracking-wider">DMCFOODS REWARDS</span>
          </div>
          <p className="text-4xl font-bold mb-1">{points}</p>
          <p className="text-sm opacity-80 mb-6">points available</p>

          {/* Progress to next reward */}
          <div className="bg-white/20 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs opacity-90">
            {nextTier - points} more points to unlock <strong>Free Plain Chips</strong>
          </p>
        </div>
      </div>

      {/* How it works */}
      <h2 className="text-lg font-semibold mb-3 dark:text-white">How it works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {[
          { icon: TrendingUp, title: 'Earn', text: 'Get 1 point for every Ksh10 spent.' },
          { icon: Star,       title: 'Stack', text: 'Points never expire while your account is active.' },
          { icon: Gift,       title: 'Redeem', text: 'Redeem at checkout for free items.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <Icon className="w-5 h-5 text-brand mb-2" />
            <p className="font-semibold text-sm dark:text-white mb-1">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{text}</p>
          </div>
        ))}
      </div>

      {/* Rewards */}
      <h2 className="text-lg font-semibold mb-3 dark:text-white">Available rewards</h2>
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        {REWARDS.map(r => {
          const unlocked = points >= r.points;
          return (
            <div key={r.points} className="flex items-center gap-3 px-4 py-4">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${unlocked ? 'dark:text-white' : 'text-gray-400'}`}>
                  {r.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{r.points} points</p>
              </div>
              {unlocked ? (
                <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-950/40 px-3 py-1 rounded-full">
                  Unlocked
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  Locked
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Point earning and redemption coming soon.
      </p>
    </div>
  );
}
