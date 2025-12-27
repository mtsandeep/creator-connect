import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

// ============================================
// AUTH STORE
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        error: null,
      }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        error: null,
      }),

      updateUserProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectIsInfluencer = (state: AuthState) => state.user?.role === 'influencer';
export const selectIsPromoter = (state: AuthState) => state.user?.role === 'promoter';
export const selectIsAdmin = (state: AuthState) => state.user?.role === 'admin';
export const selectUserId = (state: AuthState) => state.user?.uid;
export const selectProfileComplete = (state: AuthState) => state.user?.profileComplete;

// Helper hooks
export const useUserRole = () => useAuthStore(selectUserRole);
export const useIsInfluencer = () => useAuthStore(selectIsInfluencer);
export const useIsPromoter = () => useAuthStore(selectIsPromoter);
export const useUserId = () => useAuthStore(selectUserId);
