# CreatorConnect - Development Progress Tracker

**Last Updated:** 2025-12-31

---

## Project Overview

**CreatorConnect** is the operating system for influencer marketing—a unified workspace for creators, brands, and agents to handle deals professionally, beyond the DM/WhatsApp chaos, with compliance built-in.

**Pricing Model (High Level):**
- **Record Only**: Documentation + compliance trail for deals done outside escrow.
- **Payment Escrow**: Funds handled via platform (Razorpay) with tiered fees.
- **Display rule**: Wherever pricing is shown, store both `originalPrice` and `price`. If `originalPrice` is present, show `originalPrice` crossed and `price` as the current price (e.g., `₹99` → `₹49`).

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Firebase (Auth, Firestore, Storage, Functions)
- Payment: Razorpay
- UI: Tailwind CSS + custom components
- State: Zustand
- Router: React Router v7

---

# COMPLETED PHASES

---

## Phase 1: Foundation ✅ COMPLETE

### Project Setup ✅
- [x] Vite + React + TypeScript initialized
- [x] Tailwind CSS configured
- [x] Folder structure created
- [x] Basic routing setup

### Firebase Configuration ✅
- [x] Firebase project created
- [x] Environment variables configured (`.env`)
- [x] Firebase Auth enabled (Google OAuth)
- [x] Firestore Database created
- [x] Firebase Storage enabled
- [x] Security rules configured

### State Management ✅
- [x] Zustand store setup
- [x] Auth store implemented
- [x] UI store implemented
- [x] Persistence middleware configured

### Authentication ✅
- [x] Google OAuth integration
- [x] Auth state listener (`useAuth` hook)
- [x] Sign in/sign out functionality
- [x] Protected route wrapper
- [x] Smart redirect logic (profileComplete check)

---

## Phase 2: User Authentication ✅ COMPLETE

### Pages ✅
- [x] [Landing.tsx](../src/pages/Landing.tsx) - Home page with features
- [x] [Login.tsx](../src/pages/Login.tsx) - Google sign-in
- [x] [RoleSelection.tsx](../src/pages/RoleSelection.tsx) - Choose influencer/promoter
- [x] [InfluencerSignup.tsx](../src/pages/InfluencerSignup.tsx) - Influencer profile setup
- [x] [PromoterSignup.tsx](../src/pages/PromoterSignup.tsx) - Promoter profile setup

### Auth Flow ✅
- [x] First-time users → Role selection → Signup → Dashboard
- [x] Returning users → Direct to dashboard
- [x] Profile incomplete users → Back to signup
- [x] Sign out with redirect to home

### Layouts ✅
- [x] [InfluencerLayout.tsx](../src/components/layout/InfluencerLayout.tsx) - Sidebar navigation
- [x] [PromoterLayout.tsx](../src/components/layout/PromoterLayout.tsx) - Sidebar navigation
- [x] Logo links to home page in both layouts
- [x] Mobile responsive sidebar
- [x] User profile summary in sidebar

---

## Phase 3: Influencer Features ✅ COMPLETE

### Profile Management
- [x] Profile creation form (InfluencerSignup.tsx)
- [x] Profile editing page - [`Profile.tsx`](../src/pages/influencer/Profile.tsx)
- [ ] Public profile view (`/influencer/:id`)
- [x] Profile image upload
- [x] Media kit upload (PDF)
- [x] Social media links management
- [x] Category/niche selection
- [x] Pricing structure (per post type)
- [x] Advance % configuration (0-50%)

### Dashboard
- [x] Dashboard with real data and stats - [`Dashboard.tsx`](../src/pages/influencer/Dashboard.tsx)
- [x] Active proposals list
- [x] Payment status overview
- [x] Unread messages count
- [x] Earnings summary
- [x] Quick action cards

### Pages ✅
- [x] [`Dashboard.tsx`](../src/pages/influencer/Dashboard.tsx) - Real-time stats and recent proposals
- [x] [`Proposals.tsx`](../src/pages/influencer/Proposals.tsx) - View/manage collaboration proposals
- [x] [`Messages.tsx`](../src/pages/influencer/Messages.tsx) - Real-time chat with brands
- [x] [`Earnings.tsx`](../src/pages/influencer/Earnings.tsx) - Track payments and earnings
- [x] [`Profile.tsx`](../src/pages/influencer/Profile.tsx) - View/edit public profile
- [x] [`Settings.tsx`](../src/pages/influencer/Settings.tsx) - Account and pricing settings

---

## Phase 4: Promoter Features ✅ COMPLETE

### Profile Management
- [x] Profile creation form (PromoterSignup.tsx)
- [x] Profile editing page - [`Profile.tsx`](../src/pages/promoter/Profile.tsx)
- [x] Logo upload
- [x] Industry selection
- [x] Company description
- [x] Individual vs Agency type support

### Dashboard
- [x] Dashboard with real data and stats - [`Dashboard.tsx`](../src/pages/promoter/Dashboard.tsx)
- [x] Active proposals tracking
- [x] Spend analytics (total spent, pending payments)
- [x] Quick action cards

### Pages ✅
- [x] [`Dashboard.tsx`](../src/pages/promoter/Dashboard.tsx) - Real-time stats and recent proposals
- [x] [`Browse.tsx`](../src/pages/promoter/Browse.tsx) - Discover influencers with filters
- [x] [`Proposals.tsx`](../src/pages/promoter/Proposals.tsx) - View/manage proposals
- [x] [`Messages.tsx`](../src/pages/promoter/Messages.tsx) - Real-time chat with influencers
- [x] [`Profile.tsx`](../src/pages/promoter/Profile.tsx) - View/edit brand profile
- [x] [`Settings.tsx`](../src/pages/promoter/Settings.tsx) - Account settings

