import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(persist((set, get) => ({
  items: [],
  drawerOpen: false,

  openDrawer:  () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  add: (item) => set(state => {
    const existing = state.items.find(i => i._id === item._id);
    const items = existing
      ? state.items.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...state.items, { ...item, quantity: 1 }];
    return { items, drawerOpen: true };
  }),

  remove: (id) => set(state => ({ items: state.items.filter(i => i._id !== id) })),

  setQty: (id, qty) => set(state => ({
    items: qty <= 0
      ? state.items.filter(i => i._id !== id)
      : state.items.map(i => i._id === id ? { ...i, quantity: qty } : i),
  })),

  clear: () => set({ items: [] }),

  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  count:    () => get().items.reduce((s, i) => s + i.quantity, 0),
}), { name: 'munch-cart' }));
