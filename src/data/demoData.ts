// ============================================
// DEMO DATA - Mock data for demo pages
// ============================================

// Demo-specific types (simplified for display purposes)
export interface DemoInfluencer {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  categories: string[];
  location: string;
  profileImage: string;
  socialMediaLinks: {
    platform: string;
    url: string;
    followerCount: number;
  }[];
  pricing: {
    startingFrom: number;
    advancePercentage: number;
    rates: { type: string; price: number }[];
  };
  avgRating: number;
  totalReviews: number;
  isVerified: boolean;
}

export interface DemoBrand {
  uid: string;
  name: string;
  type: string;
  logo: string;
  website: string;
  description: string;
  location: string;
  categories: string[];
}

// Mock Influencer Profile
export const demoInfluencer: DemoInfluencer = {
  uid: 'demo-influencer-001',
  displayName: 'Priya Sharma',
  username: 'priyacreates',
  bio: 'Fashion & Lifestyle Creator | Mumbai 🇮🇳\nCollaborating with brands that inspire. DM for business inquiries.',
  categories: ['Fashion', 'Lifestyle'],
  location: 'Mumbai, India',
  profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
  socialMediaLinks: [
    {
      platform: 'instagram',
      url: 'https://instagram.com/priyacreates',
      followerCount: 125000,
    },
    {
      platform: 'youtube',
      url: 'https://youtube.com/@priyacreates',
      followerCount: 45000,
    },
    {
      platform: 'facebook',
      url: 'https://facebook.com/priyacreates',
      followerCount: 85000,
    },
  ],
  pricing: {
    startingFrom: 15000,
    advancePercentage: 30,
    rates: [
      { type: 'Instagram Reel', price: 25000 },
      { type: 'Instagram Story', price: 8000 },
      { type: 'Instagram Post', price: 15000 },
      { type: 'YouTube Video', price: 50000 },
    ],
  },
  avgRating: 4.8,
  totalReviews: 23,
  isVerified: true,
};

// Mock Brand Profile
export const demoBrand: DemoBrand = {
  uid: 'demo-brand-001',
  name: 'Styli Fashion',
  type: 'company',
  logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
  website: 'https://stylifashion.com',
  description: 'Sustainable fashion brand creating timeless pieces for the modern woman.',
  location: 'Mumbai, India',
  categories: ['Fashion', 'Apparel'],
};

// Mock Chat Messages
export interface DemoMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export const demoChatMessages: DemoMessage[] = [
  {
    id: 'msg-001',
    senderId: 'demo-brand-001',
    senderName: 'Styli Fashion',
    senderAvatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
    content: 'Hi Priya! 👋 I came across your profile and absolutely love your content style. We\'re looking for fashion creators for our upcoming summer collection launch.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: true,
  },
  {
    id: 'msg-002',
    senderId: 'demo-influencer-001',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    content: 'Hey! Thank you so much for reaching out. I love sustainable fashion and Styli\'s aesthetic is right up my alley! I\'d love to hear more about the collaboration.',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
    isRead: true,
  },
  {
    id: 'msg-003',
    senderId: 'demo-brand-001',
    senderName: 'Styli Fashion',
    senderAvatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
    content: 'Perfect! Here\'s what we\'re looking for:\n\n• 1 Instagram Reel (30-45 seconds) showcasing 3-4 summer pieces\n• 3 Instagram Stories with swipe-up links\n• Content delivery within 2 weeks\n\nBudget: ₹35,000 (all inclusive)\n\nWould this work for you? I can send a formal proposal with all details.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: true,
  },
  {
    id: 'msg-004',
    senderId: 'demo-influencer-001',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    content: 'That sounds great! The deliverables align well with my content style. Could you share more details about the creative direction? Also, I typically work with 30% advance. Let\'s proceed with the formal proposal! 🎉',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    isRead: true,
  },
];

// Demo Proposal Type
export interface DemoProposal {
  id: string;
  title: string;
  description: string;
  requirements: string;
  deliverables: string[];
  proposedBudget: number;
  finalAmount: number;
  advancePercentage: number;
  advanceAmount: number;
  remainingAmount: number;
  deadline: number;
  proposalStatus: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'cancelled';
  paymentStatus: 'not_started' | 'advance_pending' | 'advance_paid' | 'fully_paid';
  workStatus: 'not_started' | 'in_progress' | 'submitted' | 'revision_requested' | 'approved';
  promoterId: string;
  influencerId: string;
  createdAt: number;
  updatedAt: number;
  paymentSchedule: {
    id: string;
    type: 'advance' | 'milestone' | 'remaining';
    name: string;
    amount: number;
    status: 'pending' | 'paid' | 'released';
  }[];
}

