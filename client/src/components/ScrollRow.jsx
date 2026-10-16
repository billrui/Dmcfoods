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
