import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

// ============================================
// AUTH STORE
// ============================================

interface ImpersonationState {
  isImpersonating: boolean;
  originalUserId: string;
  originalUserData: User;
  impersonatedUserId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  impersonation: ImpersonationState | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  setActiveRole: (role: 'influencer' | 'promoter') => void;
  refreshUserProfile: () => Promise<void>; // Added refresh method

  // Impersonation actions
  startImpersonation: (impersonatedUser: User, originalUserId: string) => Promise<void>;
  endImpersonation: (originalUserData: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      impersonation: null,

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
        impersonation: null,
      }),

      updateUserProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      setActiveRole: (role) => set((state) => ({
        user: state.user ? { ...state.user, activeRole: role } : null,
      })),

      refreshUserProfile: async () => {
        // Import Firestore dynamically to avoid circular dependencies
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        const currentUser = get().user;
        if (!currentUser?.uid) return;

        // Fetch fresh user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Update the store with fresh data - this will persist automatically
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          }));
        }
      },

      startImpersonation: async (impersonatedUser, originalUserId) => {
        // Import Firestore dynamically to avoid circular dependencies
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        // Create impersonation marker document in Firestore
        // This will be used by security rules to block writes
        await setDoc(doc(db, 'impersonation', originalUserId), {
          adminId: originalUserId,
          impersonatedUserId: impersonatedUser.uid,
          startTime: Date.now(),
        });

        set((state) => ({
          // Store the impersonation state
          impersonation: {
            isImpersonating: true,
            originalUserId,
            originalUserData: state.user!,
            impersonatedUserId: impersonatedUser.uid,
          },
          // Switch to impersonated user
          user: impersonatedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
      },

      endImpersonation: async (originalUserData) => {
        // Import Firestore dynamically
        const { doc, deleteDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        const state = get();
        if (state.impersonation?.isImpersonating) {
          // Remove impersonation marker from Firestore
          await deleteDoc(doc(db, 'impersonation', state.impersonation.originalUserId));

          // Restore original user state
          set({
            user: originalUserData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            impersonation: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        impersonation: state.impersonation,
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
export const selectIsImpersonating = (state: AuthState) => state.impersonation?.isImpersonating || false;
export const selectOriginalUserId = (state: AuthState) => state.impersonation?.originalUserId;

// Helper hooks
export const useUserRoles = () => useAuthStore(selectUserRoles);
export const useActiveRole = () => useAuthStore(selectActiveRole);
export const useIsInfluencer = () => useAuthStore(selectIsInfluencer);
export const useIsPromoter = () => useAuthStore(selectIsPromoter);
export const useIsAdmin = () => useAuthStore(selectIsAdmin);
export const useUserId = () => useAuthStore(selectUserId);
export const useIsImpersonating = () => useAuthStore(selectIsImpersonating);
