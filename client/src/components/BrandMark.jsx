import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Leaf, Flame, MoonStar } from 'lucide-react';
import { theme, BRAND_NAME } from '../theme';

const ICONS = { leaf: Leaf, flame: Flame, moon: MoonStar };

// Logo: uses /logo.png if you add one to client/public, otherwise an icon + "DMC Flavours"
export default function BrandMark({ withText = true, size = 'md' }) {
  const [errored, setErrored] = useState(false);
  const Icon = ICONS[theme.icon] || Leaf;
  const box = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';

  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label={BRAND_NAME}>
      <div className={`${box} rounded-xl bg-brand flex items-center justify-center overflow-hidden shadow-lg shadow-brand/20`}>
        {!errored ? (
          <img src="/logo.png" alt="" className="w-full h-full object-cover" onError={() => setErrored(true)} />
        ) : (
          <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
        )}
      </div>
      {withText && (
        <span className="leading-none">
          <span className="block font-display font-extrabold text-[15px] sm:text-[17px] tracking-tight whitespace-nowrap text-white">{BRAND_NAME}</span>
          <span className="hidden sm:block text-[10px] text-gray-400 mt-1">{theme.tagline}</span>
        </span>
      )}
    </Link>
  );
}
