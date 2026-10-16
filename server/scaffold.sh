#!/usr/bin/env bash
set -e

echo "🏗️  Creating Munch clone scaffold…"

# ============================================================
# DIRECTORY STRUCTURE
# ============================================================
mkdir -p munch-clone/server/src/{models,routes,middleware,lib,seed}
mkdir -p munch-clone/client/src/{pages,components,store,lib,context}
cd munch-clone

# ============================================================
# SERVER
# ============================================================

cat > server/package.json <<'EOF'
{
  "name": "munch-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "seed": "node src/seed/seed.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.7.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.7"
  }
}
EOF

cat > server/.env <<'EOF'
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/munch
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_ORIGIN=http://localhost:5173
EOF

cat > server/src/index.js <<'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth',   authRoutes);
app.use('/api',        menuRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Mongo connected');
    app.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('Mongo error', err); process.exit(1); });
EOF

cat > server/src/models/User.js <<'EOF'
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, select: false },
  phone:    String,
  addresses: [{ street: String, city: String, isDefault: Boolean }],
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
EOF

cat > server/src/models/Category.js <<'EOF'
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name:      { type: String, required: true },
  slug:      { type: String, required: true, unique: true },
  icon:      String,
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
EOF

cat > server/src/models/MenuItem.js <<'EOF'
import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price:       { type: Number, required: true },
  image:       String,
  description: String,
  isAvailable: { type: Boolean, default: true },
  isPopular:   { type: Boolean, default: false },
  isLatest:    { type: Boolean, default: false },
  discount:    { type: Number, default: 0 },
}, { timestamps: true });

menuItemSchema.index({ name: 'text' });

export default mongoose.model('MenuItem', menuItemSchema);
EOF

cat > server/src/models/Order.js <<'EOF'
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:     String,
  price:    Number,
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:       [orderItemSchema],
  subtotal:    Number,
  deliveryFee: { type: Number, default: 0 },
  total:       Number,
  status: {
    type: String,
    enum: ['CREATED','PAID','PREPARING','READY','DELIVERING','COMPLETED','CANCELED'],
    default: 'CREATED',
  },
  type:          { type: String, enum: ['delivery','pickup'], default: 'delivery' },
  address:       { street: String, city: String, notes: String },
  paymentMethod: { type: String, enum: ['cod','card'], default: 'cod' },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
EOF

cat > server/src/middleware/auth.js <<'EOF'
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
EOF

cat > server/src/lib/jwt.js <<'EOF'
import jwt from 'jsonwebtoken';

export const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
EOF

cat > server/src/routes/auth.js <<'EOF'
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { _id: user._id, name, email } });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { _id: req.user._id, name: req.user.name, email: req.user.email } });
});

export default router;
EOF

cat > server/src/routes/menu.js <<'EOF'
import express from 'express';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

router.get('/categories', async (_req, res) => {
  const cats = await Category.find().sort('sortOrder');
  res.json(cats);
});

router.get('/menu', async (req, res) => {
  const { category, popular, latest, q } = req.query;
  const filter = { isAvailable: true };
  if (category) filter.category = category;
  if (popular === 'true') filter.isPopular = true;
  if (latest === 'true')  filter.isLatest = true;
  if (q) filter.name = { $regex: q, $options: 'i' };

  const items = await MenuItem.find(filter).populate('category', 'name slug');
  res.json(items);
});

router.get('/menu/:id', async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.get('/category/:slug', async (req, res) => {
  const cat = await Category.findOne({ slug: req.params.slug });
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const items = await MenuItem.find({ category: cat._id, isAvailable: true });
  res.json({ category: cat, items });
});

export default router;
EOF

cat > server/src/routes/orders.js <<'EOF'
import express from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, address, paymentMethod, type } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'No items' });

    const ids = items.map(i => i.menuItem);
    const dbItems = await MenuItem.find({ _id: { $in: ids } });

    const lineItems = items.map(clientItem => {
      const dbItem = dbItems.find(d => d._id.toString() === clientItem.menuItem);
      if (!dbItem) throw Object.assign(new Error('Invalid item'), { status: 400 });
      const unitPrice = dbItem.price - (dbItem.discount || 0);
      return {
        menuItem: dbItem._id,
        name:     dbItem.name,
        price:    unitPrice,
        quantity: clientItem.quantity,
      };
    });

    const subtotal    = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = type === 'delivery' ? 15000 : 0;
    const total       = subtotal + deliveryFee;

    const order = await Order.create({
      user: req.user._id,
      items: lineItems,
      subtotal, deliveryFee, total,
      address, paymentMethod, type,
      statusHistory: [{ status: 'CREATED' }],
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
});

