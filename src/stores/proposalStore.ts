import { create } from 'zustand';
import type { Proposal, ProposalStatus, InfluencerFilters } from '../types';

// ============================================
// PROPOSAL STORE
// ============================================

interface ProposalState {
  // Data
  proposals: Proposal[];
  currentProposal: Proposal | null;
  filters: InfluencerFilters | null; // For browsing influencers

  // UI State
  isLoading: boolean;
  error: string | null;
  statusFilter: ProposalStatus | 'all';

  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;

  // Actions
  setProposals: (proposals: Proposal[]) => void;
  setCurrentProposal: (proposal: Proposal | null) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposal: (id: string, updates: Partial<Proposal>) => void;
  removeProposal: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStatusFilter: (status: ProposalStatus | 'all') => void;
  setFilters: (filters: InfluencerFilters | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalItems: (total: number) => void;
  resetFilters: () => void;
}

export const useProposalStore = create<ProposalState>((set) => ({
  proposals: [],
  currentProposal: null,
  filters: null,
  isLoading: false,
  error: null,
  statusFilter: 'all',
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,

  setProposals: (proposals) => set({ proposals }),

  setCurrentProposal: (proposal) => set({ currentProposal: proposal }),

  addProposal: (proposal) => set((state) => ({
    proposals: [proposal, ...state.proposals],
  })),

  updateProposal: (id, updates) => set((state) => ({
    proposals: state.proposals.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
    currentProposal:
      state.currentProposal?.id === id
        ? { ...state.currentProposal, ...updates }
        : state.currentProposal,
  })),

  removeProposal: (id) => set((state) => ({
    proposals: state.proposals.filter((p) => p.id !== id),
    currentProposal:
      state.currentProposal?.id === id ? null : state.currentProposal,
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setStatusFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }),

  setFilters: (filters) => set({ filters, currentPage: 1 }),

  setCurrentPage: (currentPage) => set({ currentPage }),

  setTotalItems: (totalItems) => set({ totalItems }),

  resetFilters: () => set({
    filters: null,
    currentPage: 1,
    statusFilter: 'all',
  }),
}));

// ============================================
// SELECTORS
// ============================================

export const selectFilteredProposals = (state: ProposalState) => {
  let filtered = [...state.proposals];

  // Apply status filter
  if (state.statusFilter !== 'all') {
    filtered = filtered.filter((p) => p.proposalStatus === state.statusFilter);
  }

  // Apply pagination
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);

  return {
    proposals: paginated,
    totalPages: Math.ceil(filtered.length / state.itemsPerPage),
    hasMore: endIndex < filtered.length,
  };
};

export const selectProposalsByStatus = (state: ProposalState, status: ProposalStatus) => {
  return state.proposals.filter((p) => p.proposalStatus === status);
};

export const selectActiveProposals = (state: ProposalState) => {
  return state.proposals.filter((p) =>
    p.proposalStatus !== 'declined' && p.proposalStatus !== 'closed' && p.workStatus !== 'approved'
  );
};

export const selectPendingProposals = (state: ProposalState) => {
  return state.proposals.filter((p) => p.proposalStatus === 'sent');
};

export const selectCompletedProposals = (state: ProposalState) => {
  return state.proposals.filter((p) => p.workStatus === 'approved');
};

// Helper hooks
export const useActiveProposals = () => useProposalStore(selectActiveProposals);
export const usePendingProposals = () => useProposalStore(selectPendingProposals);
export const useCompletedProposals = () => useProposalStore(selectCompletedProposals);
