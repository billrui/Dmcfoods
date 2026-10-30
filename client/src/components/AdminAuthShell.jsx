import { useState } from 'react';
import { Eye, EyeOff, Loader2, Phone, ArrowLeft, ChefHat, BarChart3, Bike } from 'lucide-react';

export const BRAND_NAME = 'DMC Foods';

export function AuthShell({ children, backHref = '/', backLabel = 'Back to store', onBack }) {
  return (
    <div className="force-dark min-h-screen bg-app flex">
      <aside className="hidden lg:flex relative w-[44%] overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-brand via-brand-hover to-app">
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%)',
          }}
        />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-black/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/25">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold tracking-tight leading-none">{BRAND_NAME}</p>
            <p className="text-white/60 text-xs mt-1">Admin console</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Run the kitchen<br />from one place.
          </h1>
          <p className="text-white/70 mt-4 max-w-sm text-sm leading-relaxed">
            Orders, menu, branches, delivery zones and promos — everything your team needs to keep food moving.
          </p>
          <ul className="mt-10 space-y-3">
            {[
              { icon: Bike, text: 'Track live orders and M-Pesa payments' },
              { icon: ChefHat, text: 'Update menu items and prices instantly' },
              { icon: BarChart3, text: 'See today’s revenue at a glance' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85 text-sm">
                <span className="w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-white/40 text-xs">© {new Date().getFullYear()} {BRAND_NAME} · Authorised staff only</p>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="p-6">
          {onBack ? (
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </button>
          ) : (
            <a href={backHref} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </a>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-bold">{BRAND_NAME} <span className="text-gray-500 font-normal">· Admin</span></p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Heading({ badge: Badge, badgeText, title, subtitle }) {
  return (
    <>
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-brand bg-brand/10 ring-1 ring-brand/20 px-2.5 py-1 rounded-full mb-5">
        <Badge className="w-3.5 h-3.5" /> {badgeText}
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">{subtitle}</p>}
    </>
  );
}

const boxCls = 'flex rounded-xl bg-sunken border border-gray-800 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15 transition';
const inputCls = 'flex-1 min-w-0 bg-transparent px-3 py-3 text-sm text-white placeholder-gray-600 outline-none';

export function Field({ id, label, icon: Icon, hint, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-gray-400 mb-1.5 block">{label}</label>
      <div className={boxCls}>
        {Icon && <span className="flex items-center pl-3.5 text-gray-400"><Icon className="w-4 h-4" /></span>}
        <input id={id} className={inputCls} {...props} />
      </div>
      {hint && <p className="text-[11px] text-gray-500 mt-1.5">{hint}</p>}
    </div>
  );
}

export function PhoneField({ value, onChange, autoFocus }) {
  return (
    <div>
      <label htmlFor="phone" className="text-xs font-medium text-gray-400 mb-1.5 block">Phone number</label>
      <div className={boxCls}>
        <span className="flex items-center gap-2 pl-3.5 pr-3 text-sm text-gray-400 border-r border-gray-800">
          <Phone className="w-4 h-4" /> +254
        </span>
        <input
          id="phone" type="tel" inputMode="numeric" autoComplete="username" autoFocus={autoFocus}
          value={value}
          onChange={e => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.startsWith('254')) v = v.slice(3);
            if (v.startsWith('0')) v = v.slice(1);
            onChange(v.slice(0, 9));
          }}
          placeholder="712 345 678"
          className={inputCls}
        />
      </div>
    </div>
  );
}

export function PasswordField({ id, label, value, onChange, autoComplete = 'current-password', icon: Icon, showStrength, autoFocus }) {
  const [show, setShow] = useState(false);
  const score = [value.length >= 8, /[A-Z]/.test(value) && /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value) || value.length >= 12]
    .filter(Boolean).length;
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
  const colors = ['bg-gray-700', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500'];
  const shown = value.length < 8 ? 0 : score;
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-gray-400 mb-1.5 block">{label}</label>
      <div className={boxCls}>
        {Icon && <span className="flex items-center pl-3.5 text-gray-400"><Icon className="w-4 h-4" /></span>}
        <input
          id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} autoFocus={autoFocus}
          value={value} onChange={e => onChange(e.target.value)} placeholder="••••••••" className={inputCls}
        />
        <button type="button" onClick={() => setShow(s => !s)} className="px-3.5 text-gray-500 hover:text-white transition"
          aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map(i => <div key={i} className={`h-1 rounded-full ${i <= shown ? colors[shown] : 'bg-gray-800'}`} />)}
          </div>
          <span className="text-[11px] text-gray-500 w-14 text-right">{labels[shown]}</span>
        </div>
      )}
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="text-sm text-red-300 bg-red-950/40 border border-red-900/60 rounded-xl px-3.5 py-2.5">
      {children}
    </div>
  );
}

export function SubmitButton({ busy, children, busyText = 'Please wait…' }) {
  return (
    <button type="submit" disabled={busy}
      className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-brand/20 flex items-center justify-center gap-2">
      {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {busyText}</> : children}
    </button>
  );
}

export const apiError = (err, fallback = 'Something went wrong. Check your connection.') =>
  err.response?.status === 429 ? 'Too many attempts. Please wait a few minutes and try again.'
  : err.response?.data?.error || fallback;
