import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import CategoryScroll from '../components/CategoryScroll.jsx';
import ProductScroller from '../components/ProductScroller.jsx';

export default function Home() {
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const { data: popular = [] } = useQuery({ queryKey: ['menu', 'popular'], queryFn: () => api.get('/menu?popular=true').then(r => r.data) });
  const { data: latest = [] } = useQuery({ queryKey: ['menu', 'latest'], queryFn: () => api.get('/menu?latest=true').then(r => r.data) });

  return (
    <div className="pb-20">
      <section className="max-w-6xl mx-auto px-4 pt-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Hi there 👋</h1>
        <p className="text-gray-500 mt-2">Ready to order?</p>
      </section>
      <section className="mt-8">
        <CategoryScroll categories={categories} />
      </section>
      <ProductScroller title="Popular" items={popular} />
      <ProductScroller title="Latest"  items={latest} />
    </div>
  );
}
