#!/usr/bin/env bash
set -e
[ -d src/components ] || { echo "❌ Run from client/"; exit 1; }

echo "🔔 Adding toast notifications…"

# ─── Toast store ───
mkdir -p src/store
cat > src/store/toastStore.js <<'EOF'
import { create } from 'zustand';

let nextId = 1;

export const useToast = create((set, get) => ({
  toasts: [],

  show: (message, opts = {}) => {
    const id = nextId++;
    const toast = {
      id,
      message,
      type: opts.type || 'success',     // 'success' | 'error' | 'info'
      duration: opts.duration ?? 3000,
    };
    set(state => ({ toasts: [...state.toasts, toast] }));
    if (toast.duration > 0) {
      setTimeout(() => get().dismiss(id), toast.duration);
    }
    return id;
  },

  dismiss: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
}));
EOF

# ─── Toast container ───
cat > src/components/ToastContainer.jsx <<'EOF'
import { Check, X, Info, AlertCircle } from 'lucide-react';
import { useToast } from '../store/toastStore';

const ICONS = {
  success: Check,
  error:   AlertCircle,
  info:    Info,
};

const COLORS = {
  success: { bg: 'bg-green-500', ring: 'ring-green-500/30' },
  error:   { bg: 'bg-red-500',   ring: 'ring-red-500/30' },
  info:    { bg: 'bg-blue-500',  ring: 'ring-blue-500/30' },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Check;
        const { bg, ring } = COLORS[t.type] || COLORS.success;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 bg-[#2A2D31] text-white rounded-xl px-4 py-3 shadow-2xl ring-1 ring-white/5 min-w-[280px] max-w-sm animate-[slideIn_0.2s_ease-out]"
          >
            <span className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4 text-white" strokeWidth={3} />
            </span>
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-white transition shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
EOF

# ─── Add keyframe to index.css ───
if ! grep -q "slideIn" src/index.css; then
  cat >> src/index.css <<'EOF'

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
EOF
fi

# ─── Mount ToastContainer in App ───
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
import ToastContainer from './components/ToastContainer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <>
      <Header />
      <CartDrawer />
      <ToastContainer />
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

# ─── Rewrite Profile.jsx to fire the toast ───
cat > src/pages/Profile.jsx <<'EOF'
import { useState } from 'react';
import { User, Mail, Phone, Camera, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../store/toastStore';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast(s => s.show);

  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    phone:     user?.phone || '',
  });

  const update = (e) => {
    e.preventDefault();
    // Detect whether anything actually changed
    const originalFirst = user?.name?.split(' ')[0] || '';
    const originalLast  = user?.name?.split(' ').slice(1).join(' ') || '';
    const originalPhone = user?.phone || '';

    const dirty =
      form.firstName !== originalFirst ||
      form.lastName  !== originalLast  ||
      form.phone     !== originalPhone;

    if (!dirty) {
      toast('Change something to update.', { type: 'success' });
      return;
    }

    // TODO: PATCH /api/auth/me with form
    toast('Profile updated.', { type: 'success' });
  };

  const removeAccount = () => {
    if (!confirm('Delete your account permanently?')) return;
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

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
          Update
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

echo "✅ Created:"
echo "   src/store/toastStore.js"
echo "   src/components/ToastContainer.jsx"
echo ""
echo "✅ Updated:"
echo "   src/App.jsx            (mounts ToastContainer)"
echo "   src/pages/Profile.jsx  (fires toast on Update)"
echo "   src/index.css          (slideIn keyframe)"
echo ""
echo "Hard refresh the browser."
