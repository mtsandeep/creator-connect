# CreatorConnect - Security Documentation

**Last Updated:** 2025-12-29

---

## Overview

This document outlines the current security implementation, known vulnerabilities, and recommended improvements for the CreatorConnect platform.

---

## Current Security Architecture

### Authentication
- **Provider:** Firebase Auth with Google OAuth
- **Session Management:** Zustand with localStorage persistence
- **Role Storage:** User roles stored in Firestore `users/{userId}` document

### Authorization
- **Admin Detection:** Firestore security rules check `roles` array in user document
- **Impersonation Control:** Marker document in `impersonation/{adminId}` collection
- **Client-Side Checks:** Route guards and UI conditionals

### Data Security
- **Firestore Rules:** Client-side operations validated by security rules
- **Impersonation Write-Blocking:** All writes blocked when impersonation marker exists
- **Admin Logging:** Actions logged to `adminLogs` collection

---

## Security Analysis

### 🔴 Critical Issues

#### 1. Admin Role in User Document (Not Custom Claims)
**Problem:** Admin status is checked by reading the user document in Firestore rules.

```javascript
// Current approach - requires DB read
allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.includes('admin')
```

**Risks:**
- Performance: Every admin operation requires a database read
- Race conditions: User document could be modified during operation
- Scalability: Doesn't scale with large user base

**Recommendation:** Use Firebase Custom Claims (set via Admin SDK only)
```javascript
// Better approach - instant, no DB read
allow write: if request.auth.token.admin == true
```

#### 2. Impersonation Controlled by Client
**Problem:** Client creates/deletes impersonation marker documents.

**Risks:**
- Compromised client could bypass marker creation
- No server-side validation of impersonation requests
- Marker documents may not be cleaned up properly

**Recommendation:** Use Cloud Functions with custom claims
```javascript
// Server sets temporary claim
await admin.auth().setCustomUserClaims(adminId, {
  impersonatingAs: targetUserId,
  impersonationExpiresAt: Date.now() + 3600000 // 1 hour
});
```

**Security Rule:**
```javascript
// Block writes if impersonating claim exists
allow write: if request.auth.token.impersonatingAs == null
```

#### 3. Admin Operations Client-Side
**Problem:** Ban, unban, trusted badge assignment done directly from client.

**Risks:**
- Client could bypass validation
- Logging could be skipped
- No audit trail guaranteed

**Current Code:**
```typescript
// src/hooks/useAdmin.ts - Client can call this directly
await updateDoc(userRef, {
  isBanned: true,
  banReason: reason
});
```

### 🟡 Medium Priority Issues

#### 4. No Email Verification
**Problem:** Users can sign up with any Google account, verified or not.

**Recommendation:**
```javascript
// Enforce email verification
allow create: if request.auth.token.email_verified == true
```

#### 5. No Rate Limiting
**Problem:** No protection against API abuse or brute force attempts.

**Recommendation:** Implement via Cloud Functions or Firestore counters.

#### 6. Sensitive Data in Logs
**Problem:** Admin logs contain PII (emails) stored indefinitely.

**Recommendation:**
- Implement data retention policy
- Consider hashing emails in logs
- Add GDPR compliance features

#### 7. No Field-Level Validation in Rules
**Problem:** Ban reason, badge assignments not validated at rule level.

**Recommendation:**
```javascript
// Validate ban reason is provided and has minimum length
allow update: if request.resource.data.banReason is string &&
              request.resource.data.banReason.length >= 10
```

### 🟢 Low Priority Issues

#### 8. No App Check
**Recommendation:** Enable Firebase App Check to prevent unauthorized API calls.

#### 9. No MFA
**Recommendation:** Consider multi-factor authentication for admin accounts.

#### 10. No Session Timeout
**Recommendation:** Implement proper session timeout and "remember me" functionality.

---

## Cloud Functions Migration Plan

### Phase 1: Critical Security (HIGH PRIORITY)

#### 1.1 Admin Operations
Move all admin operations to Cloud Functions with proper authentication:

| Function | Current | Target |
|----------|---------|--------|
| `banUser` | Client-side Firestore write | Cloud Function with admin claim check |
| `unbanUser` | Client-side Firestore write | Cloud Function with admin claim check |
| `assignTrusted` | Client-side Firestore write | Cloud Function with admin claim check |
| `removeTrusted` | Client-side Firestore write | Cloud Function with admin claim check |
| `assignAdmin` | Client-side Firestore write | Cloud Function with admin claim check |

