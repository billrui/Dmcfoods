#!/usr/bin/env bash
set -e

if [ ! -d "src/components" ]; then
  echo "❌ Run this from the client/ folder (where src/ lives)"
  exit 1
fi

echo "📦 Creating missing components…"

cat > src/components/SearchModal.jsx <<'EOF'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import api from '../lib/api';
import { useCart } from '../store/cartStore';

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const add = useCart(s => s.add);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
    enabled: open,
  });

  const { data: popular = [] } = useQuery({
    queryKey: ['menu', 'popular'],
    queryFn: () => api.get('/menu?popular=true').then(r => r.data),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 md:pt-24"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 md:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg">Search</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="mb-6">
          <div className="flex items-center gap-3 border-2 border-brand rounded-full px-5 py-3">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Are you hungry?"
              className="flex-1 outline-none text-sm bg-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-2">
            Search for what you're craving
          </p>
        </form>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
            CATEGORIES
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => { onClose(); navigate(`/category/${cat.slug}`); }}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-800 hover:border-brand hover:text-brand transition"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
            POPULAR PICKS
          </h3>
          <div className="flex flex-wrap gap-2">
            {popular.slice(0, 12).map(item => (
              <button
                key={item._id}
                onClick={() => { add(item); onClose(); }}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-800 hover:border-brand hover:text-brand transition"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

cat > src/components/MenuDrawer.jsx <<'EOF'
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
EOF

cat > src/pages/SearchResults.jsx <<'EOF'
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard.jsx';

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get(`/menu?q=${encodeURIComponent(q)}`).then(r => r.data),
    enabled: !!q,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-gray-600 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back home
      </Link>
      <h1 className="text-xl font-bold mb-6">
        {isLoading ? 'Searching…' : `${items.length} result(s) for "${q}"`}
      </h1>
      {!isLoading && items.length === 0 && (
        <p className="text-gray-500">Nothing matched. Try a different word.</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => <ProductCard key={item._id} item={item} />)}
      </div>
    </div>
  );
}
EOF

echo ""
echo "✅ Created:"
echo "   src/components/SearchModal.jsx"
echo "   src/components/MenuDrawer.jsx"
echo "   src/pages/SearchResults.jsx"