---

## Phase 5: Search & Discovery ✅ COMPLETE

### Influencer Browse (`/promoter/browse`)
- [x] Search by name, category, location
- [x] Filters:
  - [x] Follower count range
  - [x] Category/niche
  - [x] Rating (min 4+ stars)
  - [x] Location
  - [x] Languages
  - [x] Verified badge status
- [x] Grid/list view toggle
- [x] Save to favorites
- [x] **Note**: Price NOT shown publicly (discussed in chat only)
- [x] Promoter verification required (₹1,000 deposit) - DEV skip button for testing

### Components
- [x] [`InfluencerCard.tsx`](../src/components/influencer/InfluencerCard.tsx) - Display influencer in search results (grid & list views)
- [x] [`FilterPanel.tsx`](../src/components/promoter/FilterPanel.tsx) - Search filters (mobile & desktop)
- [x] [`FavoriteButton.tsx`](../src/components/promoter/FavoriteButton.tsx) - Save/unsave influencers

---

## Phase 6: Chat/Messaging System ✅ COMPLETE

### Real-time Chat
- [x] Firebase/Firestore for messages collection
- [x] Chat interface component
- [x] Message types:
  - [x] Text messages
  - [x] Image uploads
  - [x] File attachments (PDFs, docs)
- [x] Read receipts
- [x] Typing indicators
- [x] Message timestamps

### Chat Pages
- [x] Chat list with proposal info
- [x] Individual chat view
- [x] Search within conversation
- [x] Download attachments
- [ ] Notifications for new messages (email)

### Components
- [x] [`ChatWindow.tsx`](../src/components/chat/ChatWindow.tsx) - Messaging interface
- [x] [`ChatList.tsx`](../src/components/chat/ChatList.tsx) - List of conversations
- [x] [`FileUpload.tsx`](../src/components/chat/FileUpload.tsx) - Drag-drop file upload
- [x] [`MessageBubble.tsx`](../src/components/chat/MessageBubble.tsx) - Individual message display

### Hooks
- [x] [`useChat.ts`](../src/hooks/useChat.ts) - Chat hooks (useConversations, useMessages, useSendMessage, useMarkAsRead)

### Pages
- [x] [`ChatView.tsx`](../src/pages/ChatView.tsx) - Shared chat view page
- [x] [`influencer/Messages.tsx`](../src/pages/influencer/Messages.tsx) - Influencer messages list
- [x] [`promoter/Messages.tsx`](../src/pages/promoter/Messages.tsx) - Promoter messages list

---

## Phase 7: Proposal System ✅ COMPLETE

### Proposal Management
- [x] Create proposal flow
- [x] Proposal detail view
- [x] Status management:
  - pending
  - discussing
  - finalized
  - in_progress
  - completed
  - cancelled
  - disputed
- [x] Deliverables tracking
- [x] File attachments
- [x] Deadline management

### Proposal Flow
1. Promoter sends proposal to influencer → `status: pending`
2. Influencer accepts → `status: discussing`
3. Both parties discuss in chat (price, deliverables)
4. Promoter finalizes proposal → `status: finalized`, sets `finalAmount`, calculates `advanceAmount`/`remainingAmount`
5. **Influencer accepts finalized terms** → `influencerAcceptedTerms: true`
6. **Promoter marks as paid** → `advancePaid: true`, `status: in_progress`
7. **Influencer submits work** → `influencerSubmittedWork: true`, `completionPercentage: 100`
8. **Promoter approves work** → `brandApprovedWork: true`, `status: completed`

### Workflow Flags
| Flag | Set By | When | Purpose |
|------|--------|------|---------|
| `influencerAcceptedTerms` | Influencer | After promoter finalizes | Influencer agreed to work on these terms |
| `influencerSubmittedWork` | Influencer | When work is complete | Work submitted for approval |
| `brandApprovedWork` | Promoter | After reviewing work | Work approved, ready for completion |

### Components
- [x] [`ProposalCard.tsx`](../src/components/proposal/ProposalCard.tsx) - Summary in dashboard
- [x] [`ProposalDetail.tsx`](../src/components/proposal/ProposalDetail.tsx) - Full proposal view
- [x] [`CreateProposalForm.tsx`](../src/components/proposal/CreateProposalForm.tsx) - New proposal form
- [x] [`DeliverableTracker.tsx`](../src/components/proposal/DeliverableTracker.tsx) - Track progress

### Hooks
- [x] [`useProposal.ts`](../src/hooks/useProposal.ts) - Proposal hooks (useProposals, useProposal, useCreateProposal, useRespondToProposal, useFinalizeProposal, useUpdateProposal, useDeleteProposal)

### Pages
- [x] [`influencer/Proposals.tsx`](../src/pages/influencer/Proposals.tsx) - Influencer proposals (list, detail, create modes)
- [x] [`promoter/Proposals.tsx`](../src/pages/promoter/Proposals.tsx) - Promoter proposals (list, detail, create modes)

---

## Phase 12: Admin System ✅ COMPLETE

### Admin Authentication & Authorization
- [x] Admin role in user types (`roles: ['admin']`)
- [x] Admin-only routes and pages
- [x] Admin layout with sidebar navigation
- [x] Assign admin role to existing users
- [x] Firebase security rules for admin operations

### User Management
- [x] List all influencers (username, email, verification status, ban status)
  - [x] Search by name or email
- [x] List all promoters (name, email, verification status, ban status)
  - [x] Search by company name or email
- [ ] Transaction history view (not available through impersonation)
  - [ ] All payments across the platform

