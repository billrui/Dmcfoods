import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import api from '../lib/api';
import { useCart } from '../store/cartStore';

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const add = useCart(s => s.add);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
    enabled: open,
  });

  const { data: popular = [] } = useQuery({
    queryKey: ['menu', 'popular'],
    queryFn: () => api.get('/menu?popular=true').then(r => r.data),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 md:pt-24"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 md:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg">Search</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="mb-6">
          <div className="flex items-center gap-3 border-2 border-brand rounded-full px-5 py-3">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Are you hungry?"
              className="flex-1 outline-none text-sm bg-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-2">
            Search for what you're craving
          </p>
        </form>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
            CATEGORIES
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => { onClose(); navigate(`/category/${cat.slug}`); }}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-800 hover:border-brand hover:text-brand transition"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
            POPULAR PICKS
          </h3>
          <div className="flex flex-wrap gap-2">
            {popular.slice(0, 12).map(item => (
              <button
                key={item._id}
                onClick={() => { add(item); onClose(); }}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-800 hover:border-brand hover:text-brand transition"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
