import { Link } from 'react-router-dom';
import ScrollRow from './ScrollRow.jsx';

export default function CategoryScroll({ categories = [] }) {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <ScrollRow cardWidth={80} gap={16}>
        {categories.map(cat => (
          <Link
            key={cat._id}
            to={`/category/${cat.slug}`}
            className="flex flex-col items-center min-w-[80px] shrink-0"
          >
            <div className="w-20 h-20 bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
              <img src={cat.icon} alt={cat.name} className="w-14 h-14 object-cover rounded-lg" />
            </div>
            <span className="text-xs mt-2 text-gray-700 dark:text-gray-300">{cat.name}</span>
          </Link>
        ))}
      </ScrollRow>
    </div>
  );
}
