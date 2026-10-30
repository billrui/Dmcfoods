import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Plus, Minus, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import api from '../lib/api';
import { useCart } from '../store/cartStore';
import { useFavourites } from '../store/favouritesStore';
import { useToast } from '../store/toastStore';

export default function Collection() {
  const { type } = useParams(); // 'popular', 'latest', 'chefs-recommendations', 'todays-offers'
  const navigate = useNavigate();

  // Determine title based on type
  const titles = {
    'popular': 'Local eats',
    'latest': 'Flavorful set',
    'chefs-recommendations': "Chef's recommendations",
    'todays-offers': "Today's Offers"
  };
  const pageTitle = titles[type] || 'Menu';

  // Fetch items based on type
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menu', type],
    queryFn: () => {
      let url = '/menu';
      if (type === 'popular') url += '?popular=true';
      else if (type === 'latest') url += '?latest=true';
      // For 'chefs-recommendations' or 'todays-offers', fetch all and we can slice
      return api.get(url).then(r => r.data);
    },
  });

  const isListView = type === 'latest'; // The "Flavorful set" is a vertical list

  return (
    <div className="min-h-screen bg-app pb-24">
      
      {/* Top Breadcrumb */}
      <div className="sticky top-0 z-30 bg-app/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-card rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center text-xs">
            <Link to="/" className="text-brand font-medium">← Home</Link>
            <span className="text-gray-500 mx-2">/</span>
            <span className="text-white font-bold">{pageTitle}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-brand text-sm font-semibold">Discover all</span>
          <Link to="/" className="text-brand text-sm font-semibold hover:underline">View home</Link>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : (
          <>
            {isListView ? (
              // VERTICAL LIST LAYOUT (Flavorful Set)
              <div className="space-y-4">
                {items.map(item => (
                  <ListCard key={item._id} item={item} />
                ))}
              </div>
            ) : (
              // GRID LAYOUT (Local eats, Chef's recommendations)
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {items.map(item => (
                  <GridCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Vertical List Card (For 'Flavorful set') ───
function ListCard({ item }) {
  const add = useCart(s => s.add);
  const has = useFavourites(s => s.has(item._id));
  const toggle = useFavourites(s => s.toggle);
  const toast = useToast(s => s.show);

  return (
    <div className="bg-card border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-raised">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        {item.discount > 0 && (
          <span className="absolute top-1 left-1 bg-brand text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
            Ksh{item.discount / 100} OFF
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
          <button onClick={() => toggle(item)} className="p-1 text-gray-400 hover:text-white shrink-0">
            <Heart className={`w-4 h-4 ${has ? 'text-brand fill-brand' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {item.discount > 0 && <span className="text-[10px] text-gray-500 line-through">Ksh{item.price / 100}</span>}
          <p className="text-sm font-medium text-brand">Ksh{(item.price - (item.discount || 0)) / 100}</p>
        </div>
      </div>
      <button onClick={() => { add(item, [], 1); toast(`${item.name} added`); }} className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1 shadow shrink-0">
        <Plus className="w-3 h-3" /> Add
      </button>
    </div>
  );
}

// ─── Grid Card (For 'Local eats' & 'Chef's recommendations') ───
function GridCard({ item }) {
  const add = useCart(s => s.add);
  const has = useFavourites(s => s.has(item._id));
  const toggle = useFavourites(s => s.toggle);
  const navigate = useNavigate();

  const finalPrice = item.price - (item.discount || 0);

  return (
    <div onClick={() => navigate(`/menu/${item._id}`)} className="bg-card border border-gray-800 rounded-2xl p-3 flex flex-col cursor-pointer hover:border-gray-600 transition">
      <div className="relative aspect-square bg-raised rounded-xl overflow-hidden mb-3">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        {item.isPopular && <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded">popular</span>}
        {item.discount > 0 && <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded">Ksh{item.discount / 100} OFF</span>}
        <button onClick={(e) => { e.stopPropagation(); toggle(item); }} className="absolute top-2 right-2 bg-black/40 rounded-full p-1.5">
          <Heart className={`w-3.5 h-3.5 ${has ? 'text-brand fill-brand' : 'text-white'}`} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); add(item, [], 1); }} className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
      <p className="text-xs font-medium text-gray-400 mt-1">Ksh{finalPrice / 100}</p>
    </div>
  );
}
