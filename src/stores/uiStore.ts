import { create } from 'zustand';
import type { Toast, ModalType, UIState } from '../types';

// ============================================
// UI STORE
// ============================================

interface ExtendedUIState extends UIState {
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  openModal: (modal: ModalType, proposalId?: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useUIStore = create<ExtendedUIState>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  activeModal: null,
  toasts: [],
  loading: false,
  currentProposalId: undefined,

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  openModal: (modal, proposalId) => set({
    activeModal: modal,
    currentProposalId: proposalId,
  }),

  closeModal: () => set({
    activeModal: null,
    currentProposalId: undefined,
  }),

  addToast: (toast) => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };

    // Auto-remove after duration (default 3 seconds)
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration || 3000);
    }

    return {
      toasts: [...state.toasts, newToast],
    };
  }),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  setLoading: (loading) => set({ loading }),

  reset: () => set({
    sidebarOpen: true,
    mobileMenuOpen: false,
    activeModal: null,
    toasts: [],
    loading: false,
    currentProposalId: undefined,
  }),
}));

// ============================================
// SELECTORS
// ============================================

export const selectIsModalOpen = (state: ExtendedUIState, modal: ModalType) => {
  return state.activeModal === modal;
};

// Helper hooks
export const useIsModalOpen = (modal: ModalType) =>
  useUIStore((state) => selectIsModalOpen(state, modal));

// Toast helpers
export const toast = {
  success: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ message, type: 'success', duration });
  },
  error: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ message, type: 'error', duration });
  },
  warning: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ message, type: 'warning', duration });
  },
  info: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ message, type: 'info', duration });
  },
};
