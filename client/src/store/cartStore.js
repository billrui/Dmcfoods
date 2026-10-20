import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(persist((set, get) => ({
  items: [],
  drawerOpen: false,

  openDrawer:  () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  add: (item, selectedAddons = [], quantity = 1) => set(state => {
    // Generate a unique signature for this specific combination of item + addons
    const addonIds = selectedAddons.map(a => a.name).sort().join('-');
    const cartItemId = `${item._id}-${addonIds}`;
    
    // Calculate addon price total
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const finalPrice = item.price - (item.discount || 0) + addonsPrice;

    const existing = state.items.find(i => i.cartItemId === cartItemId);
    
    let newItems;
    if (existing) {
      newItems = state.items.map(i => 
        i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + quantity } : i
      );
    } else {
      newItems = [...state.items, { 
        ...item, 
        cartItemId,
        price: finalPrice, // Store the final price with addons
        basePrice: item.price - (item.discount || 0),
        addons: selectedAddons,
        quantity 
      }];
    }
    
    return { items: newItems };
  }),

  remove: (cartItemId) => set(state => ({ 
    items: state.items.filter(i => i.cartItemId !== cartItemId) 
  })),

  setQty: (cartItemId, qty) => set(state => ({
    items: qty <= 0
      ? state.items.filter(i => i.cartItemId !== cartItemId)
      : state.items.map(i => i.cartItemId === cartItemId ? { ...i, quantity: qty } : i),
  })),

  clear: () => set({ items: [] }),

  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  count:    () => get().items.reduce((s, i) => s + i.quantity, 0),
}), { name: 'munch-cart' }));
