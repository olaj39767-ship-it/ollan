import { create } from "zustand";

interface CartState {
  cartCount: number;
  setCartCount: (count: number) => void;
  incrementCart: () => void;
  decrementCart: () => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cartCount: 0,

  setCartCount: (count) => set({ cartCount: count }),

  incrementCart: () =>
    set((state) => ({ cartCount: state.cartCount + 1 })),

  decrementCart: () =>
    set((state) => ({ cartCount: Math.max(0, state.cartCount - 1) })),

  clearCart: () => set({ cartCount: 0 }),
}));