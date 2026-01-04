# Link-in-Bio Feature Documentation

## Overview

The link-in-bio feature allows influencers to create a public profile page that brands can visit to initiate collaborations. It includes a streamlined signup flow for unauthenticated users and handles verification requirements for promoters.

## Flow Diagrams

### 1. Unauthenticated User Flow

```
User visits link-in-bio page
        ↓
Clicks "Start Chat" or "Send Proposal"
        ↓
Redirects to /login
        ↓
Stores intent in sessionStorage (redirectAfterAuth)
        ↓
After login/signup → Redirects to /signup-from-link
        ↓
User enters brand name and clicks "Continue to Chat"
        ↓
Creates minimal promoter profile with allowedInfluencerIds
        ↓
Redirects to /promoter/messages/{influencerId}
```

### 2. Authenticated Promoter with Complete Profile

```
User visits link-in-bio page
        ↓
Clicks "Start Chat" or "Send Proposal"
        ↓
Checks: influencer requires verification?
        ↓
    YES → User verified?
              YES → Navigate to messages/browse
              NO  → Redirect to /promoter/verification
    NO  → Navigate to messages/browse directly
```

### 3. Authenticated Promoter with Incomplete Profile

```
User visits link-in-bio page
        ↓
Clicks "Start Chat" or "Send Proposal"
        ↓
Stores verificationIntent in sessionStorage:
{
  required: influencer.requiresVerification,
  influencerId: string,
  influencerName: string
}
        ↓
Redirects to /promoter/incomplete-profile
        ↓
Shows two sections:
1. Complete Profile (always shown)
2. Verify Account (shown if required=true)
        ↓
User completes profile → Auto-redirects to verification (if required)
        ↓
User verifies → Redirects back to link-in-bio
        ↓
Automatically navigates to messages
```

## Key Components

### 1. LinkInBio Page (`/link/:username`)

**Purpose**: Public profile page for influencers

**Features**:
- Display influencer profile, social links, collaboration terms
- "Start Chat" and "Send Proposal" buttons
- Checks authentication and verification status
- Redirects based on user state

**Key Logic**:
```typescript
// Stores verification intent when redirecting incomplete profiles
sessionStorage.setItem('verificationIntent', JSON.stringify({
  required: influencer.requiresVerification,
  influencerId: influencer.uid,
  influencerName: influencer.displayName
}));
```

### 2. SignupFromLink Page (`/signup-from-link`)

**Purpose**: Streamlined signup for users coming from link-in-bio

**Features**:
- Single input for brand name
- Two buttons:
  - "Continue to Chat" - Creates minimal profile and goes directly to chat
  - "Complete Profile First" - Goes to full signup flow

**Key Logic**:
```typescript
// Adds influencer to allowed list
const newAllowedIds = [...existingAllowed, redirectInfo.influencerId];
await setDoc(doc(db, 'users', user.uid), {
  allowedInfluencerIds: newAllowedIds,
  promoterProfile: { name: formData.name, ...minimalFields }
});
```

### 3. IncompleteProfile Page (`/promoter/incomplete-profile`)

**Purpose**: Intermediate page for users with incomplete profiles

**Features**:
- Reads verification intent from sessionStorage (persists across navigation)
- Shows profile completion section (always)
- Shows verification section (if required)
- Buttons to navigate to profile edit or verification

**Key Logic**:
```typescript
// Reads from both URL params and sessionStorage
useEffect(() => {
  const urlVerification = searchParams.get('verification') === 'required';
  const storedIntent = sessionStorage.getItem('verificationIntent');

  if (urlVerification) {
    // Update sessionStorage from URL params
    sessionStorage.setItem('verificationIntent', JSON.stringify(intent));
  } else if (storedIntent) {
    // Use stored intent
    setVerificationIntent(JSON.parse(storedIntent));
  }
}, [searchParams]);
```

