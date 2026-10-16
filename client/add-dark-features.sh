#!/usr/bin/env bash
set -e
[ -d src/components ] || { echo "❌ Run from client/"; exit 1; }

echo "🌙 Adding theme + favourites + cart + profile pages…"

mkdir -p src/pages src/store src/components

# ============================================================
# 1. Theme store
# ============================================================
cat > src/store/themeStore.js <<'EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTheme = create(persist((set, get) => ({
  theme: 'light',           // 'light' | 'dark'
  toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
  set: (t) => set({ theme: t }),
}), { name: 'munch-theme' }));

// Apply on load
const t = useTheme.getState().theme;
if (t === 'dark') document.documentElement.classList.add('dark');
EOF

# ============================================================
# 2. Favourites store
# ============================================================
cat > src/store/favouritesStore.js <<'EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavourites = create(persist((set, get) => ({
  items: [],   // full item objects
  has: (id) => get().items.some(i => i._id === id),
  toggle: (item) => set(state => ({
    items: state.items.some(i => i._id === item._id)
      ? state.items.filter(i => i._id !== item._id)
      : [...state.items, item],
  })),
  clear: () => set({ items: [] }),
}), { name: 'munch-favourites' }));
EOF

# ============================================================
# 3. Favourites page
# ============================================================
cat > src/pages/Favourites.jsx <<'EOF'
import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavourites } from '../store/favouritesStore';
import ProductCard from '../components/ProductCard.jsx';

