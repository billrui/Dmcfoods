import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useBranch } from './store/branchStore';
import Home from './pages/Home.jsx';
import Categories from './pages/Categories.jsx';
import CategoryDetail from './pages/CategoryDetail.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Orders from './pages/Orders.jsx';
import SearchResults from './pages/SearchResults.jsx';
import Collection from './pages/Collection.jsx';
import Favourites from './pages/Favourites.jsx';
import Cart from './pages/Cart.jsx';
import Profile from './pages/Profile.jsx';
import Help from './pages/Help.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Wallet from './pages/Wallet.jsx';
import Loyalty from './pages/Loyalty.jsx';

// Admin Pages
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import LoyaltyAdmin from './pages/admin/LoyaltyAdmin.jsx';
import AdminChangePassword from './pages/admin/AdminChangePassword.jsx';
import SuperRoute from './components/SuperRoute.jsx';
import SuperReport from './pages/admin/super/SuperReport.jsx';
import SuperActivity from './pages/admin/super/SuperActivity.jsx';
import SuperAdmins from './pages/admin/super/SuperAdmins.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminMenu from './pages/admin/Menu.jsx';
import AdminUsers from './pages/admin/UsersAdmin.jsx';
import AdminBranches from './pages/admin/Branches.jsx';
import DeliveryZonesAdmin from './pages/admin/DeliveryZones.jsx';
import PromoCodesAdmin from './pages/admin/PromoCodes.jsx';
import AdminCollections from './pages/admin/Collections.jsx';

// Components
import Header from './components/Header.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import FloatingCart from './components/FloatingCart.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

export default function App() {
  const location = useLocation();
  const fetchBranches = useBranch(s => s.fetchBranches);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);
  const isAdminRoute = location.pathname.startsWith('/dmc-console');

  return (
    <>
      {/* Hide customer header, cart, and floating cart on admin routes */}
      {!isAdminRoute && <Header />}
      {!isAdminRoute && <CartDrawer />}
      {!isAdminRoute && <FloatingCart />}

      <ToastContainer />

      <Routes>
        {/* Public Routes */}
        <Route path="/"               element={<Home />} />
        <Route path="/categories"     element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryDetail />} />
        <Route path="/menu/:id"       element={<ProductDetail />} />
        <Route path="/search"         element={<SearchResults />} />
        <Route path="/collection/:type" element={<Collection />} />
        <Route path="/favourites"     element={<Favourites />} />
        <Route path="/cart"           element={<Cart />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/help"           element={<Help />} />
        <Route path="/privacy"        element={<Privacy />} />
        <Route path="/terms"          element={<Terms />} />

        {/* Protected Customer Routes */}
                <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/checkout"       element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders"         element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id"     element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/wallet"         element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/loyalty"        element={<ProtectedRoute><Loyalty /></ProtectedRoute>} />

        {/* Hidden Admin Routes */}
        <Route path="/dmc-console/login"     element={<AdminLogin />} />
        <Route path="/dmc-console/loyalty"   element={<AdminRoute><LoyaltyAdmin /></AdminRoute>} />
        <Route path="/dmc-console/password"  element={<AdminRoute><AdminChangePassword /></AdminRoute>} />
        <Route path="/dmc-console/super"          element={<SuperRoute><SuperReport /></SuperRoute>} />
        <Route path="/dmc-console/super/activity" element={<SuperRoute><SuperActivity /></SuperRoute>} />
        <Route path="/dmc-console/super/admins"   element={<SuperRoute><SuperAdmins /></SuperRoute>} />
        <Route path="/dmc-console/login"     element={<AdminLogin />} />
        <Route path="/dmc-console"           element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/dmc-console/orders"    element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/dmc-console/menu"      element={<AdminRoute><AdminMenu /></AdminRoute>} />
        <Route path="/dmc-console/users"     element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/dmc-console/branches"  element={<AdminRoute><AdminBranches /></AdminRoute>} />
        <Route path="/dmc-console/delivery-zones" element={<AdminRoute><DeliveryZonesAdmin /></AdminRoute>} />
        <Route path="/dmc-console/promos" element={<AdminRoute><PromoCodesAdmin /></AdminRoute>} />
        <Route path="/dmc-console/collections" element={<AdminRoute><AdminCollections /></AdminRoute>} />
      </Routes>
    </>
  );
}
