import { Link } from 'react-router-dom';

export default function CategoryScroll({ categories = [] }) {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <Link key={cat._id} to={`/category/${cat.slug}`} className="flex flex-col items-center min-w-[80px]">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
              <img src={cat.icon} alt={cat.name} className="w-14 h-14 object-cover rounded-lg" />
            </div>
            <span className="text-xs mt-2 text-gray-700">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
