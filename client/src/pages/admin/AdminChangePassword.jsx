import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext.jsx';
import { AuthShell, Heading, PasswordField, ErrorBox, SubmitButton, apiError } from '../../components/AdminAuthShell.jsx';

// forced = true when an admin signs in with a temporary password
export default function AdminChangePassword({ forced = false }) {
  const { user, logout, setSession } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!current) return setError(forced ? 'Enter the temporary password you were given.' : 'Enter your current password.');
    if (password.length < 8) return setError('New password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/admin/change-password', { currentPassword: current, newPassword: password });
      setSession(data.token, data.user);
      navigate('/dmc-console', { replace: true, state: { passwordChanged: true } });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      onBack={forced ? async () => { await logout(); navigate('/dmc-console/login'); } : () => navigate(-1)}
      backLabel={forced ? 'Sign out' : 'Back to console'}
    >
      <Heading
        badge={forced ? KeyRound : CheckCircle2}
        badgeText={forced ? 'Action required' : 'Security'}
        title={forced ? 'Set a new password' : 'Change password'}
        subtitle={forced
          ? `Hi ${user?.name || 'there'} — you signed in with a temporary password. Choose your own to continue.`
          : 'Changing your password signs you out on every other device.'}
      />
      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <PasswordField id="current" label={forced ? 'Temporary password' : 'Current password'} icon={Lock}
          value={current} onChange={setCurrent} autoFocus />
        <PasswordField id="new" label="New password" icon={Lock} value={password} onChange={setPassword}
          autoComplete="new-password" showStrength />
        <PasswordField id="confirm" label="Confirm new password" icon={Lock} value={confirm} onChange={setConfirm}
          autoComplete="new-password" />
        <ErrorBox>{error}</ErrorBox>
        <SubmitButton busy={busy} busyText="Saving…">Save new password</SubmitButton>
      </form>
    </AuthShell>
  );
}
