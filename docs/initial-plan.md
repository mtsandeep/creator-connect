# Influencer Marketplace - Implementation Plan

## Project Overview
A marketplace connecting influencers with promoters (brands/agencies) for promotional collaborations, featuring user profiles, chat, payments, and ratings.

## Tech Stack
- **Frontend**: React with TypeScript
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **Payment**: Razorpay (Indian market focused)
- **UI Library**: Tailwind CSS + shadcn/ui (modern, accessible components)
- **State Management**: Zustand
- **Real-time**: Firestore for chat
- **Authentication**: Google OAuth only (no email/password)

## Business Rules
- **Platform Fee**: 0% (platform doesn't charge commission)
- **Advance Payment**: Configurable by influencer, maximum 50%
- **Verification**: Basic badge system (verified after completing first project)
- **Dispute Resolution**: Manual only - promoters contact support via email/form
- **Payment Structure**: Simple only (advance + final), no milestones
- **Notifications**: Email notifications for key actions
- **Mobile**: Responsive web-only (no native app planned)
- **User Types**: Influencers and Promoters (agencies can manage multiple brands)
- **Authentication**: Google OAuth only (no email/password)
- **Pricing**: NOT shown publicly - discussed only in private chat

---

## Database Schema (Firestore)

```typescript
// users/{userId}
{
  uid: string
  email: string
  role: 'influencer' | 'promoter' | 'admin'
  createdAt: timestamp
  profileComplete: boolean
  // Influencer specific
  influencerProfile?: {
    displayName: string
    bio: string
    categories: string[]
    socialMediaLinks: {
      platform: string
      url: string
      followerCount: number
    }[]
    profileImage: string
    mediaKit?: string
    pricing: {
      startingFrom: number
      advancePercentage: number    // 0-50%, configurable
      rates: {
        type: string               // story, post, reel, video
        price: number
      }[]
    }
    location?: string
    languages: string[]
  }
  // Promoter specific
  promoterProfile?: {
    name: string
    type: 'individual' | 'agency'
    industry: string
    website: string
    logo: string
    description: string
    location: string
    brands?: string[]               // For agencies
  }
  avgRating: number
  totalReviews: number
}

// proposals/{proposalId}
{
  id: string
  promoterId: string
  influencerId: string
  status: 'pending' | 'discussing' | 'finalized' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
  createdAt: timestamp
  updatedAt: timestamp
  title: string
  description: string
  requirements: string
  deliverables: string[]
  proposedBudget: number
  finalAmount?: number
  advancePaid: boolean
  advanceAmount: number
  advancePercentage: number
  remainingAmount: number
  attachments: {
    name: string
    url: string
    type: string
    uploadedBy: string
    uploadedAt: timestamp
  }[]
  deadline?: timestamp
  brandApproval?: boolean
  influencerApproval?: boolean
}

// messages/{messageId}
{
  id: string
  proposalId: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'image' | 'file'
  attachmentUrl?: string
  attachmentName?: string
  timestamp: timestamp
  read: boolean
}

// reviews/{reviewId}
{
  id: string
  proposalId: string
  reviewerId: string
  revieweeId: string
  reviewerRole: 'influencer' | 'promoter'
  rating: number                    // 1-5
  comment: string
  createdAt: timestamp
}

// transactions/{transactionId}
{
  id: string
  proposalId: string
  payerId: string                   // Promoter
  receiverId: string                // Influencer
  amount: number
  type: 'advance' | 'final' | 'refund'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  paymentMethod: string
  createdAt: timestamp
  completedAt?: timestamp
}
```

---

## Implementation Sprints

### Sprint 1: Foundation
1. Project setup with Vite + React + TypeScript
2. Firebase configuration (Google OAuth)
3. Zustand store setup
4. Google Sign-In flow
5. Basic routing structure
6. Core UI components from shadcn/ui

### Sprint 2: User Profiles
1. Influencer profile creation/edit
2. Promoter profile creation/edit (individual + agency types)
3. Profile image uploads
4. Public profile pages
5. Brand management for agencies

### Sprint 3: Proposal System
1. Create proposal UI
2. Proposal list/filter
3. Proposal detail view
4. Status management

### Sprint 4: Chat System
1. Real-time chat interface
2. File/image upload in chat
3. Chat list view
4. Notifications

### Sprint 5: Search & Discovery
1. Influencer browse page
2. Advanced filters (no price filter)
3. Search functionality
4. Favorites system

### Sprint 6: Payments
1. Razorpay integration
2. Payment flow UI (escrow system)
3. Firebase Functions for payment logic
4. Transaction history
5. Advance % configuration

### Sprint 7: Ratings
1. Review submission
2. Display reviews on profiles
3. Rating calculations

### Sprint 8: Polish
1. Dashboard for both user types
2. Email notification system
3. Responsive design
4. Error handling
5. Loading states
6. Contact/support form
7. Agency brand switcher

---

## Key Dependencies
```json
{
  "react": "^18.3.0",
  "react-router-dom": "^6.22.0",
  "firebase": "^10.8.0",
  "react-firebase-hooks": "^5.1.1",
  "razorpay": "^2.8.6",
  "zustand": "^4.5.0",
  "lucide-react": "^0.344.0",
  "tailwindcss": "^3.4.1",
  "zod": "^3.22.4"
}
```

---

## Project Structure
```
src/
├── lib/
│   ├── firebase.ts              # Firebase initialization
│   └── razorpay.ts             # Razorpay setup
├── stores/
│   ├── authStore.ts           # Auth state
│   ├── chatStore.ts           # Chat state
│   ├── proposalStore.ts       # Proposal state
│   └── uiStore.ts             # UI state
├── types/index.ts              # TypeScript types
├── hooks/
│   ├── useAuth.ts
│   ├── useProposal.ts
│   └── useChat.ts
├── pages/
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── InfluencerDashboard.tsx
│   ├── PromoterDashboard.tsx
│   ├── BrowseInfluencers.tsx
│   ├── ProposalDetail.tsx
│   └── Chat.tsx
└── components/
    ├── influencer/
    ├── chat/
    ├── payment/
    ├── common/
    └── layout/
```
