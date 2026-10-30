import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Plus } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../store/cartStore';
import { useFavourites } from '../store/favouritesStore';
import { useToast } from '../store/toastStore';
import ScrollRow from '../components/ScrollRow.jsx';
import ProductDetailModal from '../components/ProductDetailModal.jsx';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const { data: collections = [], isLoading } = useQuery({ queryKey: ['collections'], queryFn: () => api.get('/collections').then(r => r.data) });
  const { data: allItems = [] } = useQuery({ queryKey: ['menu', 'all'], queryFn: () => api.get('/menu').then(r => r.data) });

  const popularCol = collections.find(c => c.slug === 'popular');
  const latestCol = collections.find(c => c.slug === 'latest');
  const offersCol = collections.find(c => c.slug === 'todays-offers');
  const filteredAllFoods = allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="pb-24 md:pb-20 bg-app min-h-screen">
      
      <section className="max-w-6xl mx-auto px-4 pt-6 pb-4 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Hi {user?.name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="text-gray-400 mt-1 text-sm">Ready to order?</p>
      </section>

      <section className="max-w-6xl mx-auto mb-8">
        <ScrollRow cardWidth={88} gap={12}>
          {categories.map(cat => (
            <button key={cat._id} onClick={() => navigate(`/category/${cat.slug}`)} className="flex flex-col items-center min-w-[72px]">
              <div className="w-16 h-16 bg-surface border border-surface-border rounded-2xl flex items-center justify-center overflow-hidden mb-2 shadow-sm">
                <img src={cat.icon} alt={cat.name} className="w-10 h-10 object-cover rounded-lg" />
              </div>
              <span className="text-[11px] text-gray-300 font-medium">{cat.name}</span>
            </button>
          ))}
        </ScrollRow>
      </section>

      {isLoading ? <p className="text-center text-gray-500">Loading…</p> : (
        <>
          {popularCol && popularCol.items.length > 0 && (
            <section className="max-w-6xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-4 px-4 md:px-6">
                <h2 className="section-title">Popular</h2>
                <button onClick={() => navigate(`/collection/${popularCol.slug}`)} className="text-xs bg-surface text-brand px-4 py-1.5 rounded-full border border-surface-border flex items-center gap-1 hover:bg-raised transition">View all <ArrowRight className="w-3 h-3" /></button>
              </div>
              <ScrollRow cardWidth={176} gap={16}>
                {popularCol.items.map(item => <VerticalCard key={item._id} item={item} onOpen={() => setSelectedItem(item)} />)}
              </ScrollRow>
            </section>
          )}

          {latestCol && latestCol.items.length > 0 && (
            <section className="max-w-6xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-4 px-4 md:px-6">
                <h2 className="section-title">Latest</h2>
                <button onClick={() => navigate(`/collection/${latestCol.slug}`)} className="text-xs bg-surface text-brand px-4 py-1.5 rounded-full border border-surface-border flex items-center gap-1 hover:bg-raised transition">View all <ArrowRight className="w-3 h-3" /></button>
              </div>
              <ScrollRow cardWidth={288} gap={16}>
                {latestCol.items.map(item => <HorizontalListCard key={item._id} item={item} onOpen={() => setSelectedItem(item)} />)}
              </ScrollRow>
            </section>
          )}

          {offersCol && offersCol.items.length > 0 && (
            <section className="max-w-6xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-4 px-4 md:px-6">
                <h2 className="section-title">Today's Offers</h2>
                <button onClick={() => navigate(`/collection/${offersCol.slug}`)} className="text-xs bg-surface text-brand px-4 py-1.5 rounded-full border border-surface-border flex items-center gap-1 hover:bg-raised transition">View all <ArrowRight className="w-3 h-3" /></button>
              </div>
              <div className="px-4 md:px-6">
                <div className="bg-surface border border-surface-border rounded-3xl py-4">
                  <ScrollRow cardWidth={176} gap={16}>
                    {offersCol.items.map(item => <SquareCard key={item._id} item={item} onOpen={() => setSelectedItem(item)} />)}
                  </ScrollRow>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">All foods</h2>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search foods..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-surface border border-surface-border rounded-full px-4 py-1.5 text-xs text-white outline-none focus:border-brand" />
            <button className="text-xs text-brand font-semibold flex items-center gap-1">Sort <ArrowRight className="w-3 h-3 rotate-90" /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAllFoods.map(item => <GridCard key={item._id} item={item} onOpen={() => setSelectedItem(item)} />)}
        </div>
      </section>

      <ProductDetailModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}

function VerticalCard({ item, onOpen }) {
  const add = useCart(s => s.add); const [qty, setQty] = useState(0); const has = useFavourites(s => s.has(item._id)); const toggle = useFavourites(s => s.toggle); const toast = useToast(s => s.show);
  const handleAdd = (e) => { e.preventDefault(); e.stopPropagation(); add(item, [], 1); setQty(q => q + 1); toast(`${item.name} added`, { type: 'success' }); };

  return (
    <div onClick={onOpen} className="relative w-44 bg-surface border border-surface-border rounded-2xl overflow-hidden shrink-0 cursor-pointer hover:border-gray-500 transition">
      {item.isPopular && <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded z-10">popular</span>}
      {item.discount > 0 && <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded z-10">Ksh{item.discount / 100} OFF</span>}
      <button onClick={(e) => { e.preventDefault(); toggle(item); }} className="absolute top-2 right-2 bg-black/40 rounded-full p-1.5 z-10"><Heart className={`w-3.5 h-3.5 ${has ? 'text-brand fill-brand' : 'text-white'}`} /></button>
      <div className="h-32 bg-raised"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
      <div className="p-3">
        <h3 className="font-semibold text-xs text-white truncate mb-1">{item.name}</h3>
        <p className="text-xs text-gray-400 font-medium mb-3">Ksh{(item.price - (item.discount || 0)) / 100}</p>
        {qty > 0 ? (
          <div className="flex items-center justify-between bg-sunken border border-gray-700 rounded-full p-1">
            <button className="w-6 h-6 rounded-full flex items-center justify-center text-white">-</button><span className="text-xs text-white font-bold">{qty}</span><button onClick={handleAdd} className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white">+</button>
          </div>
        ) : (
          <button onClick={handleAdd} className="w-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold py-1.5 rounded-full flex items-center justify-center gap-1">+ Add</button>
        )}
      </div>
    </div>
  );
}

function HorizontalListCard({ item, onOpen }) {
  const add = useCart(s => s.add); const has = useFavourites(s => s.has(item._id)); const toggle = useFavourites(s => s.toggle); const toast = useToast(s => s.show);

  return (
    <div onClick={onOpen} className="relative w-[300px] bg-surface border border-surface-border rounded-2xl p-3 flex items-center gap-3 shrink-0 cursor-pointer hover:border-gray-500 transition">
      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-raised">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        {item.discount > 0 && <span className="absolute top-1 left-1 bg-brand text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Ksh{item.discount / 100} OFF</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-white truncate">{item.name}</h3>
          <button onClick={(e) => { e.preventDefault(); toggle(item); }} className="p-1 text-gray-400 hover:text-white shrink-0"><Heart className={`w-4 h-4 ${has ? 'text-brand fill-brand' : ''}`} /></button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {item.discount > 0 && <span className="text-[10px] text-gray-500 line-through">Ksh{item.price / 100}</span>}
          <p className="text-sm font-medium text-brand">Ksh{(item.price - (item.discount || 0)) / 100}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); add(item, [], 1); toast('Added'); }} className="mt-2 bg-brand hover:bg-brand-hover text-white text-[10px] font-semibold px-3 py-1 rounded-full flex items-center gap-1"><Plus className="w-2.5 h-2.5" /> Add</button>
      </div>
    </div>
  );
}

function SquareCard({ item, onOpen }) {
  const add = useCart(s => s.add); const has = useFavourites(s => s.has(item._id)); const toggle = useFavourites(s => s.toggle); const toast = useToast(s => s.show);

  return (
    <div onClick={onOpen} className="relative w-44 bg-surface border border-surface-border rounded-xl overflow-hidden shrink-0 cursor-pointer hover:border-gray-500 transition">
      {item.discount > 0 && <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded z-10">Ksh{item.discount / 100} OFF</span>}
      <button onClick={(e) => { e.preventDefault(); toggle(item); }} className="absolute top-2 right-2 bg-black/40 rounded-full p-1.5 z-10"><Heart className={`w-3.5 h-3.5 ${has ? 'text-brand fill-brand' : 'text-white'}`} /></button>
      <div className="h-32 bg-raised"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
      <div className="p-3">
        <h3 className="font-semibold text-xs text-white truncate mb-1">{item.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          {item.discount > 0 && <span className="text-[10px] text-gray-500 line-through">Ksh{item.price / 100}</span>}
          <p className="text-xs text-brand font-medium">Ksh{(item.price - (item.discount || 0)) / 100}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); add(item, [], 1); toast('Added'); }} className="w-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold py-1.5 rounded-full flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Add</button>
      </div>
    </div>
  );
}

function GridCard({ item, onOpen }) {
  const add = useCart(s => s.add); const has = useFavourites(s => s.has(item._id)); const toggle = useFavourites(s => s.toggle); const finalPrice = item.price - (item.discount || 0);

  return (
    <div onClick={onOpen} className="bg-surface border border-surface-border rounded-2xl p-3 flex flex-col cursor-pointer hover:border-gray-500 transition">
      <div className="relative aspect-square bg-raised rounded-xl overflow-hidden mb-3">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        {item.isPopular && <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded">popular</span>}
        {item.discount > 0 && <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded">Ksh{item.discount / 100} OFF</span>}
        <button onClick={(e) => { e.stopPropagation(); toggle(item); }} className="absolute top-2 right-2 bg-black/40 rounded-full p-1.5"><Heart className={`w-3.5 h-3.5 ${has ? 'text-brand fill-brand' : 'text-white'}`} /></button>
        <button onClick={(e) => { e.stopPropagation(); add(item, [], 1); }} className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
      </div>
      <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
      <p className="text-xs font-medium text-gray-400 mt-1">Ksh{finalPrice / 100}</p>
    </div>
  );
}
