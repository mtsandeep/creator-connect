// ============================================
// USER TYPES
// ============================================

export type UserRole = 'influencer' | 'promoter' | 'admin';

export type PromoterType = 'individual' | 'agency';

export interface SocialMediaLink {
  platform: string; // instagram, youtube, facebook
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
  linkInBio?: LinkInBioSettings;
}

export type TermType = 'allowed' | 'not_allowed' | 'generic';

export interface LinkInBioTerm {
  id: string;
  text: string;
  type: TermType; // tick/cross/no icon
  order: number;
}

export interface LinkInBioQuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  order: number;
}

export interface LinkInBioSettings {
  isEnabled: boolean;
  contactPreference: 'verified_only' | 'anyone';
  priceOnRequest: boolean; // When true, shows "Price on Request" badge instead of actual rates
  terms: LinkInBioTerm[];
  quickLinks: LinkInBioQuickLink[];
}

export interface PromoterProfile {
  name: string; // Company or individual name
  type: PromoterType;
  categories: string[];
  website: string;
  logo: string;
  description: string;
  location: string;
  brands?: string[]; // For agencies - list of brand IDs they manage
}

export interface VerificationBadges {
  verified: boolean; // Auto after first completed project
  trusted: boolean; // Admin-assigned
}

export interface User {
  uid: string;
  email: string;
  roles: UserRole[]; // Changed from single role to roles array
  activeRole: UserRole | null; // Currently active role for session
  createdAt: number; // timestamp
  profileComplete: boolean; // true if at least one role profile is complete
  influencerProfile?: InfluencerProfile;
  promoterProfile?: PromoterProfile;
  avgRating: number;
  totalReviews: number;
  isPromoterVerified?: boolean; // Promoter has paid verification deposit
  allowedInfluencerIds?: string[]; // Influencers this unverified promoter can contact (from link-in-bio)
  // Admin fields
  isBanned: boolean;
  banReason?: string;
  bannedAt?: number;
  bannedBy?: string; // admin uid
  verificationBadges: VerificationBadges;
  trustedAt?: number;
  trustedBy?: string; // admin uid
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
  // New flags for clearer workflow
  influencerAcceptedTerms?: boolean; // Influencer agreed to finalized proposal terms
  influencerSubmittedWork?: boolean; // Influencer completed the work
  brandApprovedWork?: boolean; // Brand approved the completed work
  completionPercentage: number; // 0-100
}

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageType = 'text' | 'image' | 'file';
export type ConversationType = 'direct' | 'proposal';

export interface Conversation {
  id: string;
  type: ConversationType;
  participants: {
    [userId: string]: {
      lastReadAt: number;
      hasLeft: boolean;
    };
  };
  proposalId?: string; // Only for proposal conversations - links to proposal for context
  proposal?: Proposal; // Populated for proposal conversations
  createdAt: number;
  updatedAt: number;
  lastMessage?: {
    content: string;
    type: MessageType;
    timestamp: number;
    senderId: string;
  };
}

export interface Message {
  id: string;
  conversationId?: string; // For direct chats - references the conversation
  proposalId?: string; // For proposal chats - references the proposal
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  timestamp: number;
  read: boolean;
}

// Extended conversation type used in chat list/UI (combines proposal + other user info)
// This is different from the Conversation type above which is for direct conversations
export interface ChatConversation {
  conversationId: string; // The conversation document ID (from conversations collection)
  proposalId: string; // The proposal ID
  proposal: Proposal; // The full proposal object
  otherUser: User; // The other user in the conversation
  lastMessage?: Message; // Last message preview
  unreadCount: number; // Number of unread messages
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

// ============================================
// ADMIN TYPES
// ============================================

export type AdminAction =
  | 'ban_user'
  | 'unban_user'
  | 'assign_trusted'
  | 'remove_trusted'
  | 'assign_admin'
  | 'impersonate_start'
  | 'impersonate_end';

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: AdminAction;
  targetUserId?: string;
  targetUserEmail?: string;
  reason?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ImpersonationState {
  isImpersonating: boolean;
  originalUserId?: string;
  impersonatedUserId?: string;
  impersonatedUserEmail?: string;
}
