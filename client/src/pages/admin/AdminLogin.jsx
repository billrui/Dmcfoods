import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, User, Sparkles, LifeBuoy, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  AuthShell, Heading, Field, PhoneField, PasswordField, ErrorBox, SubmitButton, apiError,
} from '../../components/AdminAuthShell.jsx';

// mode: 'loading' | 'login' | 'setup' | 'recover'
export default function AdminLogin() {
  const { user, loading: authLoading, login, logout, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dmc-console';

  const [mode, setMode] = useState('loading');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/auth/admin/status')
      .then(r => setMode(r.data.needsSetup ? 'setup' : 'login'))
      .catch(() => setMode('login'));
  }, []);

  if (!authLoading && user?.isAdmin) return <Navigate to={from} replace />;

  const go = (m) => { setMode(m); setError(''); setPassword(''); setConfirm(''); };

  const validateNew = () => {
    if (phone.length < 9) return 'Enter a valid phone number.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const run = async (fn) => {
    setError(''); setBusy(true);
    try { await fn(); } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  };

  const onLogin = (e) => {
    e.preventDefault();
    if (phone.length < 9) return setError('Enter a valid phone number.');
    if (!password) return setError('Enter your password.');
    run(async () => {
      try {
        const u = await login(phone, password);
        if (!u?.isAdmin) { await logout(); throw { response: { data: { error: 'This account does not have admin access.' } } }; }
        navigate(from, { replace: true });
      } catch (err) {
        if (err.response?.status === 401) throw { response: { data: { error: 'Incorrect phone number or password.' } } };
        throw err;
      }
    });
  };

  const onSetup = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name.');
    const v = validateNew(); if (v) return setError(v);
    run(async () => {
      const { data } = await api.post('/auth/admin/setup', { name, phone, password });
      setSession(data.token, data.user);
      navigate('/dmc-console', { replace: true });
    });
  };

  if (mode === 'loading') {
    return (
      <div className="force-dark min-h-screen bg-app flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
      </div>
    );
  }

  // ── First-time setup ──
  if (mode === 'setup') {
    return (
      <AuthShell>
        <Heading badge={Sparkles} badgeText="First-time setup" title="Create the owner account"
          subtitle="No admin exists yet. This account will have full access to the console, and can add other staff later." />
        <form onSubmit={onSetup} className="mt-8 space-y-5" noValidate>
          <Field id="name" label="Your name" icon={User} value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Jane Wanjiru" autoComplete="name" autoFocus />
          <PhoneField value={phone} onChange={setPhone} />
          <PasswordField id="password" label="Password" icon={Lock} value={password} onChange={setPassword}
            autoComplete="new-password" showStrength />
          <PasswordField id="confirm" label="Confirm password" icon={Lock} value={confirm} onChange={setConfirm}
            autoComplete="new-password" />
          <ErrorBox>{error}</ErrorBox>
          <SubmitButton busy={busy} busyText="Creating account…">Create admin account</SubmitButton>
        </form>
      </AuthShell>
    );
  }

  // ── Forgot password ──
  if (mode === 'recover') {
    return (
      <AuthShell onBack={() => go('login')} backLabel="Back to sign in">
        <Heading badge={LifeBuoy} badgeText="Forgot password" title="Ask another admin"
          subtitle="Another admin can reset your password from the Users page in the console. They'll give you a temporary password, and you'll choose a new one when you sign in." />
        <button onClick={() => go('login')} className="mt-8 w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold transition">
          Back to sign in
        </button>
      </AuthShell>
    );
  }

  // ── Normal sign in ──
  return (
    <AuthShell>
      <Heading badge={ShieldCheck} badgeText="Staff sign in" title="Welcome back"
        subtitle="Sign in with your admin phone number and password." />
      <form onSubmit={onLogin} className="mt-8 space-y-5" noValidate>
        <PhoneField value={phone} onChange={setPhone} autoFocus />
        <div>
          <PasswordField id="password" label="Password" icon={Lock} value={password} onChange={setPassword} />
          <div className="flex justify-end mt-2">
            <button type="button" onClick={() => go('recover')} className="text-xs text-gray-400 hover:text-brand transition">
              Forgot password?
            </button>
          </div>
        </div>
        <ErrorBox>{error}</ErrorBox>
        <SubmitButton busy={busy} busyText="Signing in…">Sign in to console</SubmitButton>
      </form>
      <p className="text-xs text-gray-600 mt-8 text-center leading-relaxed">
        New staff member? Register a normal account on the store, then ask an admin to grant you access.
      </p>
    </AuthShell>
  );
}