### Verification Badges
- [x] "Verified" badge system (existing - after first completed project)
- [x] "Trusted" badge system:
  - [x] Admin can assign "trusted" badge to influencers
  - [x] Admin can assign "trusted" badge to promoters
  - [x] Badge displayed on profile cards
  - [ ] Filter by "trusted" status in browse
- [x] Badge management interface

### User Actions
- [x] Ban/disable user functionality
  - [x] Reason for ban (required field)
  - [x] Ban date tracking
  - [x] Ban list management
- [x] Unban/re-enable user functionality
- [x] Activity log for admin actions

### User Impersonation
- [x] "Login as user" feature for admins
- [x] Top banner when impersonating:
  - [x] Shows "Viewing as: [User Name]"
  - [x] Exit/Stop impersonating button
  - [x] Distinct visual style (warning color - orange/red gradient)
- [x] View-only mode (no write actions blocked at Firestore level)
- [x] Audit log for impersonation sessions
- [x] Cannot impersonate other admins

### Admin Pages
- [x] [`Dashboard.tsx`](../src/pages/admin/Dashboard.tsx) - Admin overview with stats
- [x] [`Influencers.tsx`](../src/pages/admin/Influencers.tsx) - List and manage influencers
- [x] [`Promoters.tsx`](../src/pages/admin/Promoters.tsx) - List and manage promoters
- [ ] [`UserDetail.tsx`](../src/pages/admin/UserDetail.tsx) - Individual user view
- [x] [`Verifications.tsx`](../src/pages/admin/Verifications.tsx) - Manage verification badges

### Admin Components
- [x] `<UserTable />` - Sortable/filterable user list (integrated in pages)
- [x] `<ImpersonationBanner />` - Top banner for impersonation
- [x] `<ActionLog />` - Track admin actions (integrated in dashboard)

### Firebase Collections Updates

#### users/{userId} - Additional fields
```typescript
{
  // ... existing fields
  isBanned: boolean
  banReason?: string
  bannedAt?: timestamp
  bannedBy?: string  // admin uid

  // Verification badges
  verificationBadges: {
    verified: boolean      // Auto after first completed project
    trusted: boolean       // Admin-assigned
  }
  trustedAt?: timestamp
  trustedBy?: string      // admin uid
}
```

#### adminLogs/{logId} - NEW
```typescript
{
  id: string
  adminId: string
  adminEmail: string
  action: 'ban_user' | 'unban_user' | 'assign_trusted' | 'remove_trusted' | 'assign_admin' | 'impersonate_start' | 'impersonate_end'
  targetUserId?: string
  targetUserEmail?: string
  reason?: string
  timestamp: timestamp
  metadata?: Record<string, any>
}
```

#### impersonation/{adminId} - NEW
```typescript
{
  adminId: string
  impersonatedUserId: string
  startTime: timestamp
}
```

### Firebase Security Rules (Admin)
- [x] Admin-only collections/fields (adminLogs)
- [x] Trusted badge assignment (admin only)
- [x] Admin role assignment (admin only)
- [x] Impersonation write-blocking on all collections
- [x] `isImpersonating()` helper function
- [x] Admin activity logging allowed even during impersonation

---

# PENDING PHASES

---

## Payments & Compliance (Consolidated Plan)

This is the end-to-end plan for implementing payments. The goal is to ship in this order:

1. **Platform Fee (₹49 per side)**
   - **Influencer platform fee is mandatory** for confirmed deals
   - **Promoter platform fee is optional** for non-escrow deals, and **mandatory for escrow**
   - Supports paying promoter-side ₹49 using verification credits (₹39 effective)
   - Generates invoice/certificate placeholders (documents can be stubbed initially)
2. **Promoter Verification Credits (₹1,000)**
   - Non-refundable, 1-year expiry
   - Credits wallet + discount rules for paying ₹49 via credits
3. **Escrow (Optional) + GST + TDS**
   - Escrow tiers: ₹149 / ₹349 / 10%
   - GST 18% on platform fees (record-keeping + escrow fee)
   - TDS 1% u/s 194-O for cash escrow flows
4. **Tax Compliance Docs**
   - Invoices, compliance certificates, barter ledger (194R), TDS certificate (194-O)

---

## Phase 8: Record-Only & Documentation ⏳ NOT STARTED

### Overview
For WhatsApp/External deals - log deal details to create legal tax trail, generate professional invoice, and document for tax records. No escrow protection - deliberate action by both parties understanding this is for documentation only.

### Features
- [ ] Record-Only deal creation form
- [ ] Professional invoice generation (PDF)
- [ ] Tax documentation:
  - [ ] Deal value recording
  - [ ] Barter valuation ledger (Section 194R)
  - [ ] Certificate of documentation
- [ ] Both parties can track documentation if both sign up/pay their own Record-Only fee

### Firestore Collections

#### proposals/{proposalId} - USED
```typescript
{
  id: string

  // Platform-mode proposal (Record-Only equivalent)
  paymentMode: 'platform'  // becomes 'escrow' if upgraded

  createdBy: string  // uid of creator
  createdAt: timestamp

  // Parties involved
  initiator: {
    userId: string
    role: 'influencer' | 'promoter'
    name: string
    email?: string
  }
  counterparty: {
    userId: string
    role: 'influencer' | 'promoter'
    name: string
    email?: string
  }

  // Deal details
  title: string
  description: string
  dealValue: number
  dealType: 'cash' | 'barter' | 'mixed'
  deliverables: string[]

  // Barter details (if applicable)
  barterItems?: {
    description: string
    value: number
  }[]

  // Dates
  dealDate: timestamp
  completedDate?: timestamp

  // Tax declarations
  taxConfirmation: {
    influencerConfirmed: boolean
    promoterConfirmed: boolean
    confirmedAt: timestamp
  }

  // Documents
  invoiceGenerated: boolean
  invoiceUrl?: string
  certificateGenerated: boolean
  certificateUrl?: string

  // Platform fees tracked on proposal
  fees?: {
    platformFeeInfluencer: number
    platformFeePromoter?: number
    gstAmount?: number
    totalPlatformFee: number
    paidBy: {
      influencer: boolean
      promoter: boolean
    }
  }
}
```

