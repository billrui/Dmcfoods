import { Plus, Heart } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { useFavourites } from '../store/favouritesStore';

export default function ProductCardGrid({ item }) {
  const add = useCart(s => s.add);
  const has = useFavourites(s => s.has(item._id));
  const toggle = useFavourites(s => s.toggle);

  const finalPrice = item.price - (item.discount || 0);
  const hasDiscount = item.discount > 0;

  return (
    <div className="relative bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm overflow-hidden">
      {/* Discount badge */}
      {hasDiscount && (
        <span className="absolute top-3 left-3 bg-brand text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
          Ksh{item.discount / 100} OFF
        </span>
      )}

      {/* Heart */}
      <button
        onClick={() => toggle(item)}
        className="absolute top-3 right-3 bg-white/90 dark:bg-[#23272B] rounded-full p-1.5 shadow z-10"
        aria-label="Favourite"
      >
        <Heart className={`w-4 h-4 ${has ? 'text-brand fill-brand' : 'text-gray-400'}`} />
      </button>

      {/* Image */}
      <div className="h-40 bg-gray-100 dark:bg-[#23272B]">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Add button overlapping */}
      <div className="flex justify-center -mt-4 relative z-10">
        <button
          onClick={() => add(item)}
          className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-5 py-1.5 rounded-full flex items-center gap-1 shadow"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {/* Content */}
      <div className="p-4 pt-3">
        <h3 className="font-semibold text-sm line-clamp-1 dark:text-white">{item.name}</h3>
        <div className="mt-1 flex items-center gap-2">
          {hasDiscount && (
            <span className="text-gray-400 line-through text-xs">
              Ksh{item.price / 100}
            </span>
          )}
          <span className={`text-sm font-medium ${hasDiscount ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
            Ksh{finalPrice / 100}
          </span>
        </div>
      </div>
    </div>
  );
}