export default function Favourites() {
  const items = useFavourites(s => s.items);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm p-12 text-center">
          <Heart className="w-8 h-8 mx-auto text-gray-400 mb-4" />
          <h1 className="text-lg font-bold mb-2 dark:text-white">Favourites</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            You have not saved any dishes yet. Tap the heart on a product to add it here.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6 dark:text-white">Favourites</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => <ProductCard key={item._id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}
EOF

# ============================================================
# 4. Cart page
# ============================================================
cat > src/pages/Cart.jsx <<'EOF'
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartStore';

export default function Cart() {
  const { items, setQty, remove, subtotal } = useCart();
  const navigate = useNavigate();
  const total = subtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Cart</h1>
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm p-12 text-center">
          <ShoppingBag className="w-8 h-8 mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-bold mb-2 dark:text-white">Your cart is empty</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Browse the menu to add items.
          </p>
          <Link
            to="/"
            className="inline-block bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-full font-semibold text-sm"
          >
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Cart</h1>
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm p-4 space-y-4">
        {items.map(item => (
          <div key={item._id} className="flex gap-3">
            <img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt="" />
            <div className="flex-1">
              <h3 className="text-sm font-medium dark:text-white">{item.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ksh{item.price / 100}</p>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => setQty(item._id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center dark:text-white">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm dark:text-white">{item.quantity}</span>
                <button onClick={() => setQty(item._id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center dark:text-white">
                  <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => remove(item._id)} className="ml-auto text-gray-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between mb-3 font-semibold dark:text-white">
            <span>Subtotal</span>
            <span>Ksh{total / 100}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
EOF

# ============================================================
# 5. Profile page
# ============================================================
cat > src/pages/Profile.jsx <<'EOF'
import { useState } from 'react';
import { User, Mail, Phone, Camera, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    phone:     user?.phone || '',
  });
  const [saved, setSaved] = useState(false);

  const update = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // TODO: PATCH /api/auth/me with form
  };

  const removeAccount = () => {
    if (!confirm('Delete your account permanently?')) return;
    // TODO: DELETE /api/auth/me
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Avatar */}
      <div className="flex justify-center mb-10">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-[#1A1D21] flex items-center justify-center text-white text-4xl font-bold">
            {(form.firstName[0] || 'U').toUpperCase()}
          </div>
          <button className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-brand hover:bg-brand-hover flex items-center justify-center text-white shadow-lg">
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={update} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="First name *">
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              className="w-full pl-9 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand"
            />
          </Field>
          <Field label="Last name *">
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })}
              className="w-full pl-9 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Email">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.email}
              readOnly
              className="w-full pl-9 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-gray-300 opacity-70"
            />
          </Field>
          <Field label="Mobile number">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+254…"
              className="w-full pl-9 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold"
        >
          {saved ? 'Saved ✓' : 'Update'}
        </button>
      </form>

      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full mt-3 border border-gray-300 dark:border-gray-600 py-3 rounded-full font-semibold dark:text-white hover:bg-gray-50 dark:hover:bg-[#23272B]"
      >
        Logout
      </button>

      <div className="text-center mt-6">
        <button onClick={removeAccount} className="text-brand text-sm font-medium hover:underline">
          Delete account
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-16">© 2026 Munch</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}
EOF

# ============================================================
# 6. ProductCard — add favourite heart toggle
# ============================================================
cat > src/components/ProductCard.jsx <<'EOF'
import { Plus, Heart } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { useFavourites } from '../store/favouritesStore';

export default function ProductCard({ item }) {
  const add = useCart(s => s.add);
  const has = useFavourites(s => s.has(item._id));
  const toggle = useFavourites(s => s.toggle);
  const finalPrice = item.price - (item.discount || 0);

  return (
    <div className="relative w-48 bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm overflow-hidden shrink-0">
      {item.isPopular && (
        <span className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-0.5 rounded-full z-10">popular</span>
      )}
      {item.discount > 0 && (
        <span className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-0.5 rounded-full z-10">Ksh{item.discount / 100} OFF</span>
      )}
      <button
        onClick={() => toggle(item)}
        className="absolute top-2 right-2 bg-white dark:bg-[#23272B] rounded-full p-1.5 shadow z-10"
        aria-label="Favourite"
      >
        <Heart className={`w-4 h-4 ${has ? 'text-brand fill-brand' : 'text-gray-400'}`} />
      </button>
      <div className="h-40 bg-gray-100 dark:bg-[#23272B]">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex justify-center -mt-4 relative z-10">
        <button onClick={() => add(item)} className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-1 shadow">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="p-3 pt-2">
        <h3 className="font-semibold text-sm line-clamp-1 dark:text-white">{item.name}</h3>
        <div className="mt-1 flex items-center gap-2">
          {item.discount > 0 && (<span className="text-gray-400 line-through text-xs">Ksh{item.price / 100}</span>)}
          <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">Ksh{finalPrice / 100}</span>
        </div>
      </div>
    </div>
  );
}
EOF

# ============================================================
# 7. Header — add theme toggle + wire heart to /favourites, bag to /cart
# ============================================================
cat > src/components/Header.jsx <<'EOF'
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, User, ShoppingBag, Menu as MenuIcon, Moon, Sun, ChevronDown } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { useTheme } from '../store/themeStore';
import SearchModal from './SearchModal.jsx';
import MenuDrawer from './MenuDrawer.jsx';

export default function Header() {
  const count = useCart(s => s.count());
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Apply theme class to <html> whenever it changes
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white dark:bg-[#14171A] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">

          <Link to="/" className="shrink-0">
            <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <circle cx="8" cy="6" r="2" />
                <circle cx="16" cy="6" r="2" />
                <path d="M6 10h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" />
              </svg>
            </div>
          </Link>

          <nav className="hidden md:flex gap-8 text-sm shrink-0">
            <Link to="/" className="text-brand font-medium">Home</Link>
            <Link to="/categories" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Categories</Link>
          </nav>

          <div className="flex-1 max-w-xl">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-gray-700 rounded-full px-5 py-2.5 text-left hover:border-gray-300 dark:hover:border-gray-600 transition"
            >
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Are you hungry?</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#23272B]"
              aria-label="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4 text-gray-300" />
                : <Moon className="w-4 h-4 text-gray-600" />}
            </button>

            <button className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 hover:border-gray-300 dark:hover:border-gray-600">
              <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">Munch Nyali</span>
              <span className="text-[10px] font-bold text-brand tracking-wide">CLOSED</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            <Link to="/favourites" className="p-2 hover:bg-gray-50 dark:hover:bg-[#23272B] rounded-full">
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>

            <Link to="/cart" className="relative p-2 hover:bg-gray-50 dark:hover:bg-[#23272B] rounded-full">
              <ShoppingBag className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                  {count}
                </span>
              )}
            </Link>

            <Link to="/profile" className="p-2 hover:bg-gray-50 dark:hover:bg-[#23272B] rounded-full">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 hover:bg-gray-50 dark:hover:bg-[#23272B] rounded-full"
              aria-label="Menu"
            >
              <MenuIcon className="w-5 h-5 text-brand" />
            </button>
          </div>

        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuDrawer  open={menuOpen}   onClose={() => setMenuOpen(false)} />
    </>
  );
}
EOF

# ============================================================
# 8. Patch tailwind config for dark mode
# ============================================================
cat > tailwind.config.js <<'EOF'
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#E8192C', hover: '#C91524' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
EOF

# ============================================================
# 9. Patch index.css so body respects dark
# ============================================================
cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-[#F5F6F8] text-gray-900 antialiased font-sans;
}
.dark body {
  @apply bg-[#0F1114] text-gray-100;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
EOF

# ============================================================
# 10. Patch App.jsx routes
# ============================================================
cat > src/App.jsx <<'EOF'
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Categories from './pages/Categories.jsx';
import CategoryDetail from './pages/CategoryDetail.jsx';
import Account from './pages/Account.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Orders from './pages/Orders.jsx';
import SearchResults from './pages/SearchResults.jsx';
import Favourites from './pages/Favourites.jsx';
import Cart from './pages/Cart.jsx';
import Profile from './pages/Profile.jsx';
import Header from './components/Header.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <>
      <Header />
      <CartDrawer />
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/categories"     element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryDetail />} />
        <Route path="/search"         element={<SearchResults />} />
        <Route path="/favourites"     element={<Favourites />} />
        <Route path="/cart"           element={<Cart />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/account"        element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/checkout"       element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders"         element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id"     element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
EOF

# ============================================================
# 11. Patch MenuDrawer to use dark classes
# ============================================================
cat > src/components/MenuDrawer.jsx <<'EOF'
import {
  User, ShoppingBag, MapPin, Heart, Wallet, Award,
  HelpCircle, Shield, FileText, LogOut, ChevronRight, X, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const QuickAction = ({ icon: Icon, label }) => (
  <div className="bg-white dark:bg-[#1A1D21] rounded-2xl py-4 flex flex-col items-center gap-2 shadow-sm border border-gray-100 dark:border-gray-800">
    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
  </div>
);

const Row = ({ icon: Icon, label, danger, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#23272B]">
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
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#F5F6F8] dark:bg-[#0F1114] z-50 shadow-xl transform transition-transform overflow-y-auto
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-gray-100 dark:bg-[#23272B] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-semibold dark:text-white">{user?.name || 'Guest'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'Sign in to order'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <QuickAction icon={Heart}  label="Favourite" />
            <QuickAction icon={Wallet} label="Wallet" />
            <QuickAction icon={Award}  label="Loyalty point" />
          </div>

          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <p className="px-4 pt-3 pb-1 text-xs text-gray-400 tracking-wider">GENERAL</p>
            <Row icon={User}        label="Profile"    onClick={() => go('/profile')} />
            <Row icon={ShoppingBag} label="My orders"  onClick={() => go('/orders')} />
            <Row icon={MapPin}      label="My address" onClick={() => go('/account')} />
          </div>

          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
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

echo ""
echo "✅ Done. New files:"
echo "   src/store/themeStore.js"
echo "   src/store/favouritesStore.js"
echo "   src/pages/Favourites.jsx"
echo "   src/pages/Cart.jsx"
echo "   src/pages/Profile.jsx"
echo ""
echo "Updated:"
echo "   src/App.jsx        (added /favourites /cart /profile routes)"
echo "   src/components/Header.jsx      (theme toggle, hearts/cart/profile links)"
echo "   src/components/ProductCard.jsx (favourite heart toggle)"
echo "   src/components/MenuDrawer.jsx  (dark classes + /profile)"
echo "   tailwind.config.js (darkMode: 'class')"
echo "   src/index.css      (dark body bg)"
echo ""
echo "Restart Vite: Ctrl+C then npm run dev"