### Pages
- [ ] `RecordOnly.tsx` - Record-Only deal creation form
- [ ] `RecordOnlyDetail.tsx` - View/manage Record-Only deal

### Components
- [ ] `<RecordOnlyForm />` - Deal creation form
- [ ] `<InvoicePreview />` - Invoice preview
- [ ] `<BarterLedgerForm />` - Barter valuation form

### Firebase Functions
- [ ] `createRecordOnlyDeal` - Create new Record-Only deal
- [ ] `generateInvoice` - Generate PDF invoice
- [ ] `generateTaxCertificate` - Generate tax compliance certificate

---

## Phase 9: Promoter Verification Credits ⏳ NOT STARTED

**Fee:** ₹1,000 (verification credits, non-refundable)

### Overview
Promoter must complete verification to browse influencers. Verification amount becomes credits that can be used for paying platform fees. Paying a ₹49 fee using credits applies 20% discount (₹49 → ₹39).

### Features
- [ ] Promoter verification purchase flow
- [ ] Credits system:
  - [ ] Credits balance tracking (₹)
  - [ ] Credits can pay for ₹49 platform fees with 20% discount (₹49 → ₹39)
  - [ ] Credits usage tracking
  - [ ] Credits expiration (1 year from purchase)
- [ ] Browse gate:
  - [ ] Non-verified promoters cannot browse
  - [ ] Upgrade prompt on browse access
- [ ] Credits balance display
- [ ] Purchase history

### Firestore Collections

#### promoterVerifications/{verificationId} - NEW
```typescript
{
  id: string
  promoterId: string
  purchasedAt: timestamp
  expiresAt: timestamp  // 1 year from purchasedAt
  isActive: boolean

  // Credits
  creditsInitial: number  // ₹1000
  creditsRemaining: number
  creditsUsed: number

  // Payment
  amount: number  // ₹1000
  currency: string
  paymentMethod: string
  razorpayPaymentId?: string
  razorpayOrderId?: string
}
```

#### creditTransactions/{transactionId} - NEW
```typescript
{
  id: string
  promoterId: string
  promoterVerificationId: string

  // Transaction details
  type: 'earned' | 'spent' | 'expired'
  credits: number  // positive for earned, negative for spent
  balanceAfter: number

  // Context
  proposalId?: string
  fee: number  // what the credits were used for
  discountedFee?: number  // e.g., 39 when ₹49 fee paid via credits
  discountApplied?: number  // e.g., 10

  timestamp: timestamp
}
```

### Pages
- [ ] `PromoterVerification.tsx` - Purchase flow page
- [ ] `Credits.tsx` - Credits balance and history
- [ ] Update `Browse.tsx` - Add gate for non-verified promoters

### Components
- [ ] `<PromoterVerificationCard />` - Verification purchase card
- [ ] `<CreditsBalance />` - Credits display
- [ ] `<CreditsHistory />` - Credits transaction history
- [ ] `<BrowseGate />` - Upgrade prompt for non-verified promoters

### Firebase Functions
- [ ] `purchasePromoterVerification` - Handle verification purchase
- [ ] `spendCredits` - Deduct credits for deal creation
- [ ] `checkBrowseAccess` - Verify promoter has active verification
- [ ] `expireCredits` - Scheduled function to expire unused credits

---

## Phase 10: Payment System - Escrow 

**Fees:**
- Nano Deal (≤₹5,000): ₹149
- Micro Deal (₹5,001-₹10,000): ₹349
- Pro Deal (>₹10,000): 10%
- Platform Fee: ₹49 per side
  - Influencer platform fee: mandatory
  - Promoter platform fee: mandatory for escrow, optional otherwise

### Overview
Full escrow system with Razorpay integration. Platform fee replaced with tiered pricing. 1% TDS auto-deducted (u/s 194-O) on cash deals.

### Features
- [ ] Razorpay integration
- [ ] Payment form UI
- [ ] Payment status tracking
- [ ] Transaction history
- [ ] Fee calculation based on deal size
- [ ] TDS deduction (1% u/s 194-O)
- [ ] Tax compliance certificate generation
- [ ] Barter valuation ledger (Section 194R)

### Payment Flow (Escrow)
```
1. Proposal finalized → Calculate fee based on deal size
2. Promoter pays full amount + fee to platform (escrow)
3. Advance released to influencer (their configured %, max 50%)
4. Influencer completes work → Submits deliverables + live URL + tag confirmation
5. Promoter reviews → Approves work
6. Remaining amount released to influencer (minus TDS 1%)
7. Tax documents generated automatically
```

### Fee Calculation Logic
```typescript
function calculateEscrowFee(dealAmount: number): number {
  let escrowFee: number;

  if (dealAmount <= 5000) {
    escrowFee = 149;  // Nano Deal
  } else if (dealAmount <= 10000) {
    escrowFee = 349;  // Micro Deal
  } else {
    escrowFee = dealAmount * 0.1;  // Pro Deal (10%)
  }

  return escrowFee;
}
```

### TDS Calculation
```typescript
function calculateTDS(dealAmount: number): { tds: number; netAmount: number } {
  const tds = dealAmount * 0.01;  // 1% u/s 194-O
  const netAmount = dealAmount - tds;
  return { tds, netAmount };
}
```

