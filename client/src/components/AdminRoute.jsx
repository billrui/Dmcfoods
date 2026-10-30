import { Navigate, useLocation } from 'react-router-dom';
import AdminChangePassword from '../pages/admin/AdminChangePassword.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="force-dark min-h-screen bg-app p-8 text-center text-gray-500">Checking auth…</div>;
  }
  
  if (!user) return <Navigate to="/dmc-console/login" replace state={{ from: location }} />;
  
  if (!user.isAdmin) {
    return (
      <div className="force-dark min-h-screen bg-app flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 text-sm mb-6">
          Your account ({user.phone}) does not have administrator privileges.
        </p>
        <a href="/" className="bg-raised text-white px-6 py-2 rounded-full font-semibold">Back to Store</a>
      </div>
    );
  }
  
  if (user.mustChangePassword) return <AdminChangePassword forced />;

  return children;
}
