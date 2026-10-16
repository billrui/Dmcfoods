import { create } from 'zustand';

let nextId = 1;

export const useToast = create((set, get) => ({
  toasts: [],

  show: (message, opts = {}) => {
    const id = nextId++;
    const toast = {
      id,
      message,
      type: opts.type || 'success',     // 'success' | 'error' | 'info'
      duration: opts.duration ?? 3000,
    };
    set(state => ({ toasts: [...state.toasts, toast] }));
    if (toast.duration > 0) {
      setTimeout(() => get().dismiss(id), toast.duration);
    }
    return id;
  },

  dismiss: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
}));