### Firestore Collections

#### transactions/{transactionId} - UPDATED
```typescript
{
  id: string
  proposalId: string

  // Parties
  payerId: string
  receiverId: string

  // Amounts
  totalAmount: number
  escrowFee: number  // escrow fee tier (₹149/₹349/10%)
  platformFeeInfluencer?: number  // ₹49
  platformFeePromoter?: number  // ₹49 (or ₹39 via credits) - optional unless escrow
  escrowFeeSplit?: {
    influencer: number
    promoter: number
  }
  gstAmount?: number  // 18% on all fees charged (platform fees + escrow fee)
  tdsAmount?: number  // 1% for cash deals
  netToInfluencer: number

  // Transaction type
  type: 'advance' | 'final' | 'refund' | 'verification' | 'platform_fee'
  escrowTier?: 'nano' | 'micro' | 'pro'

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed'
  paymentMethod: string

  // Razorpay
  razorpayPaymentId?: string
  razorpayOrderId?: string
  razorpaySignature?: string

  // Timestamps
  createdAt: timestamp
  completedAt?: timestamp

  // Tax
  tdsCertificateGenerated: boolean
  tdsCertificateUrl?: string
}
```

#### taxDocuments/{documentId} - NEW
```typescript
{
  id: string
  transactionId?: string
  proposalId?: string

  // Document type
  type: 'tds_certificate' | 'barter_ledger' | 'compliance_certificate' | 'invoice'

  // Tax details
  dealAmount: number
  tdsDeducted?: number  // for cash deals
  barterValue?: number  // for barter deals
  section: '194-O' | '194R'

  // Parties
  deductorId?: string  // for TDS
  deducteeId: string
  deductorName: string
  deducteeName: string
  deducteePAN?: string

  // Period
  financialYear: string  // "2024-25"
  quarter?: string  // "Q1", "Q2", etc.

  // Document
  documentUrl: string
  generatedAt: timestamp
}
```

### Firebase Functions
- [ ] `handleProposalPayment` - Process promoter payment
- [ ] `releaseAdvancePayment` - Transfer advance to influencer
- [ ] `releaseFinalPayment` - Transfer remaining amount (minus TDS)
- [ ] `handleRefund` - Process refunds if needed
- [ ] `generateTDSCertificate` - Generate TDS certificate
- [ ] `generateBarterLedger` - Generate barter valuation ledger
- [ ] `generateComplianceCertificate` - Generate compliance certificate
- [ ] `calculateTaxSummary` - Year-end tax summary for user
- [ ] Razorpay webhook handlers

### Pages
- [ ] `Payment.tsx` - Payment form page
- [ ] `PaymentSuccess.tsx` - Payment success page
- [ ] `TransactionHistory.tsx` - Transaction history
- [ ] `TaxDocuments.tsx` - Tax documents listing
- [ ] `TaxSummary.tsx` - Year-end tax summary (for ITR filing)

### Components
- [ ] `<PaymentForm />` - Payment UI
- [ ] `<PaymentStatus />` - Track payment progress
- [ ] `<FeeBreakdown />` - Show fee structure
- [ ] `<ProgressBar />` - Show payment stages
- [ ] `<TransactionList />` - List of transactions
- [ ] `<TaxDocumentCard />` - Tax document display

### Firebase Functions
- [ ] `sendEmailNotification` - Send email via SendGrid/SES
- [ ] `createNotification` - Create in-app notification
- [ ] `markNotificationsRead` - Batch mark as read
- [ ] `cleanupOldNotifications` - Delete notifications older than X days

---

## Phase 11: Grievance Portal 

### Overview
Simple form to report deal issues + listing view. Manual handling via support email. Not a full-blown support system.

### Features
- [ ] Grievance submission form
- [ ] Grievance listing view
- [ ] Status tracking (submitted, under review, resolved)
- [ ] Email notifications to support
- [ ] Basic categorization

### Firestore Collections

#### grievances/{grievanceId} - NEW
```typescript
{
  id: string
  proposalId: string

  // Parties
  submittedBy: string  // userId
  against?: string  // userId (other party)

  // Grievance details
  category: 'payment_stuck' | 'work_not_done' | 'quality_issue' | 'communication' | 'other'
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high'

  // Status
  status: 'submitted' | 'under_review' | 'resolved' | 'dismissed'
  resolutionNotes?: string

  // Timestamps
  createdAt: timestamp
  resolvedAt?: timestamp

  // Attachments
  attachments: {
    name: string
    url: string
    type: string
  }[]
}
```

### Pages
- [ ] `Grievances.tsx` - Grievance listing page
- [ ] `GrievanceDetail.tsx` - Individual grievance view
- [ ] `CreateGrievance.tsx` - Grievance submission form

### Components
- [ ] `<GrievanceForm />` - Submission form
- [ ] `<GrievanceCard />` - Summary card
- [ ] `<GrievanceStatus />` - Status indicator

### Firebase Functions
- [ ] `submitGrievance` - Create new grievance
- [ ] `emailSupportTeam` - Send email notification to support
- [ ] `updateGrievanceStatus` - Update status (admin only)

---

## Phase 13: Rating & Review System 

### Overview
Both parties can review after project completion. 1-5 star rating with optional written review. Reviews displayed on public profiles. "Verified" badge auto-awarded after first completed project.

### Features
- [ ] Review submission after project completion
- [ ] Both parties can review each other
- [ ] Rating: 1-5 stars
- [ ] Written review (optional)
- [ ] Reviews displayed on public profiles
- [ ] Average rating auto-calculated
- [ ] "Verified" badge after first completed project
- [ ] Report inappropriate reviews

