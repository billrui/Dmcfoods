import { Plus, Heart } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { useFavourites } from '../store/favouritesStore';

export default function ProductCard({ item }) {
  const add = useCart(s => s.add);
  const has = useFavourites(s => s.has(item._id));
  const toggle = useFavourites(s => s.toggle);
  const finalPrice = item.price - (item.discount || 0);

  return (
    <div className="relative w-48 bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm overflow-hidden shrink-0">
      {item.isPopular && (
        <span className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-0.5 rounded-full z-10">popular</span>
      )}
      {item.discount > 0 && (
        <span className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-0.5 rounded-full z-10">Ksh{item.discount / 100} OFF</span>
      )}
      <button
        onClick={() => toggle(item)}
        className="absolute top-2 right-2 bg-white dark:bg-[#23272B] rounded-full p-1.5 shadow z-10"
        aria-label="Favourite"
      >
        <Heart className={`w-4 h-4 ${has ? 'text-brand fill-brand' : 'text-gray-400'}`} />
      </button>
      <div className="h-40 bg-gray-100 dark:bg-[#23272B]">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex justify-center -mt-4 relative z-10">
        <button onClick={() => add(item)} className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-1 shadow">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="p-3 pt-2">
        <h3 className="font-semibold text-sm line-clamp-1 dark:text-white">{item.name}</h3>
        <div className="mt-1 flex items-center gap-2">
          {item.discount > 0 && (<span className="text-gray-400 line-through text-xs">Ksh{item.price / 100}</span>)}
          <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">Ksh{finalPrice / 100}</span>
        </div>
      </div>
    </div>
  );
}
