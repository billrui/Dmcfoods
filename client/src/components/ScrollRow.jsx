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
    <div className="relative -mx-4 md:mx-0 px-4 md:px-6">
      <button onClick={() => scroll(-1)} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface border-2 border-brand items-center justify-center shadow-lg transition hover:scale-110">
        <ChevronLeft className="w-5 h-5 text-brand" strokeWidth={3} />
      </button>

      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
        {children}
      </div>

      <button onClick={() => scroll(1)} className="flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-surface border-2 border-brand items-center justify-center shadow-lg transition hover:scale-110">
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-brand" strokeWidth={3} />
      </button>
    </div>
  );
}
