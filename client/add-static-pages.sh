#!/usr/bin/env bash
set -e
[ -d src/pages ] || { echo "❌ Run from client/"; exit 1; }

echo "📄 Adding Wallet, Loyalty, Help, Privacy, Terms pages…"

# ─── Shared wrapper for policy pages ───
cat > src/components/PolicyLayout.jsx <<'EOF'
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PolicyLayout({ title, updated, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/profile"
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-2 dark:text-white">{title}</h1>
      {updated && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: {updated}
        </p>
      )}

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
EOF

# ─── Privacy Policy ───
cat > src/pages/Privacy.jsx <<'EOF'
import PolicyLayout from '../components/PolicyLayout.jsx';

export default function Privacy() {
  return (
    <PolicyLayout title="Privacy Policy" updated="October 2026">
      <p>
        At Munch, we take your privacy seriously. This policy explains what we collect,
        why we collect it, and what you can do about it.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">What we collect</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Account info:</strong> name, email, phone number, delivery address.</li>
        <li><strong>Order history:</strong> items you've ordered, prices, delivery times.</li>
        <li><strong>Usage:</strong> pages visited, searches, device type (for improving the service).</li>
        <li><strong>Payment:</strong> handled by our payment processor. We never store card numbers.</li>
      </ul>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Why we collect it</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>To deliver your orders and process payments.</li>
        <li>To show your order history and favourites.</li>
        <li>To improve our menu, delivery times, and recommendations.</li>
        <li>To send you order updates (SMS or email) — not marketing, unless you opt in.</li>
      </ul>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Who we share it with</h2>
      <p>
        We share the minimum required data with delivery riders (your address and phone number)
        and payment processors (transaction details). We never sell your data.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Your rights</h2>
      <p>
        You can view, update, or delete your account at any time from your profile page.
        Deleting your account removes your personal data; some transaction records are
        retained for accounting purposes as required by law.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Cookies</h2>
      <p>
        We use cookies for session management, cart persistence, and remembering your
        preferred branch. You can clear them from your browser settings at any time.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Contact us</h2>
      <p>
        Questions? Email <a href="mailto:privacy@munch.co.ke" className="text-brand hover:underline">privacy@munch.co.ke</a>.
      </p>
    </PolicyLayout>
  );
}
EOF

# ─── Terms & Conditions ───
cat > src/pages/Terms.jsx <<'EOF'
import PolicyLayout from '../components/PolicyLayout.jsx';

export default function Terms() {
  return (
    <PolicyLayout title="Terms & Conditions" updated="October 2026">
      <p>
        By using Munch you agree to these terms. If you don't agree, please don't use the service.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Using Munch</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>You must be 18+ or have permission from a guardian.</li>
        <li>Provide accurate delivery details — we're not responsible for failed deliveries due to wrong addresses.</li>
        <li>Don't abuse the service (fake orders, harassment of riders, etc.).</li>
      </ul>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Orders & payments</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Prices are shown in Kenyan Shillings and include VAT where applicable.</li>
        <li>Payment is due at checkout — either online or cash on delivery.</li>
        <li>Delivery fees are shown separately before you confirm.</li>
        <li>We may cancel an order if an item is out of stock; you'll be refunded in full.</li>
      </ul>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Cancellations & refunds</h2>
      <p>
        Orders can be cancelled before they enter preparation. Once we start cooking,
        cancellation may not be possible. Refunds for cancelled or failed orders are
        processed within 5–7 business days.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Delivery</h2>
      <p>
        Estimated delivery times are not guarantees. Delays can happen due to weather,
        traffic, or volume. We'll notify you of major delays.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Liability</h2>
      <p>
        We're not liable for indirect losses (e.g. missed meetings) caused by delayed orders.
        Our liability is capped at the value of your order.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Changes</h2>
      <p>
        We may update these terms. Continued use after an update means you accept the new terms.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Contact</h2>
      <p>
        Questions? Email <a href="mailto:legal@munch.co.ke" className="text-brand hover:underline">legal@munch.co.ke</a>.
      </p>
    </PolicyLayout>
  );
}
EOF

# ─── Help & Support ───
cat > src/pages/Help.jsx <<'EOF'
import { useState } from 'react';
import { ArrowLeft, ChevronDown, Mail, Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../store/toastStore';

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'After placing an order, go to "My orders" and tap the order. You\'ll see live status updates from preparation to delivery.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Yes, but only before we start preparing it. Once cooking begins, cancellation may not be possible. Contact support immediately if you need to cancel.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Cash on delivery (COD) and card payments. Mobile money (M-Pesa) is coming soon.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Typically 30–45 minutes within our delivery zones. Peak hours may be longer.',
  },
  {
    q: 'My order arrived incomplete or cold. What do I do?',
    a: 'Contact us within 30 minutes of delivery with your order number and a photo if possible. We\'ll make it right — either a partial refund or a remake.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile → Delete account. This permanently removes your data. Some transaction records are retained for accounting.',
  },
];

