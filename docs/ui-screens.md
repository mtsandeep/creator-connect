# UI Screens - Influencer Marketplace

## Screen Overview

This document lists all screens needed for the influencer marketplace platform, organized by user flow.

---

## 1. Authentication Screens

### 1.1 Landing Page (`/`)
**Purpose**: Welcome page, explain the platform, get users to sign up

**Elements:**
- Hero section with value proposition
- "How it works" section (3 steps)
- Features list
- CTA buttons: "Sign up as Influencer" / "Sign up as Promoter"
- Footer with links

---

### 1.2 Login/Signup (`/login`)
**Purpose**: Google OAuth authentication (single page for both)

**Elements:**
- Platform logo/name
- Heading: "Join the Influencer Marketplace"
- Google Sign-In button (large, prominent)
- Brief text: "Sign in with your Google account to continue"
- Terms of service & privacy links
- Simple, clean design

---

### 1.3 Role Selection (`/select-role`)
**Purpose**: First-time users select their role (shown after Google auth)

**Elements:**
- Heading: "How do you want to use this platform?"
- Two large cards side by side:
  - **Influencer Card**: Icon, title, description, "I'm an Influencer" button
  - **Promoter Card**: Icon, title, description, "I'm a Promoter" button
- Promoter type selection (if promoter selected):
  - Radio buttons: Individual / Agency
- "Continue" button

---

## 2. Onboarding Screens

### 2.1 Influencer Profile Setup (`/influencer/setup`)
**Purpose**: Complete profile before accessing platform

**Elements:**
- Progress indicator (step X of Y)
- Form sections:
  1. **Basic Info**
     - Display name (input)
     - Bio (textarea)
     - Profile picture upload (drag-drop area)
  2. **Social Media Links**
     - Add social platform (dropdown: Instagram, YouTube, TikTok)
     - Profile URL (input)
     - Follower count (number input)
     - "Add another platform" button
     - List of added platforms (with delete option)
  3. **Categories** (multi-select chips)
     - Fashion, Tech, Lifestyle, Beauty, Food, Travel, Fitness, Gaming, etc.
  4. **Pricing**
     - Starting from price (number input, INR)
     - Advance percentage slider (0-50%)
     - Rate cards (optional): Add rates for post type (Story, Post, Reel, Video)
  5. **Additional Info**
     - Location (input)
     - Languages (multi-select: English, Hindi, Tamil, etc.)
     - Media kit PDF upload (optional)
- "Complete Setup" button
- "Skip for now" link

---

### 2.2 Promoter Profile Setup (`/promoter/setup`)
**Purpose**: Complete promoter profile

**Elements:**
- Progress indicator
- Form sections:
  1. **Basic Info**
     - Name/Company name (input)
     - Logo upload (drag-drop)
     - Description (textarea)
  2. **Type-Specific**
     - If Individual:
       - Brand name (input)
       - Industry (dropdown)
       - Website (input)
       - Location (input)
     - If Agency:
       - Agency name (input)
       - Industries served (multi-select)
       - Website (input)
       - Location (input)
       - Add brands section:
         - Brand name (input)
         - Brand logo (upload)
         - "Add Brand" button
         - List of added brands
- "Complete Setup" button

---

## 3. Influencer Screens

### 3.1 Influencer Dashboard (`/influencer/dashboard`)
**Purpose**: Overview of all influencer activities

**Layout:**
- Sidebar navigation
- Main content area

**Sidebar Elements:**
- User avatar + name
- Nav items: Dashboard, Proposals, Messages, Earnings, Profile, Settings
- Logout button

**Main Content:**
- **Stats Cards Row** (4 cards):
  - Active Proposals (count)
  - Completed Projects (count)
  - Total Earnings (₹ amount)
  - Average Rating (stars)
- **Active Proposals Section**
  - List of proposal cards (proposal title, promoter name, status badge, last message)
  - "View All Proposals" link
- **Recent Messages Section**
  - List of recent chats (promoter name, proposal title, message preview, timestamp)
- **Notifications/Updates**
  - Payment received alerts
  - New proposal alerts

---

### 3.2 Influencer Profile - Edit (`/influencer/profile/edit`)
**Purpose**: Edit own profile

**Elements:**
- Breadcrumb: Dashboard > Profile
- Profile preview card (how it looks to others)
- Edit form (same sections as setup, pre-filled)
- Tabs: Basic, Social, Pricing, Additional
- Save button
- "View Public Profile" link

---

### 3.3 Influencer Profile - Public (`/influencer/:id`)
**Purpose**: Public profile viewed by promoters

**Elements:**
- **Header Section**
  - Profile image (large)
  - Display name + verified badge (if applicable)
  - Rating (stars) + review count
  - Location, languages
  - "Start Discussion" button (for promoters)
- **About Section**
  - Bio
  - Categories (chips)