router.get('/my', requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json(orders);
});

router.get('/:id', requireAuth, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

export default router;
EOF

cat > server/src/seed/seed.js <<'EOF'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const img = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;

const categories = [
  { name: 'Burgers',  slug: 'burgers',  icon: img('burger'),  sortOrder: 1 },
  { name: 'Bowls',    slug: 'bowls',    icon: img('bowl'),    sortOrder: 2 },
  { name: 'Combos',   slug: 'combos',   icon: img('combo'),   sortOrder: 3 },
  { name: 'Chips',    slug: 'chips',    icon: img('fries'),   sortOrder: 4 },
  { name: 'Wings',    slug: 'wings',    icon: img('wings'),   sortOrder: 5 },
  { name: 'Nuggets',  slug: 'nuggets',  icon: img('nuggets'), sortOrder: 6 },
  { name: 'Dessert',  slug: 'dessert',  icon: img('dessert'), sortOrder: 7 },
  { name: 'Subs',     slug: 'subs',     icon: img('sub'),     sortOrder: 8 },
  { name: 'Chicken',  slug: 'chicken',  icon: img('chicken'), sortOrder: 9 },
  { name: 'Shakes',   slug: 'shakes',   icon: img('shake'),   sortOrder: 10 },
  { name: 'Snacks',   slug: 'snacks',   icon: img('snack'),   sortOrder: 11 },
  { name: 'Drinks',   slug: 'drinks',   icon: img('drink'),   sortOrder: 12 },
  { name: 'Dips',     slug: 'dips',     icon: img('dip'),     sortOrder: 13 },
  { name: 'Extras',   slug: 'extras',   icon: img('extra'),   sortOrder: 14 },
  { name: 'Drumsticks', slug: 'drumsticks', icon: img('drumstick'), sortOrder: 15 },
];

const itemSpecs = [
  { name: 'SuperBowl',              cat: 'bowls',    price: 39000, popular: true },
  { name: 'Plain Chips',            cat: 'chips',    price: 18000, popular: true, latest: true },
  { name: 'SuperBowl XTRA',         cat: 'bowls',    price: 59000, popular: true },
  { name: 'Single Beef Burger',     cat: 'burgers',  price: 39000, popular: true },
  { name: '6-inch Chicken Sub',     cat: 'subs',     price: 39000, popular: true },
  { name: '8 Piece Wings',          cat: 'wings',    price: 65000 },
  { name: '4 Piece Wings + Chips',  cat: 'wings',    price: 45000, popular: true },
  { name: '4 Nuggets + Chips',      cat: 'nuggets',  price: 35000, popular: true },
  { name: 'SuperBowl + 4 Nuggets',  cat: 'combos',   price: 54000, latest: true },
  { name: 'SuperBowl + 4 Piece Wings', cat: 'combos', price: 64000, latest: true },
  { name: '4 Piece Drumsticks',     cat: 'drumsticks', price: 60000, discount: 6000, latest: true },
  { name: '2 Piece Drumsticks',     cat: 'drumsticks', price: 30000, discount: 2000, latest: true },
  { name: '1 Piece Drumstick',      cat: 'drumsticks', price: 15000, popular: true },
  { name: '1/2 Chicken',            cat: 'chicken',  price: 55000 },
  { name: '1/4 Chicken + Regular Chips', cat: 'chicken', price: 45000 },
  { name: 'Sweet Chilli Dip',       cat: 'dips',     price: 5000 },
  { name: 'Dip Pack (All Dips)',    cat: 'dips',     price: 15000, popular: true },
  { name: 'Strawberry Ice Cream',   cat: 'dessert',  price: 20000 },
  { name: 'Passion Juice Small',    cat: 'drinks',   price: 10000 },
  { name: 'Passion Juice Large',    cat: 'drinks',   price: 15000 },
  { name: '12 Piece Wings',         cat: 'wings',    price: 95000 },
  { name: '2 Sausages + Chips',     cat: 'combos',   price: 35000, popular: true },
  { name: 'Mega Combo',             cat: 'combos',   price: 85000, popular: true },
  { name: 'Iced Coffee',            cat: 'drinks',   price: 25000, popular: true },
  { name: 'Brownie Sundae',         cat: 'dessert',  price: 35000, popular: true },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing…');
  await Category.deleteMany({});
  await MenuItem.deleteMany({});

  const catDocs = await Category.insertMany(categories);
  const bySlug = Object.fromEntries(catDocs.map(c => [c.slug, c._id]));

  const items = itemSpecs.map(s => ({
    name: s.name,
    category: bySlug[s.cat],
    price: s.price,
    image: img(s.name),
    isPopular: !!s.popular,
    isLatest: !!s.latest,
    discount: s.discount || 0,
    isAvailable: true,
  }));

  await MenuItem.insertMany(items);
  console.log(`Seeded ${catDocs.length} categories and ${items.length} items.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
EOF

# ============================================================
# CLIENT
# ============================================================

cat > client/package.json <<'EOF'
{
  "name": "munch-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "axios": "^1.7.7",
    "lucide-react": "^0.447.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.8"
  }
}
EOF

cat > client/vite.config.js <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
  },
});
EOF

cat > client/tailwind.config.js <<'EOF'
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
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

cat > client/postcss.config.js <<'EOF'
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
EOF

cat > client/index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Munch — Order food</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

cat > client/src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body { @apply bg-[#F5F6F8] text-gray-900 antialiased font-sans; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
EOF

cat > client/src/lib/api.js <<'EOF'
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
EOF

cat > client/src/store/cartStore.js <<'EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(persist((set, get) => ({
  items: [],
  drawerOpen: false,

  openDrawer:  () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  add: (item) => set(state => {
    const existing = state.items.find(i => i._id === item._id);
    const items = existing
      ? state.items.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...state.items, { ...item, quantity: 1 }];
    return { items, drawerOpen: true };
  }),

  remove: (id) => set(state => ({ items: state.items.filter(i => i._id !== id) })),

  setQty: (id, qty) => set(state => ({
    items: qty <= 0
      ? state.items.filter(i => i._id !== id)
      : state.items.map(i => i._id === id ? { ...i, quantity: qty } : i),
  })),

  clear: () => set({ items: [] }),

  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  count:    () => get().items.reduce((s, i) => s + i.quantity, 0),
}), { name: 'munch-cart' }));
EOF

cat > client/src/context/AuthContext.jsx <<'EOF'
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
EOF

cat > client/src/components/ProtectedRoute.jsx <<'EOF'
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
EOF

cat > client/src/main.jsx <<'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
EOF

cat > client/src/App.jsx <<'EOF'
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
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
EOF

cat > client/src/components/Header.jsx <<'EOF'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, User, Menu as MenuIcon, ShoppingBag } from 'lucide-react';
import { useCart } from '../store/cartStore';
import SearchModal from './SearchModal.jsx';
import MenuDrawer from './MenuDrawer.jsx';

export default function Header() {
  const count = useCart(s => s.count());
  const openDrawer = useCart(s => s.openDrawer);

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center text-white font-bold">
            m
          </Link>

          <nav className="hidden md:flex gap-6 text-sm">
            <Link to="/" className="text-brand font-medium">Home</Link>
            <Link to="/categories" className="text-gray-600">Categories</Link>
          </nav>

          <div className="flex-1 max-w-md">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 text-left hover:bg-gray-200 transition"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Are you hungry?</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm">
            <span className="px-3 py-1 rounded-full border text-gray-600">Munch Nyali</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              OPEN
            </span>
          </div>

          <button onClick={openDrawer} className="relative p-2">
            <ShoppingBag className="w-5 h-5 text-gray-600" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          <Link to="/account" className="p-2">
            <Heart className="w-5 h-5 text-gray-600" />
          </Link>
          <Link to="/account" className="p-2">
            <User className="w-5 h-5 text-gray-600" />
          </Link>

          <button onClick={() => setMenuOpen(true)} className="p-2">
            <MenuIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuDrawer  open={menuOpen}   onClose={() => setMenuOpen(false)} />
    </>
  );
}
EOF

cat > client/src/components/SearchModal.jsx <<'EOF'
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

cat > client/src/components/MenuDrawer.jsx <<'EOF'
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

cat > client/src/components/CategoryScroll.jsx <<'EOF'
import { Link } from 'react-router-dom';

export default function CategoryScroll({ categories = [] }) {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <Link key={cat._id} to={`/category/${cat.slug}`} className="flex flex-col items-center min-w-[80px]">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
              <img src={cat.icon} alt={cat.name} className="w-14 h-14 object-cover rounded-lg" />
            </div>
            <span className="text-xs mt-2 text-gray-700">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
EOF

cat > client/src/components/ProductCard.jsx <<'EOF'
import { Plus, Heart } from 'lucide-react';
import { useCart } from '../store/cartStore';

export default function ProductCard({ item }) {
  const add = useCart(s => s.add);
  const finalPrice = item.price - (item.discount || 0);

  return (
    <div className="relative w-48 bg-white rounded-2xl shadow-sm overflow-hidden shrink-0">
      {item.isPopular && (
        <span className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-0.5 rounded-full z-10">popular</span>
      )}
      {item.discount > 0 && (
        <span className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-0.5 rounded-full z-10">Ksh{item.discount / 100} OFF</span>
      )}
      <button className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow z-10">
        <Heart className="w-4 h-4 text-gray-400" />
      </button>
      <div className="h-40 bg-gray-100">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex justify-center -mt-4 relative z-10">
        <button onClick={() => add(item)} className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-1 shadow">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="p-3 pt-2">
        <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
        <div className="mt-1 flex items-center gap-2">
          {item.discount > 0 && (<span className="text-gray-400 line-through text-xs">Ksh{item.price / 100}</span>)}
          <span className="text-gray-800 text-sm font-medium">Ksh{finalPrice / 100}</span>
        </div>
      </div>
    </div>
  );
}
EOF

cat > client/src/components/ProductScroller.jsx <<'EOF'
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard.jsx';

export default function ProductScroller({ title, items = [] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{title}</h2>
        <Link to="/categories" className="text-sm text-gray-600 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map(item => <ProductCard key={item._id} item={item} />)}
      </div>
    </section>
  );
}
EOF

cat > client/src/components/CartDrawer.jsx <<'EOF'
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartStore';

export default function CartDrawer() {
  const { items, setQty, remove, subtotal, drawerOpen, closeDrawer } = useCart();
  const navigate = useNavigate();
  const total = subtotal();

  return (
    <>
      {drawerOpen && <div onClick={closeDrawer} className="fixed inset-0 bg-black/40 z-40" />}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl transform transition-transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Your cart</h2>
          <button onClick={closeDrawer}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-180px)]">
          {items.length === 0 && <p className="text-center text-gray-500 py-10">Cart is empty</p>}
          {items.map(item => (
            <div key={item._id} className="flex gap-3">
              <img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt="" />
              <div className="flex-1">
                <h3 className="text-sm font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600">Ksh{item.price / 100}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setQty(item._id, item.quantity - 1)} className="w-6 h-6 rounded-full border flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm">{item.quantity}</span>
                  <button onClick={() => setQty(item._id, item.quantity + 1)} className="w-6 h-6 rounded-full border flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => remove(item._id)} className="ml-auto text-gray-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex justify-between mb-3 font-semibold">
            <span>Subtotal</span>
            <span>Ksh{total / 100}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { closeDrawer(); navigate('/checkout'); }}
            className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-300 text-white py-3 rounded-full font-semibold"
          >Checkout</button>
        </div>
      </aside>
    </>
  );
}
EOF

cat > client/src/pages/Home.jsx <<'EOF'
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import CategoryScroll from '../components/CategoryScroll.jsx';
import ProductScroller from '../components/ProductScroller.jsx';

export default function Home() {
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const { data: popular = [] } = useQuery({ queryKey: ['menu', 'popular'], queryFn: () => api.get('/menu?popular=true').then(r => r.data) });
  const { data: latest = [] } = useQuery({ queryKey: ['menu', 'latest'], queryFn: () => api.get('/menu?latest=true').then(r => r.data) });

  return (
    <div className="pb-20">
      <section className="max-w-6xl mx-auto px-4 pt-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Hi there 👋</h1>
        <p className="text-gray-500 mt-2">Ready to order?</p>
      </section>
      <section className="mt-8">
        <CategoryScroll categories={categories} />
      </section>
      <ProductScroller title="Popular" items={popular} />
      <ProductScroller title="Latest"  items={latest} />
    </div>
  );
}
EOF

cat > client/src/pages/Categories.jsx <<'EOF'
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function Categories() {
  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="text-brand">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Categories</span>
      </nav>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <Link key={cat._id} to={`/category/${cat.slug}`} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              <img src={cat.icon} alt={cat.name} className="w-12 h-12 object-cover rounded-lg" />
            </div>
            <div>
              <h3 className="font-semibold">{cat.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">View products <ArrowRight className="w-3 h-3" /></p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
EOF

cat > client/src/pages/CategoryDetail.jsx <<'EOF'
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard.jsx';

export default function CategoryDetail() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['category', slug], queryFn: () => api.get(`/category/${slug}`).then(r => r.data) });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">Not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/categories" className="text-sm text-gray-600 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to categories
      </Link>
      <h1 className="text-2xl font-bold mb-6">{data.category.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.items.map(item => <ProductCard key={item._id} item={item} />)}
      </div>
    </div>
  );
}
EOF

cat > client/src/pages/SearchResults.jsx <<'EOF'
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

cat > client/src/pages/Account.jsx <<'EOF'
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
EOF

cat > client/src/pages/Login.jsx <<'EOF'
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try { await login(email, password); navigate(from, { replace: true }); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-6">Log in</h1>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-brand">{error}</p>}
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" />
        <button className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold">Log in</button>
        <p className="text-center text-sm text-gray-500">No account? <Link to="/register" className="text-brand">Register</Link></p>
      </form>
    </div>
  );
}
EOF

cat > client/src/pages/Register.jsx <<'EOF'
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try { await register(name, email, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Register failed'); }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-6">Create account</h1>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-brand">{error}</p>}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" />
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" />
        <button className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold">Register</button>
        <p className="text-center text-sm text-gray-500">Have an account? <Link to="/login" className="text-brand">Log in</Link></p>
      </form>
    </div>
  );
}
EOF

cat > client/src/pages/Checkout.jsx <<'EOF'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useCart } from '../store/cartStore';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [type, setType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const subtotalKsh = subtotal();
  const deliveryFee = type === 'delivery' ? 15000 : 0;
  const total = subtotalKsh + deliveryFee;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ menuItem: i._id, quantity: i.quantity })),
        address: { street, city },
        paymentMethod,
        type,
      };
      const { data } = await api.post('/orders', payload);
      clear();
      navigate(`/orders/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return <div className="max-w-lg mx-auto p-8 text-center text-gray-500">
      Cart is empty. <button onClick={() => navigate('/')} className="text-brand underline">Go shopping</button>
    </div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-brand">{error}</p>}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Order type</label>
          <div className="flex gap-2">
            {['delivery','pickup'].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 rounded-full border text-sm capitalize ${type === t ? 'bg-brand text-white border-brand' : 'border-gray-200'}`}>{t}</button>
            ))}
          </div>
        </div>
        {type === 'delivery' && (
          <>
            <input value={street} onChange={e => setStreet(e.target.value)} placeholder="Street address" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" required />
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" required />
          </>
        )}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Payment</label>
          <div className="flex gap-2">
            {[['cod','Cash on delivery'],['card','Card']].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setPaymentMethod(v)} className={`flex-1 py-2 rounded-full border text-sm ${paymentMethod === v ? 'bg-brand text-white border-brand' : 'border-gray-200'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>Ksh{subtotalKsh/100}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>Ksh{deliveryFee/100}</span></div>
          <div className="flex justify-between font-semibold text-base pt-2"><span>Total</span><span>Ksh{total/100}</span></div>
        </div>
        <button disabled={loading} className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-300 text-white py-3 rounded-full font-semibold">
          {loading ? 'Placing order…' : `Place order · Ksh${total/100}`}
        </button>
      </form>
    </div>
  );
}
EOF

cat > client/src/pages/Orders.jsx <<'EOF'
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => api.get('/orders/my').then(r => r.data) });
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My orders</h1>
      {orders.length === 0 && <p className="text-gray-500">No orders yet.</p>}
      <div className="space-y-3">
        {orders.map(o => (
          <Link key={o._id} to={`/orders/${o._id}`} className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md">
            <div className="flex justify-between">
              <span className="font-medium">#{o._id.slice(-6).toUpperCase()}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{o.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{o.items.length} item(s) · Ksh{o.total/100}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(o.createdAt).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
EOF

cat > client/src/pages/OrderDetail.jsx <<'EOF'
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import api from '../lib/api';

const STEPS = ['CREATED','PAID','PREPARING','READY','DELIVERING','COMPLETED'];

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Not found</div>;

  const currentIdx = STEPS.indexOf(order.status);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link to="/orders" className="text-sm text-gray-600 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> My orders
      </Link>
      <h1 className="text-2xl font-bold mb-1">Order #{order._id.slice(-6).toUpperCase()}</h1>
      <p className="text-sm text-gray-500 mb-6">{new Date(order.createdAt).toLocaleString()}</p>
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <Check className="w-4 h-4" /> : <span className="text-xs">{i + 1}</span>}
                </div>
                <span className={`text-sm ${done ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
        <h2 className="font-semibold mb-3">Items</h2>
        <div className="space-y-2 text-sm">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{i.quantity} × {i.name}</span>
              <span>Ksh{(i.price * i.quantity)/100}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-3 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>Ksh{order.subtotal/100}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>Ksh{order.deliveryFee/100}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>Ksh{order.total/100}</span></div>
        </div>
      </div>
    </div>
  );
}
EOF

# ============================================================
# ROOT PACKAGE
# ============================================================

cat > package.json <<'EOF'
{
  "name": "munch-clone",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "install:all": "npm install --prefix server && npm install --prefix client",
    "dev:server": "npm run dev --prefix server",
    "dev:client": "npm run dev --prefix client",
    "seed": "npm run seed --prefix server"
  }
}
EOF

cat > README.md <<'EOF'
# Munch Clone (MERN)

A food ordering web app built with MongoDB, Express, React, and Node.

## Setup

1. Start MongoDB locally.
2. `npm run install:all`
3. `npm run seed`
4. Terminal A: `npm run dev:server`
5. Terminal B: `npm run dev:client`
6. Open http://localhost:5173

## Features

- Browse categories, popular & latest items
- Search modal (tap "Are you hungry?")
- Slide-in cart drawer with quantity controls
- Account/menu drawer (hamburger icon)
- JWT auth (register/login)
- Checkout with delivery/pickup + COD/card
- Order tracking with progress steps

## Stack

- **Client:** React 18, Vite, Tailwind, React Router, Zustand, TanStack Query
- **Server:** Express, Mongoose, JWT, bcrypt
EOF

echo ""
echo "✅ Scaffold complete at $(pwd)"
echo ""
echo "Next steps:"
echo "  cd munch-clone"
echo "  npm run install:all"
echo "  npm run seed         # (start MongoDB first!)"
echo "  npm run dev:server   # terminal A"
echo "  npm run dev:client   # terminal B"
echo ""
echo "Then open: http://localhost:5173"
