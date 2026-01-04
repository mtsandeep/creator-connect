# Link-in-Bio Flow Simplification

## Overview

This document outlines the simplified routing and flow changes for the link-in-bio feature. The goal is to make the flow clearer by:

1. Moving incomplete-profile to a root route (no sidebar)
2. Creating dedicated chat/proposal routes under `/link/:username` that don't require promoter layout
3. Streamlining the signup and verification flows

## Current State Analysis

### Current Routes
- `/promoter/incomplete-profile` - Inside promoter layout with sidebar
- `/signup-from-link` - Creates basic promoter profile
- `/promoter/verification` - Verification page
- `/promoter/messages` - Full messages page with all conversations
- `/link/:username` - Public link-in-bio page

### Current Issues
1. `incomplete-profile` route is under `/promoter/*` which shows the sidebar even though user hasn't completed profile
2. Link-in-bio actions (chat/proposal) redirect through multiple promoter routes
3. Complex navigation between signup, incomplete-profile, and verification
4. `/signup-from-link` → `/promoter/profile?edit=true` → verification is confusing

## Proposed New Routes

```
/link/:username                    # Public link-in-bio page (existing)
/link/:username/chat               # NEW: Dedicated chat page (no layout/sidebar)
/link/:username/proposal           # NEW: Dedicated proposal page (no layout/sidebar)
/incomplete-profile                # NEW: Root route (no layout/sidebar)
/signup/promoter                   # Full promoter signup (existing)
/login                             # Login (existing)
/signup-from-link                  # Quick brand name signup (existing)
/verification                      # NEW: Root verification route (no layout/sidebar)

/promoter/*                        # Existing promoter routes (protected, with layout)
/promoter/messages                 # All conversations (existing)
/promoter/proposals                # All proposals (existing)
```

## Detailed Flow Changes

### Flow 1: Start Chat from Link-in-Bio

**User is NOT authenticated:**
```
/link/:username → [click "Start Chat"]
→ /login
→ /signup-from-link (asks for display name, creates brand account with profileComplete=false)
→ /link/:username/chat (new dedicated chat page)
```

**User IS authenticated but profile incomplete:**
```
/link/:username → [click "Start Chat"]
→ /incomplete-profile (root route, shows prompt to complete profile)
→ User can either:
  a) Click "Complete Profile" → /signup/promoter → /link/:username/chat
  b) Click "Continue to Chat" → /link/:username/chat directly
```

**User IS authenticated and profile complete:**
```
/link/:username → [click "Start Chat"]
→ /link/:username/chat (directly)
```

**If influencer requires verification only:**
```
/link/:username → [click "Start Chat"]
→ Check if user.isPromoterVerified
→ If NOT verified:
  → /verification (root route, not /promoter/verification)
  → After verification → /link/:username/chat
```

### Flow 2: Send Proposal from Link-in-Bio

**User is NOT authenticated:**
```
/link/:username → [click "Send Proposal"]
→ /login
→ /signup-from-link (creates brand account)
→ /link/:username/proposal (new dedicated proposal page)
```

**User IS authenticated but profile incomplete:**
```
/link/:username → [click "Send Proposal"]
→ /incomplete-profile
→ User must complete profile first (can't skip for proposals)
→ /signup/promoter
→ /link/:username/proposal
```

**User IS authenticated and profile complete:**
```
/link/:username → [click "Send Proposal"]
→ /link/:username/proposal (directly)
```

**If influencer requires verification only:**
```
/link/:username → [click "Send Proposal"]
→ Check if user.isPromoterVerified
→ If NOT verified:
  → /verification (root route)
  → After verification → /link/:username/proposal
```

## Implementation Tasks

### 1. Create New Page Components

#### [src/pages/LinkInBioChat.tsx](src/pages/LinkInBioChat.tsx) (NEW)
- Dedicated chat page for link-in-bio conversations
- No layout/sidebar wrapper (standalone page)
- Uses existing `ChatWindow` component
- Fetches influencer data from `:username` param
- Creates direct conversation using `getOrCreateDirectConversation`
- Checks `allowedInfluencerIds` or `isPromoterVerified` before allowing chat
- Shows "Back to Profile" button to return to `/link/:username`

Props/State needed:
- `username` from URL params
- Fetch influencer data by username
- Check if current user can chat (verified or in allowed list)
- If not allowed, show verification prompt

#### [src/pages/LinkInBioProposal.tsx](src/pages/LinkInBioProposal.tsx) (NEW)
- Dedicated proposal page for link-in-bio
- No layout/sidebar wrapper
- Uses existing `CreateProposalForm` component
- Fetches influencer data from `:username` param
- Pre-fills influencer info in the form
- On submit, creates proposal and navigates to `/promoter/proposals/:proposalId`
- Shows "Back to Profile" button to return to `/link/:username`

