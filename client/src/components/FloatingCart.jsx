import { ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../store/cartStore';

export default function FloatingCart() {
  const count      = useCart(s => s.count());
  const subtotal   = useCart(s => s.subtotal());
  const drawerOpen = useCart(s => s.drawerOpen);
  const items      = useCart(s => s.items);
  const location   = useLocation();

  const hiddenRoutes = ['/checkout', '/dmc-console', '/login', '/register'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  if (count === 0 || drawerOpen) return null;

  const displayImages = items.slice(0, 2);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
      <div className="bg-card border border-gray-800 shadow-2xl rounded-full px-2 py-2 flex items-center justify-between">
        
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex -space-x-2">
            {displayImages.map((img, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-card overflow-hidden shrink-0">
                <img src={img.image} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-col ml-1">
            <span className="text-[10px] font-semibold text-white leading-none">{count} Item{count !== 1 ? 's' : ''}</span>
            <span className="text-[9px] text-gray-400 leading-none mt-0.5">Subtotal <span className="text-brand font-bold">Ksh{subtotal / 100}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="px-3 py-1.5 rounded-full border border-gray-700 text-[11px] font-semibold text-white hover:bg-raised transition">
            View cart
          </Link>
          <Link to="/checkout" className="px-4 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-[11px] font-bold text-white shadow-lg transition">
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
