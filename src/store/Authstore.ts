import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  referralCode: string;     // ← Added
  storeCredit: number;      // ← Added
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  pendingEmail: string | null;
  resetEmail: string | null;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setPendingEmail: (email: string) => void;
  verifySuccess: (user: User, token: string) => void;
  clearPendingEmail: () => void;
  setResetEmail: (email: string) => void;
  clearResetEmail: () => void;
  updateUser: (updates: Partial<Pick<User, "name" | "email" | "referralCode" | "storeCredit">>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      pendingEmail: null,
      resetEmail: null,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          pendingEmail: null, 
          resetEmail: null 
        }),

      setPendingEmail: (email) => set({ pendingEmail: email }),

      verifySuccess: (user, token) =>
        set({ user, token, isAuthenticated: true, pendingEmail: null }),

      clearPendingEmail: () => set({ pendingEmail: null }),

      setResetEmail: (email) => set({ resetEmail: email }),

      clearResetEmail: () => set({ resetEmail: null }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);