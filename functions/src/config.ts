// ============================================
// APIFY CONFIGURATION
// ============================================

export const APIFY_CONFIG = {
  // Get your API key from https://console.apify.com/
  // Set via environment variable:
  // - Local: Create functions/.env file with APIFY_API_KEY
  // - CI/CD: Set APIFY_API_KEY in GitHub Secrets
  API_KEY: process.env.APIFY_API_KEY || '',

  // Actor IDs for different platforms
  ACTORS: {
    instagram: 'apify/instagram-profile-scraper',
    instagramAnalyzer: 'datadoping/fake-followers-checker',
    instagramAnalyzerAlt: 'powerful_bachelor/instagram-profile-scraper-pro-pay-per-result',
    youtube: 'streamers/youtube-scraper',
    facebook: 'apify/facebook-pages-scraper',
  },

  // Rate limiting: 5 calls per platform per user
  MAX_CALLS_PER_PLATFORM: 5,

  // Cache duration in seconds (1 hour)
  CACHE_DURATION: 3600,
};

// ============================================
// FIRESTORE CONFIGURATION
// ============================================

export const COLLECTIONS = {
  USERS: 'users',
  RATE_LIMITS: 'rateLimits',
  API_CACHE: 'apiCache',
  INSTAGRAM_ANALYTICS: 'instagramAnalytics',
  INSTAGRAM_ANALYTICS_ALT: 'instagramAnalyticsAlt',
  PROPOSALS: 'proposals',
  TRANSACTIONS: 'transactions',
  PAYMENT_ORDERS: 'paymentOrders',
};

// ============================================
// ERROR MESSAGES
// ============================================

export const ERRORS = {
  RATE_LIMIT_EXCEEDED: 'You have exceeded the maximum number of API calls for this platform',
  INVALID_PLATFORM: 'Invalid platform specified',
  INVALID_USERNAME: 'Invalid username provided',
  APIFY_ERROR: 'Failed to fetch data from social media platform',
  NOT_FOUND: 'Profile not found',
};
