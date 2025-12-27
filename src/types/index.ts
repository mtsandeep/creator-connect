// ============================================
// USER TYPES
// ============================================

export type UserRole = 'influencer' | 'promoter' | 'admin';

export type PromoterType = 'individual' | 'agency';

export interface SocialMediaLink {
  platform: string; // instagram, youtube, tiktok
  url: string;
  followerCount: number;
}

export interface InfluencerProfile {
  displayName: string;
  username: string; // @username
  bio: string;
  categories: string[]; // fashion, tech, lifestyle, fitness, food, travel
  socialMediaLinks: SocialMediaLink[];
  profileImage: string;
  mediaKit?: string; // PDF URL
  pricing: {
    startingFrom?: number;
    advancePercentage: number; // 0-50%, configurable by influencer
    rates: Rate[];
  };
  location?: string;
  languages: string[];
}

export interface PromoterProfile {
  name: string; // Company or individual name
  type: PromoterType;
  industry: string;
  website: string;
  logo: string;
  description: string;
  location: string;
  brands?: string[]; // For agencies - list of brand IDs they manage
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number; // timestamp
  profileComplete: boolean;
  influencerProfile?: InfluencerProfile;
  promoterProfile?: PromoterProfile;
  avgRating: number;
  totalReviews: number;
}

// ============================================
// PROPOSAL TYPES
// ============================================

export type ProposalStatus =
  | 'pending' // Initial proposal sent
  | 'discussing' // Chatting, not yet finalized
  | 'finalized' // Both parties agreed, payment pending
  | 'in_progress' // Payment done, work in progress
  | 'completed' // Work approved, payment released
  | 'cancelled' // Cancelled by either party
  | 'disputed'; // Dispute raised

export interface Rate {
  type: string; // story, post, reel, video
  price: number;
}

export interface ProposalAttachment {
  name: string;
  url: string;
  type: string;
  uploadedBy: string; // uid
  uploadedAt: number; // timestamp
}

export interface Proposal {
  id: string;
  promoterId: string;
  influencerId: string;
  status: ProposalStatus;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  title: string;
  description: string;
  requirements: string;
  deliverables: string[];
  proposedBudget?: number; // Discussed in chat, not public
  finalAmount?: number; // Agreed amount
  advancePaid: boolean;
  advanceAmount?: number;
  advancePercentage: number; // From influencer's config
  remainingAmount?: number;
  attachments: ProposalAttachment[];
  deadline?: number; // timestamp
  brandApproval?: boolean; // Promoter approved work
  influencerApproval?: boolean; // Influencer submitted work
  completionPercentage: number; // 0-100
}

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageType = 'text' | 'image' | 'file';

export interface Message {
  id: string;
  proposalId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  timestamp: number; // timestamp
  read: boolean;
}

export interface Conversation {
  proposalId: string;
  proposal: Proposal;
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
}

// ============================================
// REVIEW TYPES
// ============================================

export interface Review {
  id: string;
  proposalId: string;
  reviewerId: string; // User giving review
  revieweeId: string; // User being reviewed
  reviewerRole: UserRole;
  rating: number; // 1-5
  comment: string;
  createdAt: number; // timestamp
}

// ============================================
// TRANSACTION TYPES
// ============================================

export type TransactionType = 'advance' | 'final' | 'refund';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  proposalId: string;
  payerId: string; // Promoter
  receiverId: string; // Influencer or Platform
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod: string;
  createdAt: number; // timestamp
  completedAt?: number; // timestamp
}

// ============================================
// UI STATE TYPES
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export type ModalType =
  | 'editProfile'
  | 'editPricing'
  | 'createProposal'
  | 'proposalDetails'
  | 'payment'
  | 'review'
  | 'addBrand'
  | 'deleteAccount'
  | null;

export interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  activeModal: ModalType;
  toasts: Toast[];
  loading: boolean;
  currentProposalId?: string; // For context-aware modals
}

// ============================================
// FILTER TYPES
// ============================================

export interface InfluencerFilters {
  search?: string;
  categories?: string[];
  followerRanges?: string[]; // ['10K-50K', '50K-100K', '100K-500K', '500K+']
  minRating?: number;
  location?: string;
  languages?: string[];
  verifiedOnly?: boolean;
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateProposalData {
  influencerId: string;
  title: string;
  description: string;
  requirements: string;
  deliverables: string[];
  proposedBudget?: number;
  deadline?: number;
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  categories?: string[];
  location?: string;
  languages?: string[];
}

export interface UpdatePricingData {
  advancePercentage: number;
  rates: Rate[];
}

export interface UpdatePromoterProfileData {
  name?: string;
  type?: PromoterType;
  industry?: string;
  website?: string;
  description?: string;
  location?: string;
}

// ============================================
// STATS TYPES
// ============================================

export interface InfluencerStats {
  totalEarnings: number;
  pendingAmount: number;
  availableBalance: number;
  withdrawnAmount: number;
  activeProposals: number;
  completedProjects: number;
  avgRating: number;
}

export interface PromoterStats {
  totalSpent: number;
  activeCampaigns: number;
  pendingApprovals: number;
  savedInfluencers: number;
  totalInfluencersHired: number;
  avgRating: number;
}
