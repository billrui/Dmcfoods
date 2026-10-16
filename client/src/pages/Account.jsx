import { User, ShoppingBag, MapPin, Heart, Wallet, Award, HelpCircle, Shield, FileText, LogOut, ChevronRight, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const QuickAction = ({ icon: Icon, label }) => (
  <div className="bg-white rounded-2xl py-4 flex flex-col items-center gap-2 shadow-sm">
    <Icon className="w-5 h-5 text-gray-600" />
    <span className="text-sm text-gray-700">{label}</span>
  </div>
);

const Row = ({ icon: Icon, label, danger, to, onClick }) => {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${danger ? 'text-brand' : 'text-gray-500'}`} />
        <span className={`text-sm font-medium ${danger ? 'text-brand' : ''}`}>{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </>
  );
  const cls = 'w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50';
  return to ? <Link to={to} className={cls}>{content}</Link>
            : <button onClick={onClick} className={cls}>{content}</button>;
};

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-gray-700">← Menu</Link>
        <button onClick={() => navigate('/')}><X className="w-5 h-5 text-gray-500" /></button>
      </div>
      <div className="flex items-center gap-3 py-2">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <QuickAction icon={Heart}  label="Favourite" />
        <QuickAction icon={Wallet} label="Wallet" />
        <QuickAction icon={Award}  label="Loyalty point" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm divide-y">
        <p className="px-4 pt-3 pb-1 text-xs text-gray-400 tracking-wider">GENERAL</p>
        <Row icon={User}        label="Profile"    to="/account" />
        <Row icon={ShoppingBag} label="My orders"  to="/orders" />
        <Row icon={MapPin}      label="My address" to="/account" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm divide-y">
        <p className="px-4 pt-3 pb-1 text-xs text-gray-400 tracking-wider">MENU MORE</p>
        <Row icon={HelpCircle} label="Help & support"     to="/account" />
        <Row icon={Shield}     label="Privacy policy"     to="/account" />
        <Row icon={FileText}   label="Terms & conditions" to="/account" />
        <Row icon={LogOut}     label="Logout" danger onClick={() => { logout(); navigate('/login'); }} />
      </div>
      <p className="text-center text-xs text-gray-400 pt-4">Version 0.1.0</p>
    </div>
  );
}
