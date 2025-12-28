import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

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
  setActiveRole: (role: 'influencer' | 'promoter') => void;
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

      setActiveRole: (role) => set((state) => ({
        user: state.user ? { ...state.user, activeRole: role } : null,
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

export const selectUserRoles = (state: AuthState) => state.user?.roles || [];
export const selectActiveRole = (state: AuthState) => state.user?.activeRole;
export const selectIsInfluencer = (state: AuthState) => state.user?.roles.includes('influencer') || false;
export const selectIsPromoter = (state: AuthState) => state.user?.roles.includes('promoter') || false;
export const selectIsAdmin = (state: AuthState) => state.user?.roles.includes('admin') || false;
export const selectUserId = (state: AuthState) => state.user?.uid;
export const selectProfileComplete = (state: AuthState) => state.user?.profileComplete;

// Helper hooks
export const useUserRoles = () => useAuthStore(selectUserRoles);
export const useActiveRole = () => useAuthStore(selectActiveRole);
export const useIsInfluencer = () => useAuthStore(selectIsInfluencer);
export const useIsPromoter = () => useAuthStore(selectIsPromoter);
export const useUserId = () => useAuthStore(selectUserId);