- **Stats Section**
  - Total followers across platforms
  - Completed projects count
  - Average response time
- **Social Media Links**
  - Platform icons + follower counts
  - Links to profiles
- **Portfolio/Media Kit**
  - Media kit download button (if uploaded)
  - Portfolio images grid
- **Reviews Section**
  - Average rating large display
  - Review cards (promoter name, rating, comment, date)
  - "View All Reviews" link

---

### 3.4 Proposals List (`/influencer/proposals`)
**Purpose**: List all proposals for influencer

**Elements:**
- Page heading: "My Proposals"
- Filter tabs: All, Active, Completed, Cancelled
- Search input
- Proposal cards list:
  - Promoter name + logo
  - Proposal title
  - Status badge (discussing, finalized, in_progress, completed)
  - Proposed amount
  - Last message preview
  - Timestamp
- Empty state (no proposals)

---

### 3.5 Proposal Detail (`/influencer/proposal/:id`)
**Purpose**: View proposal details, chat, take actions

**Layout:** Two columns (on desktop)

**Left Column - Proposal Info:**
- Promoter info (name, logo, avg rating)
- Status badge
- Proposal title
- Description
- Requirements
- Deliverables list
- Budget breakdown (advance, remaining)
- Deadline (if set)
- Attachments list (downloadable)
- Action buttons (Accept/Decline if pending, Submit Work if in_progress)

**Right Column - Chat:**
- Chat messages area
- Message input
- File attachment button
- Image upload button
- Send button

---

## 4. Promoter Screens

### 4.1 Browse Influencers (`/browse`)
**Purpose**: Search and discover influencers

**Layout:**
- Top bar with search
- Left sidebar filters
- Main grid of influencer cards

**Top Bar:**
- Search input (by name)
- View toggle (grid/list)
- Sort dropdown (recommended, rating, followers)

**Filter Sidebar:**
- Follower count range (slider or min-max inputs)
- Categories (checkboxes)
- Minimum rating (checkbox: 4+, 3+)
- Location dropdown
- Languages (checkboxes)
- Verified only (checkbox)
- "Apply Filters" button
- "Clear Filters" button
- Saved influencers count

**Influencer Grid:**
- Influencer cards:
  - Profile image
  - Display name + verified badge
  - Categories (chips)
  - Follower count
  - Rating (stars)
  - Location
  - "View Profile" button
  - Heart icon (save to favorites)
  - "Start Discussion" button
- Pagination or "Load More"

---

### 4.2 Promoter Dashboard (`/promoter/dashboard`)
**Purpose**: Overview for promoters

**Layout:**
- Sidebar navigation
- Main content area

**Sidebar Elements:**
- User avatar + name
- If agency: Brand switcher dropdown
- Nav items: Dashboard, Browse, Proposals, Messages, Saved, Profile, Settings
- Logout button

**Main Content:**
- **Stats Cards Row**:
  - Active Proposals
  - Completed Projects
  - Total Spent (₹ amount)
  - Saved Influencers
- **Active Proposals Section**
  - Proposal cards list
- **Recent Discussions**
  - Chat previews
- **Quick Actions**
  - "Browse Influencers" button
  - "Saved Influencers" link

---

### 4.3 Promoter Profile (`/promoter/profile`)
**Purpose**: Edit promoter profile

**Elements:**
- Similar to influencer profile edit
- If agency: Brand management section (add/edit/remove brands)

---

### 4.4 Saved Influencers (`/promoter/saved`)
**Purpose:** View saved/favorite influencers

**Elements:**
- Page heading: "Saved Influencers"
- Grid of saved influencer cards (same as browse)
- "Remove from saved" on each card
- Empty state if none saved

---

### 4.5 Proposals List (`/promoter/proposals`)
**Purpose:** View all proposals

**Elements:**
- Filter tabs: All, Active, Completed, Cancelled
- Proposal cards:
  - Influencer name + image
  - Proposal title
  - Status badge
  - Amount
  - Last message
- "Create New Proposal" button (when on influencer profile)

---

### 4.6 Proposal Detail (`/promoter/proposal/:id`)
**Purpose:** View proposal, chat, make payments

**Layout:** Similar to influencer view but with payment actions

**Left Column - Proposal Info:**
- Influencer info
- Status
- All proposal details
- Payment status section:
  - Advance paid (yes/no + amount)
  - Remaining amount
  - Payment button (if not paid)
- Approve work button (if work submitted)

---

### 4.7 Payment Page (`/proposal/:id/payment`)
**Purpose:** Make payment for proposal

**Elements:**
- Back button
- Heading: "Complete Payment"
- Payment summary card:
  - Proposal title
  - Influencer name
  - Total amount
  - Advance amount (X%)
  - Remaining amount