### Firestore Collections

#### reviews/{reviewId} - UPDATED
```typescript
{
  id: string
  proposalId: string

  // Parties
  reviewerId: string
  revieweeId: string
  reviewerRole: 'influencer' | 'promoter'

  // Rating
  rating: number  // 1-5
  comment?: string

  // Verification
  isVerifiedPurchase: boolean  // true if deal was through platform

  // Moderation
  isFlagged: boolean
  isHidden: boolean
  flaggedBy?: string
  hiddenBy?: string

  // Timestamps
  createdAt: timestamp
  updatedAt?: timestamp
}
```

### Pages
- [ ] `ReviewSubmission.tsx` - Review submission page
- [ ] Update `Profile.tsx` - Show reviews on public profile

### Components
- [ ] `<ReviewModal />` - Review submission form
- [ ] `<ReviewList />` - Display reviews
- [ ] `<StarRating />` - Display/input ratings
- [ ] `<VerifiedBadge />` - Badge component (already exists)

### Firebase Functions
- [ ] `submitReview` - Create new review
- [ ] `calculateAverageRating` - Update user average rating
- [ ] `awardVerifiedBadge` - Award badge after first completed project
- [ ] `flagReview` - Flag inappropriate review

---

## Phase 14: Notifications 

### Overview
Email notifications for key platform events. In-app notification center for real-time updates.

### Features
- [ ] Email notifications:
  - [ ] New proposal received
  - [ ] Proposal accepted/declined
  - [ ] New message received
  - [ ] Payment received
  - [ ] Work approved
  - [ ] Project completed
  - [ ] Review received
  - [ ] Grievance update
- [ ] In-app notifications:
  - [ ] Notification bell icon
  - [ ] Notification center
  - [ ] Mark as read/unread
  - [ ] Notification preferences
- [ ] Push notifications (future)

### Firestore Collections

#### notifications/{notificationId} - NEW
```typescript
{
  id: string
  userId: string  // recipient

  // Notification details
  type: 'proposal' | 'message' | 'payment' | 'review' | 'grievance' | 'system'
  title: string
  body: string
  actionUrl?: string  // deep link to relevant page

  // Related entities
  proposalId?: string
  messageId?: string
  reviewId?: string
  grievanceId?: string

  // Status
  read: boolean
  readAt?: timestamp

  // Timestamps
  createdAt: timestamp
}
```

#### notificationPreferences/{userId} - NEW
```typescript
{
  userId: string

  // Email preferences
  email: {
    proposals: boolean
    messages: boolean
    payments: boolean
    reviews: boolean
    grievances: boolean
    marketing: boolean
  }

  // In-app preferences
  inApp: {
    proposals: boolean
    messages: boolean
    payments: boolean
    reviews: boolean
    grievances: boolean
  }

  updatedAt: timestamp
}
```

### Pages
- [ ] `Notifications.tsx` - Notification center page
- [ ] `NotificationPreferences.tsx` - Notification settings

### Components
- [ ] `<NotificationBell />` - Bell icon with unread count
- [ ] `<NotificationCenter />` - Notification list
- [ ] `<NotificationItem />` - Individual notification
- [ ] `<NotificationPreferences />` - Settings form

### Firebase Functions
- [ ] `sendEmailNotification` - Send email via SendGrid/SES
- [ ] `createNotification` - Create in-app notification
- [ ] `markNotificationsRead` - Batch mark as read
- [ ] `cleanupOldNotifications` - Delete notifications older than X days

---

## Phase 15: Link-in Bio System 

### Overview
Public link-in bio page that influencers can share on social media. Allows brands to discover and contact influencers directly. Contact can be restricted to verified brands only or open to all signed-in users. Special signup flow for brands from link-in bio (auto-assigned promoter role, optional profile skip).

### Features
- [x] Public link-in bio page (`/link/:username`)
  - [x] Profile header with verification badge
  - [x] Working terms section (tick/cross icons + generic text)
  - [x] Pricing section (starting from, advance %, rate cards)
  - [x] "Send a Proposal" button (requires sign-in)
  - [x] "Start Chat" button (requires sign-in)
  - [x] Quick links section (custom links)
- [x] Link-in bio settings page (`/influencer/link-bio`)
  - [x] Live preview of public page
  - [x] Contact preference toggle (verified only vs anyone)
  - [x] Terms management (add/edit/delete/reorder with types)
  - [x] Pricing display settings
  - [x] Quick links management
- [x] Special signup flow from link-in bio (`/signup-from-link`)
  - [x] Auto-assign promoter/brand role
  - [x] Optional onboarding (can skip)
  - [x] `profileIncomplete` flag for skipped profiles
  - [x] Allow chat immediately without completion
  - [x] Block proposal sending until profile complete
- [x] Contact restrictions
  - [x] Verified brands only mode
  - [x] Anyone can message mode
  - [x] Unverified badge display for non-verified users
- [x] Unverified user prompts
  - [x] Banner in chat explaining benefits of verification
  - [x] 7-day data retention policy notice
  - [x] "Complete Signup & Verify" CTA
  - [ ] Scheduled cleanup of unverified user data (7+ days old or after work completion)

### Firestore Collections

#### users/{userId} - Updated fields
```typescript
{
  // ... existing fields

  // Link-in bio settings (influencer only)
  linkInBio?: {
    isEnabled: boolean
    contactPreference: 'verified_only' | 'anyone'
    showPricing: boolean
    terms: {
      id: string
      text: string
      type: 'allowed' | 'not_allowed' | 'generic'  // tick/cross/no icon
      order: number
    }[]
    quickLinks: {
      id: string
      title: string
      url: string
      icon: string
      order: number
    }[]
  }
}
```

