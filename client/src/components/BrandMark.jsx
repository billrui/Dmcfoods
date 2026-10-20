import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function BrandMark({ withText = true }) {
  const [errored, setErrored] = useState(false);

  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center overflow-hidden">
        {!errored ? (
          <img
            src="/logo.png"
            alt="Dmcfoods"
            className="w-full h-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M6 10h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" />
            <circle cx="8" cy="6" r="2" />
            <circle cx="16" cy="6" r="2" />
          </svg>
        )}
      </div>
      {withText && (
        <span className="hidden md:inline font-bold text-lg tracking-tight dark:text-white">
          Dmcfoods
        </span>
      )}
    </Link>
  );
}
