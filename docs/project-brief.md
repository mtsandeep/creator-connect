# Influencer Marketplace - Project Brief

## What is this platform?

A **marketplace platform** that connects **influencers** with **promoters** (brands and marketing agencies) for promotional collaborations.

---

## The Problem It Solves

**For Influencers:**
- Difficult to find legitimate brand collaboration opportunities
- Hard to showcase portfolio and pricing professionally
- Payment security concerns when working with new brands
- Need a centralized place to manage multiple proposals

**For Promoters (Brands/Agencies):**
- Time-consuming to find and vet influencers
- No standardized way to discuss proposals
- Payment escrow needed for security
- Need to track multiple campaigns efficiently

---

## Core Value Proposition

| For Influencers | For Promoters |
|-----------------|---------------|
| Showcase profile with social media stats | Discover influencers with advanced filters |
| Set your own advance % (up to 50%) | Discuss pricing privately (not public) |
| Secure escrow payments | Pay to platform escrow, release after approval |
| Get verified badge after 1st project | Save favorites, manage proposals |
| Chat directly with promoters | Manage multiple brands (agency mode) |

---

## Key Features Overview

### 1. User Accounts & Profiles

**Influencers can:**
- Sign up with Google (no password)
- Create public profile with:
  - Display name, bio, profile picture
  - Social media links (Instagram, YouTube, TikTok) with follower counts
  - Categories/niche (fashion, tech, lifestyle, etc.)
  - Languages, location
  - Media kit PDF upload
- Set advance percentage (0-50%)
- Get "Verified" badge after first completed project

**Promoters can:**
- Sign up with Google (no password)
- Choose type:
  - **Individual**: Single brand/creator
  - **Agency**: Manage multiple brands under one account
- Create profile with company details, logo, description

### 2. Discover & Browse

Promoters can search influencers with filters:
- Follower count range
- Category/niche
- Minimum rating (4+ stars)
- Location
- Languages
- Verified badge status

**Important**: Pricing is NOT shown anywhere publicly. It's discussed only in private chat.

### 3. Proposals & Chat

**Proposal Workflow:**
1. Promoter finds influencer → clicks "Start Discussion"
2. Creates initial proposal with requirements, deliverables, deadline
3. Both parties chat in real-time to:
   - Discuss pricing (privately)
   - Share files/screenshots
   - Clarify requirements
4. Once agreed, proposal is "finalized"

**Chat Features:**
- Real-time messaging
- Send images (screenshots, references)
- Send files (PDFs, docs)
- Read receipts
- Message timestamps

### 4. Payment Flow (Escrow System)

```
Step 1: Proposal finalized → Promoter pays full amount to platform (escrow)
Step 2: Advance released to influencer (their configured %, max 50%)
Step 3: Influencer completes work → Submits deliverables
Step 4: Promoter reviews & approves work
Step 5: Remaining amount released to influencer
```

**Key Points:**
- Platform fee: **0%** (influencer gets full amount, minus Razorpay ~2%)
- Secure escrow via Razorpay
- Promoter approves work before final payment
- Dispute handling via support contact (manual)

### 5. Ratings & Reviews

- Both parties can review after project completion
- 1-5 star rating
- Optional written review
- Reviews displayed on public profiles
- Average rating calculated automatically

### 6. Dashboards

**Influencer Dashboard:**
- Active proposals list
- Payment status overview
- Earnings summary
- Unread messages count

**Promoter Dashboard:**
- Active proposals
- Payment tracking
- Spend analytics
- Saved influencers
- Brand switcher (for agencies)

---

## Business Rules Summary

| Rule | Details |
|------|---------|
| Platform Fee | 0% - platform doesn't charge commission |
| Advance % | Configurable by influencer, maximum 50% |
| Verification | Auto badge after 1st completed project |
| Disputes | Manual - contact support via form |
| Payments | Simple: advance + final (no milestones) |
| Notifications | Email for key actions |
| Mobile | Responsive web (no native app) |
| Auth | Google OAuth only (no email/password) |
| Pricing | NOT public - discussed in chat only |

---

## User Types

### Influencer
- Content creators with social media presence
- Want to monetize through brand collaborations
- Create profile, showcase portfolio, set pricing terms

### Promoter - Individual
- Single brand or business owner
- Works with their own brand only
- Simpler profile setup

### Promoter - Agency
- Marketing agency managing multiple brands
- Can switch between brands
- Can add/remove brands from their account
- All proposals tracked per brand

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Backend | Firebase (Auth, Firestore, Storage, Functions) |
| Payments | Razorpay |
| Real-time | Firestore listeners |
| Forms | Zod validation |

---

## Security & Privacy

- Google OAuth for authentication (no passwords stored)
- Firebase Security Rules for data access control
- Users can only access their own data
- Chat messages only visible to proposal participants
- Proposal access restricted to involved parties
- File size limits (images: 5MB, PDFs: 10MB)
- XSS prevention on all inputs

---

## Platform Limitations (Current Version)

| Feature | Status |
|---------|--------|
| Milestone payments | Not supported (advance + final only) |
| Dispute resolution | Manual via support (no automated system) |
| Social media verification | Not implemented (trust-based badge) |
| Push notifications | Email only (no in-app push) |
| Mobile app | Responsive web only |
| Multiple payment gateways | Razorpay only |

---

## Future Enhancements (Potential)

- Social media API integration for follower verification
- Milestone-based payments for large projects
- In-app push notifications
- Mobile apps (iOS/Android)
- Additional payment gateways
- Analytics dashboard for both user types
- Automated dispute resolution system

---

## Target Market

**Primary:** India (via Razorpay integration)
**Secondary:** Global expansion potential with additional payment gateways

---

## Success Metrics

- Active influencer registrations
- Active promoter registrations
- Proposals created
- Proposals successfully completed
- Payment volume processed
- User retention rate
- Average rating across platform
