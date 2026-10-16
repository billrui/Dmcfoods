import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, User, ShoppingBag, Menu as MenuIcon, Moon, Sun, ChevronDown } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { useTheme } from '../store/themeStore';
import { useBranch } from '../store/branchStore';
import SearchModal from './SearchModal.jsx';
import MenuDrawer from './MenuDrawer.jsx';
import BranchModal from './BranchModal.jsx';

export default function Header() {
  const count = useCart(s => s.count());
  const { theme, toggle } = useTheme();
  const { branch } = useBranch();

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);

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

            {/* Branch selector — opens modal */}
            <button
              onClick={() => setBranchOpen(true)}
              className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 hover:border-gray-300 dark:hover:border-gray-600"
            >
              <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{branch.name}</span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wide">{branch.status}</span>
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
      <BranchModal open={branchOpen} onClose={() => setBranchOpen(false)} />
    </>
  );
}
