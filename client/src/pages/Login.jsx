import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Smartphone, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../store/toastStore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast(s => s.show);

  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) {
      toast('Please fill all fields.', { type: 'error' });
      return;
    }
    if (!isLogin && !form.name) {
      toast('Please enter your name.', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(form.phone, form.password);
        toast('Welcome back!', { type: 'success' });
      } else {
        await register(form.name, form.phone, form.password);
        toast('Account created successfully!', { type: 'success' });
      }
      navigate(from, { replace: true });
    } catch (err) {
      toast(err.response?.data?.error || 'Authentication failed.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1114] flex flex-col">
      <div className="p-6">
        <button onClick={() => navigate('/')} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-12">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-brand blur-2xl opacity-40" />
          <div className="relative w-20 h-20 rounded-full bg-brand flex items-center justify-center shadow-2xl">
            <Lock className="w-9 h-9 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-sm text-gray-400 mb-8 text-center max-w-xs">
          {isLogin 
            ? 'Log in with your phone number to manage your Dmcfoods orders.' 
            : 'Register to start ordering from Dmcfoods today.'}
        </p>

        <form onSubmit={submit} className="w-full max-w-md space-y-4">
          
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-transparent border border-gray-700 rounded-xl outline-none text-white placeholder:text-gray-600 focus:border-brand"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-transparent border border-gray-700 rounded-xl">
                <span className="text-sm text-white font-medium">+254</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.startsWith('0')) v = v.slice(1);
                  setForm({ ...form, phone: v.slice(0, 9) });
                }}
                placeholder="712345678"
                className="flex-1 px-4 py-3 bg-transparent border border-gray-700 rounded-xl outline-none text-white placeholder:text-gray-600 focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-transparent border border-gray-700 rounded-xl outline-none text-white placeholder:text-gray-600 focus:border-brand"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-700 text-white py-3 rounded-full font-semibold transition shadow-lg shadow-brand/30 mt-6"
          >
            {loading ? 'Processing…' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setForm({ name: '', phone: '', password: '' }); }}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="text-brand font-semibold">{isLogin ? 'Register' : 'Log In'}</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-8 text-center">
          By continuing you agree to our{' '}
          <Link to="/terms" className="text-brand hover:underline">Terms</Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
