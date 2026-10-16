#!/usr/bin/env bash
set -e
[ -d src/components ] || { echo "❌ Run from client/"; exit 1; }

echo "🍔 Adding category grid + card variant…"

# ------------------------------------------------------------
# Grid-friendly ProductCard (fills its grid cell)
# ------------------------------------------------------------
cat > src/components/ProductCardGrid.jsx <<'EOF'
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
EOF

# ------------------------------------------------------------
# Updated CategoryDetail page
# ------------------------------------------------------------
cat > src/pages/CategoryDetail.jsx <<'EOF'
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import ProductCardGrid from '../components/ProductCardGrid.jsx';

export default function CategoryDetail() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => api.get(`/category/${slug}`).then(r => r.data),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }
  if (!data) {
    return <div className="p-8 text-center text-gray-500">Not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="text-sm mb-6 flex items-center gap-2">
        <Link to="/" className="text-brand flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-3 h-3" /> Home
        </Link>
        <span className="font-semibold text-gray-900 dark:text-white capitalize">
          {data.category.name}
        </span>
      </nav>

      {/* Top actions */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-semibold text-brand">Discover all</span>
        <Link to="/" className="text-sm font-semibold text-brand hover:underline">
          View home
        </Link>
      </div>

      {/* Empty state */}
      {data.items.length === 0 && (
        <p className="text-center text-gray-500 py-12">
          No items in this category yet.
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {data.items.map(item => (
          <ProductCardGrid key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}
EOF

echo "✅ Created/updated:"
echo "   src/components/ProductCardGrid.jsx"
echo "   src/pages/CategoryDetail.jsx"
echo ""
echo "Restart Vite: Ctrl+C then npm run dev"