Props/State needed:
- `username` from URL params
- Fetch influencer data by username
- Check if user has complete profile before showing form
- If profile incomplete, redirect to `/incomplete-profile`

### 2. Move/Rename Existing Pages

#### [src/pages/IncompleteProfile.tsx](src/pages/IncompleteProfile.tsx) (MOVED)
- Move from `src/pages/promoter/IncompleteProfile.tsx`
- Keep the same UI but update navigation logic
- Add two options:
  1. "Complete Profile" → navigates to `/signup/promoter`
  2. "Continue to Chat" → navigates to `/link/:username/chat` (chat only, not proposals)
- Store the `:username` and action context in sessionStorage

#### [src/pages/Verification.tsx](src/pages/Verification.tsx) (MOVED)
- Move from `src/pages/promoter/Verification.tsx`
- Keep the same UI but update navigation logic
- On verification complete, redirect to appropriate page:
  - If context is `link_in_bio_chat` → `/link/:username/chat`
  - If context is `link_in_bio_proposal` → `/link/:username/proposal`
  - Otherwise → `/promoter/dashboard`

### 3. Update Routes in [src/App.tsx](src/App.tsx#L1-L476)

Add new routes (at the ROOT level, not inside promoter layout):

```tsx
// Link-in-Bio dedicated routes (no layout)
<Route
  path="/link/:username/chat"
  element={
    <LazyRoute>
      <LinkInBioChat />
    </LazyRoute>
  }
/>
<Route
  path="/link/:username/proposal"
  element={
    <LazyRoute>
      <LinkInBioProposal />
    </LazyRoute>
  }
/>

// Incomplete profile (root route, no layout)
<Route
  path="/incomplete-profile"
  element={
    <LazyRoute>
      <IncompleteProfile />
    </LazyRoute>
  }
/>

// Verification (root route, no layout)
<Route
  path="/verification"
  element={
    <LazyRoute>
      <Verification />
    </LazyRoute>
  }
/>
```

Remove from promoter routes:
- Remove `/promoter/incomplete-profile` route
- Remove `/promoter/verification` route

### 4. Update [src/pages/LinkInBio.tsx](src/pages/LinkInBio.tsx#L69-L112)

Update `handleStartChat` function:
```tsx
const handleStartChat = () => {
  if (!isAuthenticated) {
    sessionStorage.setItem('redirectAfterAuth', JSON.stringify({
      action: 'start_chat',
      username: username,
      influencerId: influencer?.uid,
      influencerName: influencer?.influencerProfile?.displayName
    }));
    navigate('/login');
    return;
  }

  // Check if promoter has incomplete profile
  if (user?.roles.includes('promoter') && !user.profileComplete) {
    const needsVerification = influencer?.influencerProfile?.linkInBio?.contactPreference === 'verified_only';
    sessionStorage.setItem('incompleteProfileContext', JSON.stringify({
      username,
      action: 'chat',
      needsVerification,
      influencerId: influencer?.uid,
      influencerName: influencer?.influencerProfile?.displayName
    }));
    navigate('/incomplete-profile');
    return;
  }

  // Check if user can contact (verified only check)
  if (influencer?.influencerProfile?.linkInBio?.contactPreference === 'verified_only') {
    if (user?.roles.includes('promoter') && !user.isPromoterVerified) {
      sessionStorage.setItem('verificationContext', JSON.stringify({
        username,
        action: 'chat',
        influencerId: influencer?.uid,
        influencerName: influencer?.influencerProfile?.displayName
      }));
      navigate('/verification');
      return;
    }
  }

  // Navigate to dedicated chat page
  navigate(`/link/${username}/chat`);
};
```

Update `handleSendProposal` function similarly to navigate to `/link/:username/proposal`.

### 5. Update [src/pages/SignupFromLink.tsx](src/pages/SignupFromLink.tsx#L58-L116)

Update `handleContinueToChat`:
```tsx
const handleContinueToChat = async () => {
  // ... existing profile creation code ...

  // After creating minimal profile, redirect to dedicated chat page
  const storedRedirect = sessionStorage.getItem('redirectAfterAuth');
  if (storedRedirect) {
    const data = JSON.parse(storedRedirect);
    sessionStorage.removeItem('redirectAfterAuth');
    navigate(`/link/${data.username}/chat`);
  }
};
```

Update `handleCompleteProfile`:
```tsx
const handleCompleteProfile = () => {
  const storedRedirect = sessionStorage.getItem('redirectAfterAuth');
  if (storedRedirect) {
    const data = JSON.parse(storedRedirect);
    sessionStorage.setItem('redirectAfterSignup', JSON.stringify({
      username: data.username,
      action: data.action,
      influencerId: data.influencerId,
      influencerName: data.influencerName
    }));
  }
  navigate('/signup/promoter');
};
```

