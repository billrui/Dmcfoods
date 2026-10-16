import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavourites = create(persist((set, get) => ({
  items: [],   // full item objects
  has: (id) => get().items.some(i => i._id === id),
  toggle: (item) => set(state => ({
    items: state.items.some(i => i._id === item._id)
      ? state.items.filter(i => i._id !== item._id)
      : [...state.items, item],
  })),
  clear: () => set({ items: [] }),
}), { name: 'munch-favourites' }));
