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
