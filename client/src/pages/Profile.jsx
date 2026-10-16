import { useState } from 'react';
import { User, Mail, Phone, Camera, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../store/toastStore';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast(s => s.show);

  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    phone:     user?.phone || '',
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const update = (e) => {
    e.preventDefault();
    const originalFirst = user?.name?.split(' ')[0] || '';
    const originalLast  = user?.name?.split(' ').slice(1).join(' ') || '';
    const originalPhone = user?.phone || '';

    const dirty =
      form.firstName !== originalFirst ||
      form.lastName  !== originalLast  ||
      form.phone     !== originalPhone;

    if (!dirty) {
      toast('Change something to update.', { type: 'success' });
      return;
    }

    // TODO: PATCH /api/auth/me
    toast('Profile updated.', { type: 'success' });
  };

  const confirmDelete = () => {
    setConfirmOpen(false);
    // TODO: DELETE /api/auth/me
    toast('Account deletion requested.', { type: 'info' });
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="flex justify-center mb-10">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-[#1A1D21] flex items-center justify-center text-white text-4xl font-bold">
            {(form.firstName[0] || 'U').toUpperCase()}
          </div>
          <button className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-brand hover:bg-brand-hover flex items-center justify-center text-white shadow-lg">
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      <form onSubmit={update} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="First name *">
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              className="w-full pl-9 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand"
            />
          </Field>
          <Field label="Last name *">
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })}
              className="w-full pl-9 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Email">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.email}
              readOnly
              className="w-full pl-9 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-gray-300 opacity-70"
            />
          </Field>
          <Field label="Mobile number">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+254…"
              className="w-full pl-9 pr-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold"
        >
          Update
        </button>
      </form>

      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full mt-3 border border-gray-300 dark:border-gray-600 py-3 rounded-full font-semibold dark:text-white hover:bg-gray-50 dark:hover:bg-[#23272B]"
      >
        Logout
      </button>

      <div className="text-center mt-6">
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-brand text-sm font-medium hover:underline"
        >
          Delete account
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-16">© 2026 Munch</p>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete account?"
        message="This will permanently delete your account, including your order history, saved addresses, and favourites. This action cannot be undone."
        cancelLabel="No"
        confirmLabel="Yes"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}
