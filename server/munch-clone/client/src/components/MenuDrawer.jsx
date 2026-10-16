import {
  User, ShoppingBag, MapPin, Heart, Wallet, Award,
  HelpCircle, Shield, FileText, LogOut, ChevronRight, X, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const QuickAction = ({ icon: Icon, label }) => (
  <div className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 shadow-sm border border-gray-100">
    <Icon className="w-5 h-5 text-gray-600" />
    <span className="text-sm text-gray-700">{label}</span>
  </div>
);

const Row = ({ icon: Icon, label, danger, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50">
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${danger ? 'text-brand' : 'text-gray-500'}`} />
      <span className={`text-sm font-medium ${danger ? 'text-brand' : ''}`}>{label}</span>
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
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#F5F6F8] z-50 shadow-xl transform transition-transform overflow-y-auto
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="text-sm text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-semibold">{user?.name || 'Guest'}</p>
              <p className="text-sm text-gray-500">{user?.email || 'Sign in to order'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <QuickAction icon={Heart}  label="Favourite" />
            <QuickAction icon={Wallet} label="Wallet" />
            <QuickAction icon={Award}  label="Loyalty point" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm divide-y">
            <p className="px-4 pt-3 pb-1 text-xs text-gray-400 tracking-wider">GENERAL</p>
            <Row icon={User}        label="Profile"    onClick={() => go('/account')} />
            <Row icon={ShoppingBag} label="My orders"  onClick={() => go('/orders')} />
            <Row icon={MapPin}      label="My address" onClick={() => go('/account')} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm divide-y">
            <p className="px-4 pt-3 pb-1 text-xs text-gray-400 tracking-wider">MENU MORE</p>
            <Row icon={HelpCircle} label="Help & support"     onClick={() => go('/account')} />
            <Row icon={Shield}     label="Privacy policy"     onClick={() => go('/account')} />
            <Row icon={FileText}   label="Terms & conditions" onClick={() => go('/account')} />
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
