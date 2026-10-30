import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, User, ShoppingBag, Menu as MenuIcon, Moon, Sun, ChevronDown } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { useTheme } from '../store/themeStore';
import { useBranch, getBranchStatus } from '../store/branchStore';
import SearchModal from './SearchModal.jsx';
import MenuDrawer from './MenuDrawer.jsx';
import BranchModal from './BranchModal.jsx';
import BrandMark from './BrandMark.jsx';
import { theme as shopTheme } from '../theme';

export default function Header() {
  const count = useCart(s => s.count());
  const { theme, toggle } = useTheme();
  const { branch, fetchBranches } = useBranch();
  const bStatus = branch ? getBranchStatus(branch) : 'CLOSED';

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark' || shopTheme.forceDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    fetchBranches();
  }, [theme, fetchBranches]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-app border-b border-surface-border pt-3 pb-3 px-4 md:px-6">

        {/* Desktop Header */}
        <div className="hidden md:flex max-w-7xl mx-auto h-16 items-center gap-6">
          <BrandMark />
          <nav className="flex gap-8 text-sm shrink-0">
            <Link to="/" className="text-brand font-semibold">Home</Link>
            <Link to="/categories" className="text-gray-400 hover:text-white transition">Categories</Link>
          </nav>
          <div className="flex-1 max-w-xl">
            <button onClick={() => setSearchOpen(true)} className="w-full flex items-center gap-3 bg-surface border border-surface-border rounded-full px-5 py-2.5 hover:border-gray-600 transition">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Are you hungry?</span>
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={toggle} hidden={shopTheme.forceDark} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface transition">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-300" /> : <Moon className="w-5 h-5 text-gray-300" />}
            </button>
            <button onClick={() => setBranchOpen(true)} className="flex items-center gap-2 bg-surface border border-surface-border rounded-full px-4 py-2 hover:border-gray-600 transition">
              <span className="text-sm text-gray-200 font-medium">{branch?.name || 'Select Branch'}</span>
              <span className={`text-[10px] font-bold ${bStatus === 'CLOSED' ? 'text-red-500' : 'text-green-500'}`}>{bStatus}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <Link to="/favourites" className="p-2 text-gray-400 hover:text-white"><Heart className="w-5 h-5" /></Link>
            <Link to="/cart" className="relative p-2 text-gray-400 hover:text-white">
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && <span className="absolute top-0 right-0 bg-brand text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{count}</span>}
            </Link>
            <Link to="/profile" className="p-2 text-gray-400 hover:text-white"><User className="w-5 h-5" /></Link>
            <button onClick={() => setMenuOpen(true)} className="p-2 text-brand"><MenuIcon className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden max-w-lg mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <BrandMark size="sm" />
            <div className="flex items-center gap-3">
              <button onClick={toggle} hidden={shopTheme.forceDark} className="p-1 text-gray-300" aria-label="Switch light/dark">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
              <Link to="/favourites" className="p-1 text-gray-300"><Heart className="w-5 h-5" /></Link>
              <Link to="/cart" className="relative p-1 text-gray-300">
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && <span className="absolute top-0 right-0 bg-brand text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{count}</span>}
              </Link>
              <Link to="/profile" className="p-1 text-gray-300"><User className="w-5 h-5" /></Link>
              <button onClick={() => setMenuOpen(true)} className="p-1 text-brand"><MenuIcon className="w-6 h-6" /></button>
            </div>
          </div>

          <button onClick={() => setSearchOpen(true)} className="w-full flex items-center gap-3 bg-surface border border-surface-border rounded-full px-4 py-2.5">
            <Search className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-400">Are you hungry?</span>
          </button>

          <button onClick={() => setBranchOpen(true)} className="w-full flex items-center justify-between bg-surface border border-surface-border rounded-full px-4 py-2.5">
            <span className="text-sm text-gray-200 font-medium">{branch?.name || 'Select Branch'}</span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${bStatus === 'CLOSED' ? 'text-red-500' : 'text-green-500'}`}>{bStatus}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <BranchModal open={branchOpen} onClose={() => setBranchOpen(false)} />
    </>
  );
}
