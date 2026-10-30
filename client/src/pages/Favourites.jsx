import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavourites } from '../store/favouritesStore';
import ProductCard from '../components/ProductCard.jsx';

export default function Favourites() {
  const items = useFavourites(s => s.items);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-12 text-center">
          <Heart className="w-8 h-8 mx-auto text-gray-400 mb-4" />
          <h1 className="text-lg font-bold mb-2 dark:text-white">Favourites</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            You have not saved any dishes yet. Tap the heart on a product to add it here.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6 dark:text-white">Favourites</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => <ProductCard key={item._id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}
