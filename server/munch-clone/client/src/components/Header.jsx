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