**Example Implementation:**
```typescript
// functions/src/admin.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const banUser = functions.https.onCall(async (data, context) => {
  // 1. Verify admin using custom claims
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can ban users'
    );
  }

  // 2. Validate input
  const { userId, reason } = data;
  if (!reason || reason.length < 10) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Ban reason must be at least 10 characters'
    );
  }

  // 3. Cannot ban other admins
  const targetUser = await admin.auth().getUser(userId);
  if (targetUser.customClaims?.admin) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Cannot ban other admin users'
    );
  }

  // 4. Execute ban
  await admin.firestore().collection('users').doc(userId).update({
    isBanned: true,
    banReason: reason,
    bannedAt: Date.now(),
    bannedBy: context.auth.uid
  });

  // 5. Log action (guaranteed)
  await admin.firestore().collection('adminLogs').add({
    adminId: context.auth.uid,
    adminEmail: context.auth.token.email,
    action: 'ban_user',
    targetUserId: userId,
    reason,
    timestamp: Date.now()
  });

  // 6. Optional: Send notification
  // await sendBanNotification(userId, reason);

  return { success: true };
});
```

**Client Usage:**
```typescript
// Before: Direct Firestore write
const result = await banUser(userId, email, reason, adminId, adminEmail);

// After: Cloud Function
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const banUserFn = httpsCallable(functions, 'banUser');

const result = await banUserFn({
  userId,
  reason: 'Must provide detailed reason'
});
```

#### 1.2 Impersonation Management
Move impersonation to Cloud Functions with custom claims:

| Function | Description |
|----------|-------------|
| `startImpersonation` | Sets temporary `impersonatingAs` claim on admin token |
| `endImpersonation` | Removes `impersonatingAs` claim |
| `getImpersonationStatus` | Checks if currently impersonating |

**Benefits:**
- Server-side control - cannot be bypassed
- Automatic expiration (claims can have TTL)
- Better audit trail
- No marker document cleanup needed

---

### Phase 2: Data Integrity (MEDIUM PRIORITY)

#### 2.1 Verification & Ratings
Move verification and rating logic to server:

| Function | Current | Target |
|----------|---------|--------|
| `markVerified` | Client-side after project completion | Cloud Function validates project completion |
| `submitReview` | Client-side with avg calculation | Cloud Function validates and recalculates |
| `updateRating` | Client-side direct write | Cloud Function ensures data integrity |

**Why:** Prevents users from verifying themselves or manipulating ratings.

#### 2.2 Payment Safety
Move payment operations to server:

| Function | Description |
|----------|-------------|
| `createPayment` | Validates proposal state before payment |
| `confirmPayment` | Updates milestone and proposal status atomically |
| `processRefund` | Handles refund with proper validation |

**Why:** Financial data must be validated server-side.

---

### Phase 3: User Experience (MEDIUM PRIORITY)

#### 3.1 Notifications
Centralize notification logic:

| Function | Description |
|----------|-------------|
| `sendProposalNotification` | Email on proposal create/accept/reject |
| `sendPaymentNotification` | Email on payment completion |
| `sendMilestoneReminder` | Automated milestone reminders |
| `sendUnreadMessageCount` | Real-time message notifications |

#### 3.2 Messaging
Move message operations to server:

| Function | Description |
|----------|-------------|
| `sendMessage` | Validate and send with rate limit check |
| `markConversationRead` | Update read status atomically |
| `getUnreadCounts` | Efficient unread count calculation |

---

### Phase 4: Platform Health (LOW PRIORITY)

#### 4.1 Analytics
Pre-compute expensive aggregations:

| Function | Description |
|----------|-------------|
| `updatePlatformStats` | Scheduled task to update statistics |
| `generateUsageReport` | Daily/weekly usage reports |
| `calculateCompletionRates` | Track proposal completion metrics |

#### 4.2 Maintenance
Scheduled cleanup tasks:

| Function | Description |
|----------|-------------|
| `cleanupOldMessages` | Delete messages older than X days |
| `archiveCompletedProposals` | Move old proposals to archive |
| `cleanupAbandonedProposals` | Remove stale proposals |

#### 4.3 Rate Limiting
Protect against abuse:

| Function | Description |
|----------|-------------|
| `checkRateLimit` | Per-user rate limiting |
| `trackApiUsage` | Monitor API usage patterns |
| `blockAbusiveUsers` | Auto-block on suspicious activity |

---

## Firebase Custom Claims Setup

### Initial Setup Script

Run once to set up custom claims for existing admins:

```typescript
// scripts/setAdminClaims.ts
import * as admin from 'firebase-admin';

const adminEmails = [
  'admin@creatorconnect.com',
  'your-email@example.com'
];

async function setAdminClaims() {
  for (const email of adminEmails) {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      email: email
    });
    console.log(`Set admin claim for ${email}`);
  }
}

setAdminClaims();
```

