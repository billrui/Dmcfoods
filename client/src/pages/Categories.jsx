import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function Categories() {
  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="text-brand">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Categories</span>
      </nav>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <Link key={cat._id} to={`/category/${cat.slug}`} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              <img src={cat.icon} alt={cat.name} className="w-12 h-12 object-cover rounded-lg" />
            </div>
            <div>
              <h3 className="font-semibold">{cat.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">View products <ArrowRight className="w-3 h-3" /></p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
