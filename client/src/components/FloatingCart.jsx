import { ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../store/cartStore';

export default function FloatingCart() {
  const count      = useCart(s => s.count());
  const subtotal   = useCart(s => s.subtotal());
  const drawerOpen = useCart(s => s.drawerOpen);
  const items      = useCart(s => s.items);
  const location   = useLocation();

  // Hide ONLY on checkout, admin, and auth pages. 
  // We leave it visible on /cart so the user can see what's in their cart.
  const hiddenRoutes = ['/checkout', '/admin', '/login', '/register'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  if (count === 0 || drawerOpen) return null;

  const displayImages = items.slice(0, 2);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-[slideUp_0.3s_ease-out]">
      <div className="bg-[#1A1D21] border border-gray-800 shadow-2xl rounded-full px-2 py-2 flex items-center gap-4">

        <div className="flex items-center gap-2 pl-2">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>

          <div className="flex -space-x-2">
            {displayImages.map((img, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1A1D21] overflow-hidden shrink-0">
                <img src={img.image} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="flex flex-col ml-1">
            <span className="text-xs font-semibold text-white leading-none mb-1">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
            <span className="text-[10px] text-gray-400 leading-none">
              Subtotal <span className="text-brand font-bold">Ksh{subtotal / 100}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <Link
            to="/cart"
            className="px-4 py-2 rounded-full border border-gray-700 text-xs font-semibold text-white hover:bg-[#23272B] transition"
          >
            View cart
          </Link>
          <Link
            to="/checkout"
            className="px-5 py-2 rounded-full bg-brand hover:bg-brand-hover text-xs font-bold text-white shadow-lg shadow-brand/20 transition"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