### 6. Update [src/pages/PromoterSignup.tsx](src/pages/PromoterSignup.tsx#L101-L149)

Update redirect logic after successful signup:
```tsx
if (result.success) {
  toast.success('Profile created successfully!');

  const redirectAfterSignup = sessionStorage.getItem('redirectAfterSignup');
  if (redirectAfterSignup) {
    sessionStorage.removeItem('redirectAfterSignup');
    const data = JSON.parse(redirectAfterSignup);

    if (data.action === 'start_chat') {
      navigate(`/link/${data.username}/chat`, { replace: true });
    } else if (data.action === 'send_proposal') {
      navigate(`/link/${data.username}/proposal`, { replace: true });
    }
  } else {
    navigate('/promoter/dashboard', { replace: true });
  }
}
```

### 7. Update [src/components/layout/PromoterLayout.tsx](src/components/layout/PromoterLayout.tsx#L37-L52)

Remove the incomplete profile redirect logic since incomplete-profile is now a root route:
```tsx
// REMOVE this useEffect - no longer needed
// useEffect(() => {
//   if (user && !user.profileComplete) {
//     const currentPath = location.pathname;
//     const isMessagesPath = currentPath.startsWith('/promoter/messages');
//     const isIncompleteProfilePath = currentPath === '/promoter/incomplete-profile';
//     if (!isMessagesPath && !isIncompleteProfilePath) {
//       navigate('/promoter/incomplete-profile', { replace: true });
//     }
//   }
// }, [user, location.pathname, navigate]);
```

### 8. Update [src/pages/promoter/Profile.tsx](src/pages/promoter/Profile.tsx#L99-L114)

Remove the verification redirect logic since verification is now a root route:
```tsx
// REMOVE or UPDATE the verification redirect
// If needed, navigate to root `/verification` instead of `/promoter/verification`
```

### 9. Update [src/pages/promoter/Messages.tsx](src/pages/promoter/Messages.tsx)

Keep existing functionality - this is the main messages hub. The new `/link/:username/chat` pages will create conversations that appear here.

## Route Protection Summary

| Route | Auth Required | Profile Complete | Verification Required |
|-------|--------------|------------------|----------------------|
| `/link/:username` | No | N/A | N/A |
| `/link/:username/chat` | Yes | No (can skip) | If influencer requires |
| `/link/:username/proposal` | Yes | Yes | If influencer requires |
| `/incomplete-profile` | Yes | No | N/A |
| `/verification` | Yes | Yes | N/A |
| `/signup/promoter` | Yes | N/A | N/A |
| `/signup-from-link` | Yes | N/A | N/A |

## Files to Modify

1. **NEW** `src/pages/LinkInBioChat.tsx` - Dedicated chat page
2. **NEW** `src/pages/LinkInBioProposal.tsx` - Dedicated proposal page
3. **MOVE** `src/pages/promoter/IncompleteProfile.tsx` → `src/pages/IncompleteProfile.tsx`
4. **MOVE** `src/pages/promoter/Verification.tsx` → `src/pages/Verification.tsx`
5. **MODIFY** `src/App.tsx` - Add new routes
6. **MODIFY** `src/pages/LinkInBio.tsx` - Update button handlers
7. **MODIFY** `src/pages/SignupFromLink.tsx` - Update redirects
8. **MODIFY** `src/pages/PromoterSignup.tsx` - Update redirects after signup
9. **MODIFY** `src/components/layout/PromoterLayout.tsx` - Remove incomplete profile redirect
10. **MODIFY** `src/pages/promoter/Profile.tsx` - Update verification redirect

## Benefits

1. **Clearer Mental Model**: Link-in-bio actions stay in the "link-in-bio context" rather than diving into promoter dashboard
2. **No Sidebar Confusion**: Users with incomplete profiles don't see the sidebar with features they can't access
3. **Simpler Navigation**: Fewer redirects through `/promoter/*` routes
4. **Better UX**: Dedicated pages provide focused experience (chat only, proposal only)
5. **Consistent**: Both `/link/:username/chat` and `/link/:username/proposal` follow the same pattern

## Questions to Confirm

1. Should `/link/:username/chat` show a back button to the link-in-bio page, or should it be a standalone experience?
2. After verification completes, should we show a success message before redirecting to chat/proposal?
3. Should we store the verification intent in sessionStorage or URL params for better state management?
4. Do we want to keep the existing `/promoter/messages` behavior exactly as is, or should we update it to handle the new flow differently?
