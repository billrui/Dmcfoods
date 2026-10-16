import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard.jsx';

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get(`/menu?q=${encodeURIComponent(q)}`).then(r => r.data),
    enabled: !!q,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-gray-600 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back home
      </Link>
      <h1 className="text-xl font-bold mb-6">
        {isLoading ? 'Searching…' : `${items.length} result(s) for "${q}"`}
      </h1>
      {!isLoading && items.length === 0 && (
        <p className="text-gray-500">Nothing matched. Try a different word.</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => <ProductCard key={item._id} item={item} />)}
      </div>
    </div>
  );
}