#### linkInBioVisits/{visitId} - NEW (analytics)
```typescript
{
  id: string
  influencerId: string
  influencerUsername: string

  // Visitor info (if logged in)
  visitorId?: string
  visitorRole?: 'influencer' | 'promoter'
  isVerified?: boolean

  // Action taken
  action: 'view' | 'start_chat' | 'send_proposal' | 'click_link'
  linkId?: string  // if clicked a quick link

  timestamp: timestamp
}
```

### Firebase Functions
- [ ] `cleanupUnverifiedUserData` - Scheduled function (daily) to delete messages/chats for unverified users after 7 days of inactivity or work completion
- [x] `trackLinkInBioVisit` - Analytics for link-in bio page visits (basic implementation)
- [x] `checkContactPermission` - Verify if user can contact influencer based on settings (client-side check)
- [x] `createPromoterFromLinkBio` - Auto-create promoter profile from link-in bio signup flow (client-side)

### Pages
- [x] `LinkInBio.tsx` - Public link-in bio page
- [x] `LinkInBioChat.tsx` - Dedicated chat page (no layout)
- [x] `LinkInBioProposal.tsx` - Dedicated proposal page (no layout)
- [x] `SignupFromLink.tsx` - Streamlined signup for link-in bio visitors
- [x] `incomplete-profile` - Root route for incomplete profile handling
- [x] `verification` - Root route for promoter verification
- [x] `influencer/LinkInBioSettings.tsx` - Settings page for link-in bio

### Components
- [x] `<LinkInBioHeader />` - Profile header section (integrated in LinkInBio.tsx)
- [x] `<TermsSection />` - Working terms display (tick/cross/generic) (integrated in LinkInBio.tsx)
- [x] `<PricingSection />` - Pricing display (integrated in LinkInBio.tsx)
- [x] `<QuickLinksSection />` - Custom links (integrated in LinkInBio.tsx)
- [x] `<UnverifiedBanner />` - Warning banner for unverified users
- [x] `<LinkInBioPreview />` - Live preview in settings (integrated in LinkInBioSettings.tsx)
- [x] `<SignupFromLinkForm />` - Streamlined signup form (integrated in SignupFromLink.tsx)
- [x] `<LinkInBioChatWindow />` - Chat window for link-in bio flow

### Routing
- [x] Public route: `/link/:username` - No auth required
- [x] Dedicated chat: `/link/:username/chat` - Auth required, verification check
- [x] Dedicated proposal: `/link/:username/proposal` - Auth required, profile complete check
- [x] Auth redirect route: `/signup-from-link` - After OAuth from link-in bio
- [x] Protected route: `/influencer/link-bio` - Influencer only
- [x] Root route: `/incomplete-profile` - For profile incomplete handling
- [x] Root route: `/verification` - For promoter verification

### Auth Flow Updates
- [x] Link-in bio redirect tracking using query parameters (not sessionStorage):
  - Pass redirect info as query params: `?redirect=...&action=...&username=...`
  - Check after OAuth: if coming from link-in bio → `/signup-from-link`
  - Otherwise → `/role-selection` or dashboard
- [x] Profile incomplete handling:
  - Allow dashboard/chat access with `profileIncomplete: true`
  - Block proposal creation → redirect to `/incomplete-profile`
  - Show banner: "Complete your profile to send proposals"
- [x] Verification flow differentiation:
  - Link-in-bio flow: Show influencer-specific verification message
  - Dashboard flow: Show generic verification message
  - Clear verification context when reaching dashboard

---

## Phase 16: Polish & Optimization 

### UI/UX
- [ ] Loading states and skeletons
- [ ] Error handling and edge cases
- [ ] Empty states (no proposals, no messages, etc.)
- [ ] Success confirmations
- [ ] Toast notifications
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Dark mode support

### Performance
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Firebase query optimization
- [ ] Index optimization for Firestore
- [ ] Caching strategy
- [ ] Bundle size optimization

### Security
- [ ] Firebase security rules review
- [ ] Input validation
- [ ] File size limits (images: 5MB, PDFs: 10MB)
- [ ] XSS prevention
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Content Security Policy

### Analytics
- [ ] Event tracking setup
- [ ] Funnel analysis
- [ ] User behavior tracking
- [ ] A/B testing framework

---

# FIRESTORE SCHEMA REFERENCE

## users/{userId}
```typescript
{
  uid: string
  email: string
  role: 'influencer' | 'promoter' | 'admin'
  roles: string[]  // e.g., ['influencer', 'admin']
  createdAt: timestamp
  profileComplete: boolean

  // Influencer specific
  influencerProfile?: {
    displayName: string
    username: string
    bio: string
    categories: string[]
    socialMediaLinks: SocialMediaLink[]
    profileImage: string
    mediaKit?: string
    pricing: {
      advancePercentage: number  // 0-50%
      rates: { type: string; price: number }[]
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
    brands?: string[]  // For agencies
  }

  // Verification badges
  verificationBadges: {
    verified: boolean      // Auto after first completed project
    trusted: boolean       // Admin-assigned
  }
  trustedAt?: timestamp
  trustedBy?: string

  // Ban status
  isBanned: boolean
  banReason?: string
  bannedAt?: timestamp
  bannedBy?: string

  // Ratings
  avgRating: number
  totalReviews: number

  // Promoter Pass
  hasActivePromoterPass: boolean
  promoterPassExpiresAt?: timestamp
}
```

