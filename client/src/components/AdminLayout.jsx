import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, UtensilsCrossed,
  LogOut, Menu as MenuIcon, ExternalLink, MapPin, Navigation, Ticket,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { path: '/dmc-console',           label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dmc-console/orders',    label: 'Orders',    icon: ShoppingBag },
  { path: '/dmc-console/menu',      label: 'Menu',      icon: UtensilsCrossed },
  { path: '/dmc-console/users',     label: 'Users',     icon: Users },
  { path: '/dmc-console/branches',  label: 'Branches',  icon: MapPin },
  { path: '/dmc-console/delivery-zones', label: 'Delivery Zones', icon: Navigation },
  { path: '/dmc-console/promos', label: 'Promo Codes', icon: Ticket },
];

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = () => (
    <aside className="w-64 bg-[#14171A] border-r border-gray-800 flex flex-col h-screen">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Dmcfoods</p>
          <p className="text-[10px] text-gray-500 tracking-wider">ADMIN</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
            || (path !== '/dmc-console' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? 'bg-brand text-white'
                  : 'text-gray-400 hover:bg-[#23272B] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-[#23272B] hover:text-white"
        >
          <ExternalLink className="w-4 h-4" /> View store
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand hover:bg-red-950/20"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#0F1114] text-white flex">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40 md:hidden" />
          <div className="fixed top-0 left-0 z-50 md:hidden">
            <Sidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#14171A] border-b border-gray-800 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-[#23272B]"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.phone || user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold">
              {(user?.name?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
