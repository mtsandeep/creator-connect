// ============================================
// USER TYPES
// ============================================

export type UserRole = 'influencer' | 'promoter' | 'admin';

export type PromoterType = 'individual' | 'agency';

export interface SocialMediaLink {
  platform: string; // instagram, youtube, facebook
  url: string;
  followerCount: number;
  instagramAnalytics?: InstagramAnalytics;
}

// ============================================
// INSTAGRAM ANALYTICS TYPES
// ============================================

export interface FollowersOverTime {
  date: string;
  value: number;
}

export interface LikesOverTime {
  date: string;
  value: number;
}

export interface AudienceTypes {
  suspiciousMassFollowers: number;
  bots: number;
  realPeople: number;
  influencers: number;
  massFollowers: number;
}

export interface AudienceCity {
  name: string;
  weight: number;
}

export interface AudienceCountry {
  name: string;
  weight: number;
}

export interface GenderSplit {
  label: string;
  value: number;
}

export interface PopularPost {
  id: string;
  type: string;
  url: string;
  date: string;
  likes: number;
  commentsCount: number;
  text?: string;
}

export interface InstagramAnalytics {
  username: string;
  fullName: string;
  bio: string;
  isVerified: boolean;
  fakeFollowers: number;
  audienceCredibility: number;
  followers: number;
  averageLikes: number;
  averageComments: number;
  averageReelPlays: number;
  engagementRate: number;
  followersOverTime: FollowersOverTime[];
  likesOverTime: LikesOverTime[];
  mostUsedMentions: string[];
  mostUsedHashtags: string[];
  audienceTypes: AudienceTypes;
  audienceCities: AudienceCity[];
  audienceCountries: AudienceCountry[];
  genderSplit: GenderSplit[];
  popularPosts: PopularPost[];
  engagementForRecentPosts?: Array<[string, number, number]>; // [date, avgLikes, avgComments]
  reportUpdatedAt: string;
  location: string;
  url: string;
}

export interface InfluencerProfile {
  displayName: string;
  username: string; // username
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
  invoiceSetup?: InvoiceSetup;
}

export interface InvoiceSetup {
  stringBased: boolean;
  prefix?: string;
  lastInvoiceNumber?: number;
  commonTerms?: string;
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

export interface BusinessProfileRoleData {
  legalName: string;
  pan: string;
  gstin?: string;
  billingAddress: string;
  isComplete?: boolean;
  updatedAt?: number;
}

export interface BusinessProfile {
  influencer?: BusinessProfileRoleData;
  promoter?: BusinessProfileRoleData;
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
  businessProfile?: BusinessProfile;
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

// Three-Track Status Model
// Each track operates independently and is always visible

export type ProposalStatus =
  | 'created' // Proposal created and sent to influencer
  | 'discussing' // Under discussion/negotiation
  | 'changes_requested' // Proposal edited by promoter, awaiting re-approval
  | 'agreed' // Both parties agreed on terms
  | 'cancelled'; // Proposal cancelled

export type PaymentStatus =
  | 'not_started' // No payment initiated yet
  | 'pending_advance' // Waiting for advance payment (non-escrow)
  | 'pending_escrow' // Waiting for full escrow funding (escrow mode)
  | 'advance_paid' // Advance payment completed/released
  | 'pending_milestone' // Waiting for milestone payment (optional)
  | 'milestone_paid' // Milestone payment completed (optional)
  | 'pending_remaining' // Waiting for remaining payment
  | 'fully_paid'; // All payments completed

export type WorkStatus =
  | 'not_started' // Work not yet started
  | 'in_progress' // Actively working on deliverables
  | 'revision_requested' // Promoter requested revisions (stay in review)
  | 'submitted' // Work submitted, awaiting promoter review
  | 'approved' // Work approved by promoter
  | 'disputed'; // Dispute raised, admin intervention

export type PaymentMode = 'none' | 'platform' | 'escrow';

// Payment schedule item for flexible milestone configuration
export interface PaymentScheduleItem {
  id: string;
  type: 'advance' | 'milestone' | 'remaining';
  name: string;
  amount: number;
  dueAfter?: number; // Percentage of work completion
  status: 'pending' | 'paid' | 'released';
  paidAt?: number;
  proof?: {
    method?: string;
    transactionId?: string;
    screenshotUrl?: string;
    notes?: string;
  };
}

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

  // Three-track status model (new)
  proposalStatus: ProposalStatus;
  paymentStatus: PaymentStatus;
  workStatus: WorkStatus;

  paymentMode?: PaymentMode;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  title: string;
  description: string;
  requirements: string;
  deliverables: string[];
  proposedBudget?: number; // Discussed in chat, not public
  finalAmount?: number; // Agreed amount

  // Payment fields (using flexible schedule)
  advanceAmount?: number; // Deprecated - use paymentSchedule
  advancePercentage: number; // From influencer's config
  remainingAmount?: number; // Deprecated - use paymentSchedule
  paymentSchedule?: PaymentScheduleItem[]; // New flexible payment structure

  attachments: ProposalAttachment[];
  deadline?: number; // timestamp

  // Flags for clearer workflow (deprecated - use three-track status)
  influencerAcceptedTerms?: boolean; // Influencer agreed to finalized proposal terms
  influencerSubmittedWork?: boolean; // Influencer completed the work
  brandApprovedWork?: boolean; // Brand approved the completed work
  completionPercentage: number; // 0-100

  completedDeliverables?: string[];
  workUpdateLog?: {
    timestamp: number;
    note?: string;
    completedDeliverables: string[];
  }[];

  revisionReason?: string;
  revisionRequestedAt?: number;
  revisionRequestedBy?: string;

  disputeReason?: string;
  disputeRaisedAt?: number;
  disputeRaisedBy?: string;

  declineReason?: string;

  fees?: {
    platformFeeInfluencer: number;
    platformFeePromoter?: number;
    escrowFee?: number;
    escrowFeeSplit?: {
      influencer: number;
      promoter: number;
    };
    gstAmount?: number;
    totalPlatformFee: number;
    paidBy: {
      influencer: boolean;
      promoter: boolean;
    };
  };
}

// ============================================
// PROPOSAL HISTORY TYPES
// ============================================

export type ProposalChangeType =
  | 'proposal_created'
  | 'proposal_status_changed'
  | 'proposal_edited'
  | 'changes_requested'
  | 'payment_status_changed'
  | 'advance_paid'
  | 'escrow_funded'
  | 'remaining_paid'
  | 'work_status_changed'
  | 'work_started'
  | 'work_submitted'
  | 'revision_requested'
  | 'work_approved'
  | 'dispute_raised'
  | 'dispute_resolved'
  | 'proposal_cancelled'
  | 'document_uploaded'
  | 'terms_accepted';

export type ProposalHistoryTrack = 'proposal' | 'payment' | 'work';

export interface ProposalHistoryEntry {
  id: string;
  proposalId: string;
  changedBy: string;
  changedByRole: 'influencer' | 'promoter' | 'system';
  changedByName?: string;
  timestamp: number;
  changeType: ProposalChangeType;
  track: ProposalHistoryTrack;
  previousStatus?: string;
  newStatus?: string;
  changedFields?: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
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

export type TransactionType = 'advance' | 'final' | 'refund' | 'platform_fee' | 'verification';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  proposalId: string;
  payerId: string; // Promoter or Influencer
  receiverId: string; // Platform or Influencer
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
  paymentMode?: PaymentMode;
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
