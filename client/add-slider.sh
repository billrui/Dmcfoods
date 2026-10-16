#!/usr/bin/env bash
set -e
[ -d src/components ] || { echo "❌ Run from client/"; exit 1; }

echo "➡️  Adding horizontal slider arrows…"

cat > src/components/ScrollRow.jsx <<'EOF'
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ScrollRow({ children, cardWidth = 208, gap = 16 }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, []);

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (cardWidth + gap) * 2, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll(-1)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20
                   w-10 h-10 rounded-full bg-white dark:bg-[#1A1D21]
                   border border-gray-200 dark:border-gray-700
                   shadow-md items-center justify-center hover:scale-105 transition"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5 text-brand" strokeWidth={3} />
      </button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth px-1"
      >
        {children}
      </div>

      <button
        onClick={() => scroll(1)}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20
                   w-10 h-10 rounded-full bg-white dark:bg-[#1A1D21]
                   border border-gray-200 dark:border-gray-700
                   shadow-md items-center justify-center hover:scale-105 transition"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5 text-brand" strokeWidth={3} />
      </button>
    </div>
  );
}
EOF

cat > src/components/ProductScroller.jsx <<'EOF'
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard.jsx';
import ScrollRow from './ScrollRow.jsx';

export default function ProductScroller({ title, items = [] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold dark:text-white">{title}</h2>
        <Link to="/categories" className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <ScrollRow>
        {items.map(item => <ProductCard key={item._id} item={item} />)}
      </ScrollRow>
    </section>
  );
}
EOF

cat > src/components/CategoryScroll.jsx <<'EOF'
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
EOF

echo "✅ Created/updated:"
echo "   src/components/ScrollRow.jsx"
echo "   src/components/ProductScroller.jsx"
echo "   src/components/CategoryScroll.jsx"
echo ""
echo "Restart Vite (Ctrl+C then npm run dev) or just hard-refresh."
