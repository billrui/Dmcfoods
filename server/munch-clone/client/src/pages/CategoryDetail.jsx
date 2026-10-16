import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard.jsx';

export default function CategoryDetail() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['category', slug], queryFn: () => api.get(`/category/${slug}`).then(r => r.data) });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">Not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/categories" className="text-sm text-gray-600 flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to categories
      </Link>
      <h1 className="text-2xl font-bold mb-6">{data.category.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.items.map(item => <ProductCard key={item._id} item={item} />)}
      </div>
    </div>
  );
}
