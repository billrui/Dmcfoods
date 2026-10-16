import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTheme = create(persist((set, get) => ({
  theme: 'light',           // 'light' | 'dark'
  toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
  set: (t) => set({ theme: t }),
}), { name: 'munch-theme' }));

// Apply on load
const t = useTheme.getState().theme;
if (t === 'dark') document.documentElement.classList.add('dark');
