import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard.jsx';

export default function ProductScroller({ title, items = [] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{title}</h2>
        <Link to="/categories" className="text-sm text-gray-600 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map(item => <ProductCard key={item._id} item={item} />)}
      </div>
    </section>
  );
}
