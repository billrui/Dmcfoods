import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ksh = (cents = 0) => `Ksh ${(Math.round(cents) / 100).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

export function todayStr() {
  return new Date(Date.now() + 180 * 60000).toISOString().slice(0, 10); // Nairobi
}
export function shiftDate(str, days) {
  const d = new Date(`${str}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function prettyDate(str) {
  return new Date(`${str}T12:00:00Z`).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
export const time = (d) => new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Nairobi' });

export function DatePicker({ value, onChange }) {
  const today = todayStr();
  return (
    <div className="flex items-center bg-card border border-gray-800 rounded-xl">
      <button onClick={() => onChange(shiftDate(value, -1))} className="p-2.5 text-gray-400 hover:text-white" aria-label="Previous day">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <input type="date" value={value} max={today} onChange={e => e.target.value && onChange(e.target.value)}
        className="bg-transparent text-sm text-white outline-none [color-scheme:dark] px-1" />
      <button onClick={() => onChange(shiftDate(value, 1))} disabled={value >= today}
        className="p-2.5 text-gray-400 hover:text-white disabled:opacity-30" aria-label="Next day">
        <ChevronRight className="w-4 h-4" />
      </button>
      {value !== today && (
        <button onClick={() => onChange(today)} className="text-xs text-brand font-medium pr-3 pl-1">Today</button>
      )}
    </div>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="flex bg-card border border-gray-800 rounded-xl p-1">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${value === o.value ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`bg-card border border-gray-800 rounded-2xl ${className}`}>{children}</div>;
}
