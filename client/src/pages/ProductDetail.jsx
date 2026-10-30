import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Minus, Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import api from '../lib/api';
import { useCart } from '../store/cartStore';
import { useFavourites } from '../store/favouritesStore';
import { useToast } from '../store/toastStore';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);

  const { data: item, isLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => api.get(`/menu/${id}`).then(r => r.data),
  });

  const add = useCart(s => s.add);
  const has = useFavourites(s => item ? s.has(item._id) : false);
  const toggle = useFavourites(s => s.toggle);
  const toast = useToast(s => s.show);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!item) return <div className="p-8 text-center text-gray-500">Not found</div>;

  const finalPrice = item.price - (item.discount || 0);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) add(item);
    toast(`${qty} × ${item.name} added to cart.`, { type: 'success' });
    navigate(-1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
      <button
        onClick={() => navigate(-1)}
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="relative bg-white dark:bg-card rounded-3xl overflow-hidden shadow-sm">
          {item.discount > 0 && (
            <span className="absolute top-4 left-4 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
              Ksh{item.discount / 100} OFF
            </span>
          )}
          <button
            onClick={() => toggle(item)}
            className="absolute top-4 right-4 bg-white/90 dark:bg-raised rounded-full p-2 shadow z-10"
            aria-label="Favourite"
          >
            <Heart className={`w-5 h-5 ${has ? 'text-brand fill-brand' : 'text-gray-400'}`} />
          </button>
          <div className="aspect-square bg-gray-100 dark:bg-raised">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 dark:text-white">{item.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {item.category?.name || 'Menu item'}
          </p>

          <div className="flex items-center gap-3 mb-6">
            {item.discount > 0 && (
              <span className="text-gray-400 line-through text-base">
                Ksh{item.price / 100}
              </span>
            )}
            <span className="text-3xl font-bold text-brand">
              Ksh{finalPrice / 100}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
            {item.description || `Freshly prepared ${item.name.toLowerCase()} at DMC Foods. Made to order with quality ingredients.`}
          </p>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium dark:text-white">Quantity</span>
            <div className="flex items-center gap-3 bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-raised"
              >
                <Minus className="w-4 h-4 dark:text-white" />
              </button>
              <span className="w-6 text-center font-semibold dark:text-white">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(20, q + 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-raised"
              >
                <Plus className="w-4 h-4 dark:text-white" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-brand hover:bg-brand-hover text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand/30"
          >
            <ShoppingBag className="w-5 h-5" />
            Add {qty} to cart · Ksh{(finalPrice * qty) / 100}
          </button>
        </div>
      </div>
    </div>
  );
}
