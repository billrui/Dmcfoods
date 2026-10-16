#!/usr/bin/env bash
set -e
[ -d src/components ] || { echo "❌ Run from client/"; exit 1; }

echo "🍔 Polishing MenuDrawer…"

cat > src/components/MenuDrawer.jsx <<'EOF'
import {
  User, ShoppingBag, MapPin, Heart, Wallet, Award,
  HelpCircle, Shield, FileText, LogOut, ChevronRight, X, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../store/toastStore';

const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white dark:bg-[#1A1D21] rounded-2xl py-5 flex flex-col items-center gap-2 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition"
  >
    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{label}</span>
  </button>
);

const Row = ({ icon: Icon, label, danger, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#23272B] transition"
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${danger ? 'text-brand' : 'text-gray-500 dark:text-gray-400'}`} />
      <span className={`text-sm font-medium ${danger ? 'text-brand' : 'dark:text-white'}`}>
        {label}
      </span>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-400" />
  </button>
);

export default function MenuDrawer({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast(s => s.show);

  const go = (path) => { onClose(); navigate(path); };
  const soon = (what) => () => { toast(`${what} — coming soon.`, { type: 'info' }); };

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-[#0F1114] z-50 shadow-xl transform transition-transform overflow-y-auto
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-base text-gray-800 dark:text-gray-100 flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="w-5 h-5" /> Menu
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#23272B]"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* User card */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gray-100 dark:bg-[#23272B] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-semibold dark:text-white">{user?.name || 'Guest'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email || 'Sign in to order'}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            <QuickAction icon={Heart}  label="Favourite"     onClick={() => go('/favourites')} />
            <QuickAction icon={Wallet} label="Wallet"        onClick={soon('Wallet')} />
            <QuickAction icon={Award}  label="Loyalty point" onClick={soon('Loyalty point')} />
          </div>

          {/* GENERAL */}
          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 tracking-wider">GENERAL</p>
            <Row icon={User}        label="Profile"    onClick={() => go('/profile')} />
            <Row icon={ShoppingBag} label="My orders"  onClick={() => go('/orders')} />
            <Row icon={MapPin}      label="My address" onClick={() => go('/profile')} />
          </div>

          {/* MENU MORE */}
          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 tracking-wider">MENU MORE</p>
            <Row icon={HelpCircle} label="Help & support"     onClick={soon('Help & support')} />
            <Row icon={Shield}     label="Privacy policy"     onClick={soon('Privacy policy')} />
            <Row icon={FileText}   label="Terms & conditions" onClick={soon('Terms & conditions')} />
            <Row
              icon={LogOut}
              label="Logout"
              danger
              onClick={() => { logout(); onClose(); navigate('/login'); }}
            />
          </div>

          <p className="text-center text-xs text-gray-400 pt-2">Version 0.1.0</p>
        </div>
      </aside>
    </>
  );
}
EOF

echo "✅ Updated: src/components/MenuDrawer.jsx"
echo ""
echo "Hard refresh the browser."
