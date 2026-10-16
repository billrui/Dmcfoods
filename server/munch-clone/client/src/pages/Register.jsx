import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try { await register(name, email, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Register failed'); }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-6">Create account</h1>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {error && <p className="text-sm text-brand">{error}</p>}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" />
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none" />
        <button className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold">Register</button>
        <p className="text-center text-sm text-gray-500">Have an account? <Link to="/login" className="text-brand">Log in</Link></p>
      </form>
    </div>
  );
}