## proposals/{proposalId}
```typescript
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
  completionPercentage: number

  attachments: {
    name: string
    url: string
    type: string
    uploadedBy: string
    uploadedAt: timestamp
  }[]
  deadline?: timestamp

  // Workflow flags
  influencerAcceptedTerms?: boolean  // Influencer agreed to finalized proposal terms
  influencerSubmittedWork?: boolean  // Influencer completed the work
  brandApprovedWork?: boolean         // Brand approved the completed work

  // Proof of work
  proofOfWork?: {
    liveUrl: string
    tagsConfirmed: boolean
    submittedAt: timestamp
  }

  // Payment fees
  fees?: {
    platformFeeInfluencer: number  // ₹49
    platformFeePromoter?: number  // ₹49 (or ₹39 via credits) - optional unless escrow
    escrowFee?: number  // ₹149/₹349/10%
    escrowFeeSplit?: {
      influencer: number
      promoter: number
    }
    gstAmount?: number  // 18% on all fees charged (platform fees + escrow fee)
    totalPlatformFee: number
    paidBy: {
      influencer: boolean
      promoter: boolean
    }
    paidUsingCredits?: {
      promoter: boolean
      creditsUsed?: number
      discountApplied?: number
    }
    tdsAmount?: number  // 1% u/s 194-O (escrow cash only)
  }
}
```

## messages/{messageId}
```typescript
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
```

---

# KEY FILES REFERENCE

### Configuration
- [`.env`](../.env) - Firebase environment variables

### Core
- [`src/lib/firebase.ts`](../src/lib/firebase.ts) - Firebase initialization
- [`src/types/index.ts`](../src/types/index.ts) - TypeScript types
- [`src/App.tsx`](../src/App.tsx) - Root routing

### State
- [`src/stores/authStore.ts`](../src/stores/authStore.ts) - Auth state management
- [`src/stores/uiStore.ts`](../src/stores/uiStore.ts) - UI state management

### Hooks
- [`src/hooks/useAuth.ts`](../src/hooks/useAuth.ts) - Auth utilities

### Pages - Public
- [`src/pages/Landing.tsx`](../src/pages/Landing.tsx) - Home page
- [`src/pages/Login.tsx`](../src/pages/Login.tsx) - Sign in
- [`src/pages/RoleSelection.tsx`](../src/pages/RoleSelection.tsx) - Choose role
- [`src/pages/InfluencerSignup.tsx`](../src/pages/InfluencerSignup.tsx) - Influencer signup
- [`src/pages/PromoterSignup.tsx`](../src/pages/PromoterSignup.tsx) - Promoter signup

### Layouts
- [`src/components/layout/InfluencerLayout.tsx`](../src/components/layout/InfluencerLayout.tsx)
- [`src/components/layout/PromoterLayout.tsx`](../src/components/layout/PromoterLayout.tsx)

---

# NEXT STEPS

### Immediate Priority (Phase 8)
1. Build Record-Only deal creation form
2. Implement mandatory record-keeping for all deals
3. Generate PDF invoices
4. Build barter valuation ledger
5. Create tax documentation

### This Quarter
- [ ] Phase 9: Promoter Pass & Verification
- [ ] Phase 10: Payment System - Escrow
- [ ] Phase 11: Grievance Portal

---

# KNOWN ISSUES

None currently tracked.

---

# RECENT CHANGES

### 2026-01-04
- **Phase 15: Link-in Bio System - COMPLETE**
  - Public link-in bio page (`/link/:username`) with profile header, working terms, pricing, and quick links
  - Link-in bio settings page (`/influencer/link-bio`) with live preview
  - Contact preference toggle (verified only vs anyone)
  - Terms management (add/edit/delete/reorder with tick/cross/generic types)
  - Special signup flow from link-in bio (`/signup-from-link`) with auto-assign promoter role
  - Optional profile skip with `profileIncomplete` flag
  - Allow chat immediately, block proposals until profile complete
  - Dedicated chat and proposal pages (`/link/:username/chat` and `/link/:username/proposal`)
  - Root routes for incomplete profile (`/incomplete-profile`) and verification (`/verification`)
  - Query parameter-based redirect tracking (not sessionStorage to avoid persistence issues)
  - Verification flow differentiation (link-in-bio vs dashboard messages)
  - View Proposals button when promoter has existing proposals with influencer
  - Info bar above chat input directing users to proposal chat when proposals exist
  - `useInfluencerProposals` hook for checking existing proposals
  - Unverified user prompts with verification benefits explanation

### 2025-12-31
- **Updated Project Scope**
  - New vision: "The operating system for influencer marketing"
  - Phase structure reorganized (completed + pending)
  - Added Agent/Manager as user type
  - New pricing model: Record-Only (₹49/deal per side, with `originalPrice` + `price` for crossed-price display), Nano (149), Micro (₹349), Pro (10%)
  - Promoter Verification Credits (₹1,000 non-refundable credits with 20% discount for paying ₹49 fees via credits)
  - TDS (1% u/s 194-O) and Barter (Section 194R) compliance
  - Grievance portal for disputes
  - Year-end tax summary for ITR filing

### 2025-12-29
- **Phase 12: Admin System - COMPLETE**
  - Admin dashboard with platform stats
  - Influencer management page (search, ban/unban, trusted badge)
  - Promoter management page (search, ban/unban, trusted badge)
  - User impersonation with view-only mode
  - Firestore write-blocking during impersonation
  - Admin activity logging with email tracking
  - Admin layout with sidebar navigation

### 2025-12-27
- Made logo clickable in dashboard layouts (links to home page)
- Updated both InfluencerLayout and PromoterLayout

### Previous Session
- Fixed login redirect logic (users with complete profiles go to dashboard)
- Updated landing page header (shows Dashboard button when logged in)
- Recreated Firestore in supported location for free Storage
- Fixed Google OAuth popup implementation