### Claim Management Functions

```typescript
// functions/src/auth.ts

// Set admin claim (call manually via Admin SDK or trigger)
export const setUserAsAdmin = functions.https.onCall(async (data, context) => {
  // Only existing admins can set other admins
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { userId } = data;
  await admin.auth().setCustomUserClaims(userId, {
    admin: true
  });

  // Also update Firestore for backward compatibility
  await admin.firestore().collection('users').doc(userId).update({
    roles: admin.firestore.FieldValue.arrayUnion('admin')
  });

  return { success: true };
});

// Remove admin claim
export const removeAdminClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { userId } = data;
  await admin.auth().setCustomUserClaims(userId, {
    admin: false
  });

  await admin.firestore().collection('users').doc(userId).update({
    roles: admin.firestore.FieldValue.arrayRemove('admin')
  });

  return { success: true };
});
```

---

## Updated Security Rules

### With Custom Claims

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function - check if user is admin via custom claim
    function isAdmin() {
      return request.auth != null &&
             request.auth.token.admin == true;
    }

    // Helper function - check if user is currently impersonating
    function isImpersonating() {
      return request.auth != null &&
             request.auth.token.impersonatingAs != null;
    }

    // Block all writes during impersonation
    match /{document=**} {
      allow write: if !isImpersonating() && isAdmin();
    }

    // Admin logs - only server can write
    match /adminLogs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Server-side only
    }

    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth != null && request.auth.uid == userId;

      // Admins can read all users
      allow read: if isAdmin();

      // Users can update their own profile (non-sensitive fields)
      allow update: if request.auth != null &&
                       request.auth.uid == userId &&
                       !request.resource.data.diff(resource.data).affectedKeys()
                         .hasAny(['roles', 'isBanned', 'verificationBadges', 'avgRating']);

      // Admins can update user documents (with validation)
      allow update: if isAdmin() &&
                       !request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['isBanned', 'banReason', 'bannedAt', 'bannedBy',
                                   'verificationBadges', 'roles']);

      // Ban operations require reason
      allow update: if isAdmin() &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isBanned', 'banReason', 'bannedAt', 'bannedBy']) &&
                       request.resource.data.isBanned == true &&
                       request.resource.data.banReason is string &&
                       request.resource.data.banReason.length >= 10;
    }

    // Proposals collection
    match /proposals/{proposalId} {
      allow read: if request.auth != null &&
                     (request.auth.uid == resource.data.influencerId ||
                      request.auth.uid == resource.data.promoterId ||
                      isAdmin());

      allow create: if request.auth != null;

      // Status changes via Cloud Functions only
      allow update: if false;
    }
  }
}
```

---

## Implementation Priority

### Immediate (This Sprint)
1. ✅ Document current security state
2. ⏳ Set up Firebase Admin SDK
3. ⏳ Create custom claims script for existing admins
4. ⏳ Implement admin Cloud Functions (ban, unban, trusted)

### Short Term (Next Sprint)
1. Migrate all admin operations to Cloud Functions
2. Update client code to use Cloud Functions
3. Implement custom claims for admin detection
4. Update security rules to use custom claims

### Medium Term (Next Month)
1. Move verification/rating logic to Cloud Functions
2. Implement payment validation in Cloud Functions
3. Add email notifications via Cloud Functions
4. Set up monitoring and alerting

### Long Term (Next Quarter)
1. Implement rate limiting
2. Add App Check
3. Set up scheduled maintenance tasks
4. Implement GDPR compliance features

---

## Security Checklist

### Authentication
- [x] Firebase Auth with Google OAuth
- [ ] Email verification enforcement
- [ ] Multi-factor authentication for admins
- [ ] Proper session timeout
- [ ] Secure "remember me" implementation

### Authorization
- [x] Role-based access control
- [ ] Firebase Custom Claims for admin
- [ ] Impersonation via custom claims (not marker docs)
- [ ] Field-level permissions in rules
- [ ] Resource ownership validation

### Data Protection
- [x] Admin operations audit log
- [ ] Data retention policy
- [ ] PII encryption at rest
- [ ] GDPR compliance (export, delete)
- [ ] Backup and disaster recovery

### API Security
- [ ] Rate limiting per user
- [ ] Request size limits
- [ ] Firebase App Check
- [ ] IP-based restrictions (optional)
- [ ] API usage monitoring

### Infrastructure
- [ ] Cloud Functions for sensitive ops
- [ ] Monitoring and alerting
- [ ] Error tracking (Crashlytics)
- [ ] Security scanning
- [ ] Regular security audits

---

## Additional Resources

- [Firebase Security Rules Best Practices](https://firebase.google.com/docs/firestore/security/best-practices)
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