### 4. Verification Page (`/promoter/verification`)

**Purpose**: Promoter verification flow

**Features**:
- Accepts context params (browse, link_in_bio)
- Shows influencer-specific messaging when coming from link-in-bio
- Clears verificationIntent after successful verification
- Returns to link-in-bio after verification (link_in_bio context)

### 5. Profile Page (`/promoter/profile`)

**Features**:
- Supports `?edit=true` query param to start in edit mode
- Auto-redirects to verification after completing profile if verification was required
- Clears verificationIntent if profile complete but no verification needed

**Key Logic**:
```typescript
// After saving profile
const verificationIntent = sessionStorage.getItem('verificationIntent');
if (verificationIntent && isProfileComplete) {
  const intent = JSON.parse(verificationIntent);
  if (intent.required && !user.isPromoterVerified) {
    // Redirect to verification
    navigate(`/promoter/verification?...`);
  }
  sessionStorage.removeItem('verificationIntent');
}
```

## Data Structures

### User Type Extensions

```typescript
interface User {
  // ... existing fields
  allowedInfluencerIds?: string[];  // Influencers unverified promoter can contact
}
```

### Verification Intent (sessionStorage)

```typescript
interface VerificationIntent {
  required: boolean;           // Whether verification is needed
  influencerId?: string;       // The influencer's ID
  influencerName?: string;     // For display in UI
}
```

### Redirect After Auth (sessionStorage)

```typescript
interface RedirectAfterAuth {
  path: string;                // The link-in-bio URL
  action: 'start_chat' | 'send_proposal';
  influencerId: string;
  influencerName: string;
}
```

## Route Changes

### New Routes

| Route | Purpose |
|-------|---------|
| `/link/:username` | Public link-in-bio page |
| `/signup-from-link` | Streamlined signup |
| `/promoter/incomplete-profile` | Profile completion & verification gateway |
| `/promoter/verification` | Dedicated verification page |

### Updated Routes

| Route | Changes |
|-------|---------|
| `/promoter/profile` | Supports `?edit=true` param |
| `/promoter/messages/:influencerId` | Supports direct conversations (no proposal) |

## Key Decisions

### 1. Session Storage for Persistence

**Decision**: Use `sessionStorage` instead of `localStorage`

**Rationale**:
- Persists across tab navigations but clears on browser close
- More appropriate for temporary intent tracking
- Users returning later start fresh (appropriate for verification intent)

### 2. allowedInfluencerIds Field

**Decision**: Add `allowedInfluencerIds` array to User type

**Rationale**:
- Allows unverified promoters to chat with specific influencers
- Influencer is added to this list when user comes from their link-in-bio
- Bypasses verification requirement for those specific influencers
- Verified promoters don't need this field

### 3. Incomplete Profile as Intermediate Route

**Decision**: Create dedicated `/promoter/incomplete-profile` route

**Rationale**:
- Shows both profile completion and verification requirements in one place
- Persists verification intent across navigation
- Clear user journey: complete profile → verify → access

### 4. Direct Conversations

**Decision**: Support conversations without proposals

**Rationale**:
- Link-in-bio users may want to chat before sending formal proposals
- Uses `useDirectConversation` hook to create proposal-less conversations
- Shows as "Direct Chat" tab in chat interface

## Edge Cases Handled

1. **User navigates away from incomplete-profile**: Verification intent persists in sessionStorage
2. **User already verified**: Bypasses verification section completely
3. **User has allowedInfluencerIds**: Can chat with those specific influencers without verification
4. **Profile completion without verification needed**: Clears intent and stays on profile
5. **Verification from browse context**: Different messaging than link-in-bio context

## Future Enhancements

1. **Payment Integration**: Replace dev skip button with Razorpay integration
2. **Verification Badge**: Show verified status on promoter profiles
3. **Verification History**: Track when verification was completed
4. **Refund Flow**: Handle verification deposit refunds
