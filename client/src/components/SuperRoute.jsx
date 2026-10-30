import { Crown } from 'lucide-react';
import AdminRoute from './AdminRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function SuperRoute({ children }) {
  return <AdminRoute><SuperOnly>{children}</SuperOnly></AdminRoute>;
}

function SuperOnly({ children }) {
  const { user } = useAuth();
  if (user?.isSuperAdmin) return children;
  return (
    <div className="force-dark min-h-screen bg-app flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4"><Crown className="w-6 h-6 text-amber-400" /></div>
      <h1 className="text-xl font-bold text-white mb-2">Super admin only</h1>
      <p className="text-gray-400 text-sm mb-6">Only the owner’s account can open this page.</p>
      <a href="/dmc-console" className="bg-raised text-white px-6 py-2 rounded-full font-semibold">Back to dashboard</a>
    </div>
  );
}
