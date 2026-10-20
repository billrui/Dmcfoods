import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-[#0F1114] p-8 text-center text-gray-500">Checking auth…</div>;
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F1114] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Not Logged In</h1>
        <p className="text-gray-400 text-sm mb-6">You need to log in to access this area.</p>
        <a href="/login" className="bg-brand text-white px-6 py-2 rounded-full font-semibold">Log In</a>
      </div>
    );
  }
  
  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F1114] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 text-sm mb-6">
          Your account ({user.phone}) does not have administrator privileges.
        </p>
        <a href="/" className="bg-[#23272B] text-white px-6 py-2 rounded-full font-semibold">Back to Store</a>
      </div>
    );
  }
  
  return children;
}