// Mock Proposal
export const demoProposal: DemoProposal = {
  id: 'demo-proposal-001',
  title: 'Styli Summer Collection Campaign',
  description: 'We\'re launching our Summer 2024 collection and looking for fashion creators to showcase our sustainable pieces. The campaign focuses on versatile, everyday fashion that transitions from work to weekend.',
  requirements: '1. Content should highlight the sustainable aspects of our clothing\n2. Tag @stylifashion and use #StyliSummer\n3. Natural lighting preferred\n4. Show styling versatility (at least 2 different looks per piece)',
  deliverables: [
    '1x Instagram Reel (30-45 seconds)',
    '3x Instagram Stories with swipe-up links',
    'High-resolution photos for brand usage (optional add-on)',
  ],
  proposedBudget: 35000,
  finalAmount: 35000,
  advancePercentage: 30,
  advanceAmount: 10500,
  remainingAmount: 24500,
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).getTime(), // 14 days from now
  proposalStatus: 'sent',
  paymentStatus: 'not_started',
  workStatus: 'not_started',
  promoterId: 'demo-brand-001',
  influencerId: 'demo-influencer-001',
  createdAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
  updatedAt: Date.now() - 24 * 60 * 60 * 1000,
  paymentSchedule: [
    {
      id: 'pay-001',
      type: 'advance',
      name: 'Advance Payment',
      amount: 10500,
      status: 'pending',
    },
    {
      id: 'pay-002',
      type: 'remaining',
      name: 'Final Payment',
      amount: 24500,
      status: 'pending',
    },
  ],
};

// Mock Accepted Proposal (for later steps)
export const demoProposalAccepted: DemoProposal = {
  ...demoProposal,
  proposalStatus: 'accepted',
  paymentStatus: 'advance_paid',
  workStatus: 'in_progress',
};

// Mock Completed Proposal
export const demoProposalCompleted: DemoProposal = {
  ...demoProposal,
  proposalStatus: 'accepted',
  paymentStatus: 'fully_paid',
  workStatus: 'approved',
};

// Demo Review Type
export interface DemoReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: number;
}

// Mock Reviews
export const demoReviews: DemoReview[] = [
  {
    id: 'review-001',
    reviewerId: 'demo-brand-001',
    reviewerName: 'Styli Fashion',
    rating: 5,
    comment: 'Priya was amazing to work with! She delivered high-quality content ahead of schedule and was very professional throughout. The reel performed exceptionally well with our audience.',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'review-002',
    reviewerId: 'brand-002',
    reviewerName: 'TechGadgets India',
    rating: 5,
    comment: 'Great collaboration! Priya understood our product perfectly and created authentic content. Would definitely work together again.',
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'review-003',
    reviewerId: 'brand-003',
    reviewerName: 'Wellness Co.',
    rating: 4,
    comment: 'Professional and creative. The content quality exceeded our expectations. Minor communication delay but overall excellent experience.',
    createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
  },
];

// Mock Browse Influencers List
export const demoInfluencers: DemoInfluencer[] = [
  demoInfluencer,
  {
    uid: 'demo-influencer-002',
    displayName: 'Arjun Mehta',
    username: 'arjunfitness',
    bio: 'Fitness Coach | Nutrition Enthusiast 💪\nHelping you become the best version of yourself',
    categories: ['Fitness', 'Lifestyle'],
    location: 'Delhi, India',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    socialMediaLinks: [
      { platform: 'instagram', url: 'https://instagram.com/arjunfitness', followerCount: 89000 },
      { platform: 'youtube', url: 'https://youtube.com/@arjunfitness', followerCount: 120000 },
    ],
    pricing: {
      startingFrom: 20000,
      advancePercentage: 50,
      rates: [],
    },
    avgRating: 4.9,
    totalReviews: 45,
    isVerified: true,
  },
  {
    uid: 'demo-influencer-003',
    displayName: 'Sneha Kapoor',
    username: 'snehacooks',
    bio: 'Food Blogger | Recipe Developer 🍳\nBringing delicious recipes to your kitchen',
    categories: ['Food', 'Lifestyle'],
    location: 'Bangalore, India',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    socialMediaLinks: [
      { platform: 'instagram', url: 'https://instagram.com/snehacooks', followerCount: 156000 },
      { platform: 'youtube', url: 'https://youtube.com/@snehacooks', followerCount: 78000 },
    ],
    pricing: {
      startingFrom: 18000,
      advancePercentage: 25,
      rates: [],
    },
    avgRating: 4.7,
    totalReviews: 32,
    isVerified: true,
  },
  {
    uid: 'demo-influencer-004',
    displayName: 'Rahul Verma',
    username: 'techwithrahul',
    bio: 'Tech Reviewer | Gadget Enthusiast 📱\nUnboxing the latest tech and sharing honest reviews',
    categories: ['Technology'],
    location: 'Hyderabad, India',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    socialMediaLinks: [
      { platform: 'instagram', url: 'https://instagram.com/techwithrahul', followerCount: 45000 },
      { platform: 'youtube', url: 'https://youtube.com/@techwithrahul', followerCount: 35000 },
    ],
    pricing: {
      startingFrom: 8000,
      advancePercentage: 25,
      rates: [],
    },
    avgRating: 4.6,
    totalReviews: 12,
    isVerified: false,
  },
  {
    uid: 'demo-influencer-005',
    displayName: 'Ananya Reddy',
    username: 'ananyacreates',
    bio: 'DIY & Craft Creator ✨\nMaking everyday things beautiful, one project at a time',
    categories: ['Fashion', 'Lifestyle'],
    location: 'Chennai, India',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    socialMediaLinks: [
      { platform: 'instagram', url: 'https://instagram.com/ananyacreates', followerCount: 5500 },
      { platform: 'youtube', url: 'https://youtube.com/@ananyacreates', followerCount: 3200 },
    ],
    pricing: {
      startingFrom: 3000,
      advancePercentage: 25,
      rates: [],
    },
    avgRating: 4.5,
    totalReviews: 5,
    isVerified: false,
  },
];