export default function Help() {
  const [openIdx, setOpenIdx] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '' });
  const toast = useToast(s => s.show);

  const submit = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast('Please fill both subject and message.', { type: 'error' });
      return;
    }
    toast('Message sent. We\'ll reply within 24 hours.', { type: 'success' });
    setForm({ subject: '', message: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/profile"
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-2 dark:text-white">Help & support</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Answers to common questions. Still stuck? Send us a message below.
      </p>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <a href="tel:+254700123456" className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 hover:border-gray-200 dark:hover:border-gray-700 transition">
          <Phone className="w-5 h-5 text-brand" />
          <div>
            <p className="text-sm font-medium dark:text-white">Call us</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">+254 700 123 456</p>
          </div>
        </a>
        <a href="mailto:support@munch.co.ke" className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 hover:border-gray-200 dark:hover:border-gray-700 transition">
          <Mail className="w-5 h-5 text-brand" />
          <div>
            <p className="text-sm font-medium dark:text-white">Email</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">support@munch.co.ke</p>
          </div>
        </a>
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-brand" />
          <div>
            <p className="text-sm font-medium dark:text-white">Live chat</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Coming soon</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Frequently asked</h2>
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 mb-8">
        {FAQS.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#23272B] transition"
            >
              <span className="text-sm font-medium dark:text-white pr-4">{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                  openIdx === i ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact form */}
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Still need help?</h2>
      <form onSubmit={submit} className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Subject</label>
          <input
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            placeholder="What's it about?"
            className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Message</label>
          <textarea
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            rows={5}
            placeholder="Tell us what happened…"
            className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand resize-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold"
        >
          Send message
        </button>
      </form>
    </div>
  );
}
EOF

# ─── Wallet ───
cat > src/pages/Wallet.jsx <<'EOF'
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
      <div className="relative bg-gradient-to-br from-brand to-[#A81224] rounded-3xl p-6 text-white shadow-lg mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-12 -mb-12" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3 opacity-90">
            <WalletIcon className="w-4 h-4" />
            <span className="text-xs font-medium tracking-wider">MUNCH WALLET</span>
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
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
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
EOF

# ─── Loyalty ───
cat > src/pages/Loyalty.jsx <<'EOF'
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
            <span className="text-xs font-medium tracking-wider">MUNCH REWARDS</span>
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
EOF

# ─── Update App.jsx with new routes ───
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
import Help from './pages/Help.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Wallet from './pages/Wallet.jsx';
import Loyalty from './pages/Loyalty.jsx';
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
        <Route path="/wallet"         element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/loyalty"        element={<ProtectedRoute><Loyalty /></ProtectedRoute>} />
        <Route path="/help"           element={<Help />} />
        <Route path="/privacy"        element={<Privacy />} />
        <Route path="/terms"          element={<Terms />} />
      </Routes>
    </>
  );
}
EOF

# ─── Update MenuDrawer to point at the new routes ───
cat > src/components/MenuDrawer.jsx <<'EOF'
import {
  User, ShoppingBag, MapPin, Heart, Wallet as WalletIcon, Award,
  HelpCircle, Shield, FileText, LogOut, ChevronRight, X, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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

  const go = (path) => { onClose(); navigate(path); };

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-[#0F1114] z-50 shadow-xl transform transition-transform overflow-y-auto
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 space-y-5">
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

          <div className="grid grid-cols-3 gap-3">
            <QuickAction icon={Heart}      label="Favourite"     onClick={() => go('/favourites')} />
            <QuickAction icon={WalletIcon} label="Wallet"        onClick={() => go('/wallet')} />
            <QuickAction icon={Award}      label="Loyalty point" onClick={() => go('/loyalty')} />
          </div>

          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 tracking-wider">GENERAL</p>
            <Row icon={User}        label="Profile"    onClick={() => go('/profile')} />
            <Row icon={ShoppingBag} label="My orders"  onClick={() => go('/orders')} />
            <Row icon={MapPin}      label="My address" onClick={() => go('/profile')} />
          </div>

          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <p className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 tracking-wider">MENU MORE</p>
            <Row icon={HelpCircle} label="Help & support"     onClick={() => go('/help')} />
            <Row icon={Shield}     label="Privacy policy"     onClick={() => go('/privacy')} />
            <Row icon={FileText}   label="Terms & conditions" onClick={() => go('/terms')} />
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

echo "✅ Created:"
echo "   src/components/PolicyLayout.jsx"
echo "   src/pages/Privacy.jsx"
echo "   src/pages/Terms.jsx"
echo "   src/pages/Help.jsx"
echo "   src/pages/Wallet.jsx"
echo "   src/pages/Loyalty.jsx"
echo ""
echo "✅ Updated:"
echo "   src/App.jsx               (added /privacy /terms /help /wallet /loyalty routes)"
echo "   src/components/MenuDrawer.jsx (all rows now route to real pages)"
echo ""
echo "Hard refresh the browser."
