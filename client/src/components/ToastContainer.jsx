import { Check, X, Info, AlertCircle } from 'lucide-react';
import { useToast } from '../store/toastStore';

const ICONS = {
  success: Check,
  error:   AlertCircle,
  info:    Info,
};

const COLORS = {
  success: { bg: 'bg-green-500', ring: 'ring-green-500/30' },
  error:   { bg: 'bg-red-500',   ring: 'ring-red-500/30' },
  info:    { bg: 'bg-blue-500',  ring: 'ring-blue-500/30' },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Check;
        const { bg, ring } = COLORS[t.type] || COLORS.success;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 bg-[#2A2D31] text-white rounded-xl px-4 py-3 shadow-2xl ring-1 ring-white/5 min-w-[280px] max-w-sm animate-[slideIn_0.2s_ease-out]"
          >
            <span className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4 text-white" strokeWidth={3} />
            </span>
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-white transition shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
