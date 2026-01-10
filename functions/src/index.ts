// ============================================
// FIREBASE FUNCTIONS - MAIN ENTRY POINT
// ============================================
// This file exports all Firebase Functions from individual modules

// Platform Fee Functions
export {
  createPlatformFeeOrderFunction,
  verifyPlatformFeePaymentFunction,
  razorpayWebhookFunction,
  recordPlatformFeePaymentFunction,
  applyPlatformFeeWebhookCaptured,
  verifyPlatformFeePaymentCore,
} from './functions/platformFee';

// Follower Count Functions
export {
  fetchFollowerCountFunction,
  fetchMultipleFollowerCountsFunction,
  getRateLimitStatusFunction,
} from './functions/followerCount';

// Instagram Analytics Functions
export {
  fetchInstagramAnalyticsFunction,
} from './functions/instagramAnalytics';

// Instagram Posts Analytics Functions
export {
  fetchInstagramPostsAnalyticsFunction,
} from './functions/instagramPostsAnalytics';

// Username Validation Functions
export {
  checkUsernameAvailabilityFunction,
} from './functions/usernameValidation';

// Verification Payment Functions
export {
  createVerificationOrderFunction,
  verifyVerificationPaymentFunction,
} from './functions/verification';

// Public Profile Functions
export {
  getPublicProfile,
  getPublicProfiles,
  searchPublicProfiles,
} from './functions/publicProfile';