- Payment method: Razorpay
- "Pay ₹X,XXX" button
- Terms checkbox
- Secure payment badge

---

## 5. Chat Screens

### 5.1 Chat List (`/messages`)
**Purpose:** View all conversations

**Elements:**
- Page heading: "Messages"
- Search messages
- Chat list:
  - Each item:
    - Other person's avatar + name
    - Proposal title
    - Last message preview
    - Timestamp
    - Unread badge
- Empty state (no messages)

---

### 5.2 Chat Detail (`/messages/:proposalId`)
**Purpose:** Real-time messaging for a proposal

**Elements:**
- Header: Other person info + proposal title
- Messages area (scrollable)
  - Message bubbles (left for received, right for sent)
  - Timestamps
  - Read receipts
  - Image attachments (thumbnail)
  - File attachments (name + download icon)
- Message input area:
  - Text input
  - Attachment paperclip button
  - Image upload button
  - Send button
- Link to proposal detail

---

## 6. Common Screens

### 6.1 Settings (`/settings`)
**Purpose:** Account settings

**Elements:**
- Tabs: Account, Notifications, Privacy, Billing

**Account Tab:**
- Email (read-only, from Google)
- Name (editable)
- Profile picture (change)
- Delete account button

**Notifications Tab:**
- Email notifications toggles:
  - New messages
  - New proposals
  - Payment received
  - Project updates

**Privacy Tab:**
- Profile visibility toggle
- Show/hide stats

---

### 6.2 Support/Contact (`/support`)
**Purpose:** Contact platform support

**Elements:**
- Heading: "Need Help?"
- Support options:
  - Report an issue
  - Dispute a project
  - General inquiry
- Form:
  - Subject (dropdown)
  - Proposal ID (if applicable)
  - Message (textarea)
  - Attach file upload
- Submit button
- Support email display

---

### 6.3 Not Found (404)
**Purpose:** Page not found error

**Elements:**
- 404 large text
- "Page not found" message
- "Go to Dashboard" button

---

### 6.4 Error Page
**Purpose:** Generic error display

**Elements:**
- Error illustration
- "Something went wrong" message
- Error details (if dev mode)
- "Go back" / "Refresh" buttons

---

## Screen Priority for Mocks

### Phase 1 - Core User Flows (High Priority)
1. Landing Page
2. Login/Signup
3. Role Selection
4. Influencer Dashboard
5. Promoter Dashboard
6. Browse Influencers
7. Influencer Profile (Public)
8. Chat Detail

### Phase 2 - Essential Actions (Medium Priority)
9. Influencer Profile Setup
10. Promoter Profile Setup
11. Proposal Detail (both views)
12. Payment Page
13. Chat List
14. Settings

### Phase 3 - Supporting Screens (Low Priority)
15. Saved Influencers
16. Proposals List
17. Support/Contact
18. Not Found / Error Pages

---

## Design Tokens

### Colors (Electric Blue & Lime Theme)
- **Primary**: `#00D9FF` (Electric Cyan) - innovation, energy
- **Secondary**: `#B8FF00` (Lime) - freshness, growth
- **Accent**: `#FF00E6` (Magenta) - bold, creative highlights
- **Success**: `#00FF94` (Bright Mint Green)
- **Warning**: `#FFC700` (Gold/Yellow)
- **Error**: `#FF3366` (Hot Pink/Red)
- **Background**: `#ffffff`
- **Surface**: `#F0FDFD` (Light Cyan tint)
- **Text Primary**: `#0F172A` (Slate-900)
- **Text Secondary**: `#64748B` (Slate-500)

### Custom Tailwind Config (add to tailwind.config.js)
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#E6FAFF',
        100: '#B3F5FF',
        200: '#80EFFf',
        300: '#4DE9FF',
        400: '#1AE3FF',
        500: '#00D9FF', // Primary
        600: '#00A8CC',
        700: '#007799',
        800: '#004666',
        900: '#001533',
      },
      secondary: {
        50: '#F5FFE6',
        100: '#EAFFCC',
        200: '#DFFFB3',
        300: '#D4FF99',
        400: '#CAFF80',
        500: '#B8FF00', // Secondary (Lime)
        600: '#93CC00',
        700: '#6E9900',
        800: '#496600',
        900: '#243300',
      },
      accent: {
        400: '#FF33EB',
        500: '#FF00E6', // Accent (Magenta)
        600: '#CC00B9',
      }
    }
  }
}
```

### Spacing
- Container max-width: `1280px`
- Section padding: `4rem` (64px)
- Card padding: `1.5rem` (24px)

### Border Radius
- Cards: `0.75rem` (12px)
- Buttons: `0.5rem` (8px)
- Inputs: `0.5rem` (8px)

### Shadows
- Sm: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- Md: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- Lg: `0 10px 15px -3px rgb(0 0 0 / 0.1)`