// Demo Flow Definitions
export interface DemoFlow {
  id: string;
  title: string;
  description: string;
  targetAudience: 'brand' | 'influencer' | 'both';
  steps: DemoFlowStep[];
  icon: string;
  comingSoon?: boolean;
}

export interface DemoFlowStep {
  path: string;
  title: string;
  description: string;
}

export const demoFlows: DemoFlow[] = [
  {
    id: 'linkbio',
    title: 'Link-in-Bio Discovery',
    description: 'See how brands discover you through your Instagram link-in-bio',
    targetAudience: 'both',
    icon: '🔗',
    steps: [
      { path: '/demo/linkbio/instagram', title: 'Instagram Profile', description: 'Brand finds your link on Instagram' },
      { path: '/demo/linkbio/profile', title: 'Your Profile', description: 'Brand views your public profile' },
      { path: '/demo/linkbio/chat', title: 'Start Chat', description: 'Brand initiates conversation' },
      { path: '/demo/linkbio/proposal', title: 'Send Proposal', description: 'Brand sends collaboration proposal' },
    ],
  },
  {
    id: 'brand-discover',
    title: 'How Brands Discover You Through ColLoved',
    description: 'See the journey from brand search to your inbox',
    targetAudience: 'influencer',
    icon: '🔍',
    steps: [
      { path: '/demo/brand-discover/browse', title: 'Browse', description: 'Brand searches for influencers' },
      { path: '/demo/brand-discover/profile', title: 'Profile View', description: 'Brand views your profile' },
      { path: '/demo/brand-discover/chat', title: 'Chat', description: 'Brand starts a conversation' },
      { path: '/demo/brand-discover/proposal', title: 'Proposal', description: 'Brand sends a proposal' },
    ],
  },
  {
    id: 'deal-management',
    title: 'Deal Management Flow',
    description: 'Learn how to manage your promotions from proposal to payment',
    targetAudience: 'influencer',
    icon: '📋',
    comingSoon: true,
    steps: [
      { path: '/demo/deal-management/proposals', title: 'Proposals', description: 'View incoming proposals' },
      { path: '/demo/deal-management/proposal', title: 'Review', description: 'Review proposal details' },
      { path: '/demo/deal-management/tracking', title: 'Tracking', description: 'Track your deliverables' },
      { path: '/demo/deal-management/complete', title: 'Complete', description: 'Get paid and review' },
    ],
  },
  {
    id: 'brand-journey',
    title: "Brand's Complete Journey",
    description: 'Full workflow from discovering influencers to completing deals',
    targetAudience: 'brand',
    icon: '🏢',
    comingSoon: true,
    steps: [
      { path: '/demo/brand-journey/browse', title: 'Discover', description: 'Search and filter influencers' },
      { path: '/demo/brand-journey/profile', title: 'View Profile', description: 'Review influencer details' },
      { path: '/demo/brand-journey/chat', title: 'Chat', description: 'Start conversation' },
      { path: '/demo/brand-journey/create-proposal', title: 'Create Proposal', description: 'Send collaboration brief' },
      { path: '/demo/brand-journey/negotiate', title: 'Negotiate', description: 'Discuss terms' },
      { path: '/demo/brand-journey/track', title: 'Track', description: 'Monitor deliverables' },
      { path: '/demo/brand-journey/complete', title: 'Complete', description: 'Approve and pay' },
    ],
  },
  {
    id: 'influencer-journey',
    title: "Influencer's Complete Journey",
    description: 'Full workflow from receiving proposals to getting paid',
    targetAudience: 'influencer',
    icon: '⭐',
    comingSoon: true,
    steps: [
      { path: '/demo/influencer-journey/inbox', title: 'Inbox', description: 'Receive new proposal' },
      { path: '/demo/influencer-journey/review', title: 'Review', description: 'Evaluate terms' },
      { path: '/demo/influencer-journey/accept', title: 'Accept', description: 'Lock in the deal' },
      { path: '/demo/influencer-journey/submit', title: 'Submit', description: 'Upload deliverables' },
      { path: '/demo/influencer-journey/payment', title: 'Payment', description: 'Get paid' },
    ],
  },
  {
    id: 'linkbio-preview',
    title: 'Your Link-in-Bio Preview',
    description: 'See what your public profile looks like to brands',
    targetAudience: 'influencer',
    icon: '👁️',
    steps: [
      { path: '/demo/linkbio-preview', title: 'Preview', description: 'Your public profile' },
    ],
  },
];
