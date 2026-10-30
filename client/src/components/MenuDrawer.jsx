import {
  User, ShoppingBag, MapPin, Heart, Wallet, Award,
  HelpCircle, Shield, FileText, LogOut, ChevronRight, X, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="bg-white dark:bg-card rounded-2xl py-4 flex flex-col items-center gap-2 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition">
    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">{label}</span>
  </button>
);

const Row = ({ icon: Icon, label, danger, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-raised transition">
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${danger ? 'text-brand' : 'text-gray-500 dark:text-gray-400'}`} />
      <span className={`text-sm font-medium ${danger ? 'text-brand' : 'dark:text-white'}`}>{label}</span>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-400" />
  </button>
);

export default function MenuDrawer({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const go = (path) => { onClose(); navigate(path); };

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-page dark:bg-app z-[101] shadow-xl transform transition-transform overflow-y-auto ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="text-base text-gray-800 dark:text-gray-100 flex items-center gap-2 font-medium">
              <ArrowLeft className="w-5 h-5" /> Menu
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-raised"><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gray-100 dark:bg-raised rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-semibold dark:text-white text-sm">{user?.name || 'Guest'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.phone || user?.email || 'Sign in to order'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <QuickAction icon={Heart}      label="Favourite"     onClick={() => go('/favourites')} />
            <QuickAction icon={Wallet} label="Wallet"        onClick={() => go('/wallet')} />
            <QuickAction icon={Award}      label="Loyalty point" onClick={() => go('/loyalty')} />
          </div>

          <div className="bg-white dark:bg-card rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 tracking-wider">GENERAL</p>
            <Row icon={User}        label="Profile"    onClick={() => go('/profile')} />
            <Row icon={ShoppingBag} label="My orders"  onClick={() => go('/orders')} />
            <Row icon={MapPin}      label="My address" onClick={() => go('/profile')} />
          </div>

          <div className="bg-white dark:bg-card rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 tracking-wider">MENU MORE</p>
            <Row icon={HelpCircle} label="Help & support"     onClick={() => go('/help')} />
            <Row icon={Shield}     label="Privacy policy"     onClick={() => go('/privacy')} />
            <Row icon={FileText}   label="Terms & conditions" onClick={() => go('/terms')} />
            <Row icon={LogOut}     label="Logout" danger onClick={() => { logout(); onClose(); navigate('/login'); }} />
          </div>

          <p className="text-center text-xs text-gray-400 pt-2">Version 0.1.0</p>
        </div>
      </aside>
    </>
  );
}
