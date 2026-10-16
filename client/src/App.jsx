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
