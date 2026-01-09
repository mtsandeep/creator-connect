// ============================================
// APIFY CLIENT SERVICE
// ============================================

import { ApifyClient } from 'apify';
import { APIFY_CONFIG, ERRORS } from './config';

// Custom error class for insufficient data
export class InsufficientDataError extends Error {
  constructor(
    message: string,
    public readonly postsFound: number,
    public readonly postsRequired: number,
    public readonly reason: 'very_few_posts' | 'filtered_posts' | 'insufficient_engagement',
    public readonly totalFetched?: number,
    public readonly tooOld?: number,
    public readonly tooRecent?: number
  ) {
    super(message);
    this.name = 'InsufficientDataError';
  }
}

// Initialize Apify Client
const getApifyClient = () => {
  const apiKey = APIFY_CONFIG.API_KEY;
  if (!apiKey) {
    throw new Error('Apify API key not configured');
  }
  return new ApifyClient({ token: apiKey });
};

// ============================================
// PLATFORM-SPECIFIC FETCHERS
// ============================================

export interface FollowerData {
  platform: string;
  username: string;
  followerCount: number;
  profileUrl?: string;
  displayName?: string;
  verified?: boolean;
}

export interface InstagramAnalyticsData {
  username: string;
  fullName: string;
  bio: string;
  isVerified: boolean;
  fakeFollowers: number;
  audienceCredibility: number;
  followers: number;
  averageLikes: number;
  averageComments: number;
  averageReelPlays: number;
  engagementRate: number;
  followersOverTime: Array<{ date: string; value: number }>;
  likesOverTime: Array<{ date: string; value: number }>;
  mostUsedMentions: string[];
  mostUsedHashtags: string[];
  audienceTypes: {
    suspiciousMassFollowers: number;
    bots: number;
    realPeople: number;
    influencers: number;
    massFollowers: number;
  };
  audienceCities: Array<{ name: string; weight: number }>;
  audienceCountries: Array<{ name: string; weight: number }>;
  genderSplit: Array<{ label: string; value: number }>;
  popularPosts: Array<{
    id: string;
    type: string;
    url: string;
    date: string;
    likes: number;
    commentsCount: number;
    text?: string;
  }>;
  engagementForRecentPosts?: Array<[string, number, number]>; // [date, avgLikes, avgComments]
  reportUpdatedAt: string;
  location: string;
  url: string;
}

// Alternative data structure for the powerful_bachelor/instagram-profile-scraper-pro-pay-per-result actor
export interface InstagramAnalyticsAltData {
  username: string;
  fullName: string;
  bio: string;
  isVerified: boolean;
  isPrivate: boolean;
  followers: number;
  follows: number;
  postsCount: number;
  averageLikes: number;
  averageComments: number;
  averageViews: number;
  engagementRate: number;
  profilePicBase64: string; // Base64 encoded profile picture
  externalUrl: string;
  businessCategoryName: string | null;
  isBusinessAccount: boolean;
  joinedRecently: boolean;
  hasChannel: boolean;
  highlightReelCount: number;
  igtvVideoCount: number;
  popularPosts: Array<{
    id: string;
    shortcode: string;
    type: string;
    text?: string;
    likes: number;
    comments: number;
    videoViews?: number;
    isVideo: boolean;
    timestamp: number;
    url: string;
    isPinned: boolean;
  }>;
  dataSource: 'alt'; // Marker to identify this is from the alternative source
  reportUpdatedAt: string;
  url: string;
}

// Post data structure from fast-instagram-post-scraper
export interface InstagramPostData {
  id: string;
  pk: string;
  type: string;
  shortcode: string;
  caption?: string;
  comment_count: number;
  like_count: number;
  view_count: number | null;
  hashtags: string[];
  mentions: string[];
  date: string; // ISO date string
  video_duration?: number | null;
  is_pinned?: boolean;
  post_url: string;
  image?: string;
}

// Calculated analytics from posts
export interface InstagramPostsAnalyticsData {
  username: string;
  followers: number;
  totalPostsFetched: number;
  postsAnalyzed: number;
  postsFiltered: {
    tooRecent: number; // < 24 hours
    tooOld: number; // > 60 days
    negativeOutliers: number;
  };

  // Post type breakdown
  postTypeBreakdown: {
    imageCount: number;
    videoCount: number;
    totalCount: number;
  };

  // General metrics (includes all posts after negative outlier removal)
  avgLikes: number;
  avgComments: number;
  avgViews: number;
  generalEngagementRate: number;

  // Typical metrics (viral posts capped at 3x median)
  typicalAvgLikes: number;
  typicalAvgComments: number;
  typicalAvgViews: number;
  typicalEngagementRate: number;

  // Video-only metrics (reels only)
  generalVideoEngagementRate: number;
  typicalVideoEngagementRate: number;

  // Viral post information
  viralPostsCount: number;
  viralPostsAvgViews: number;
  viralPostsAvgEngagement: number;

  // Calculation details
  medianLikes: number;
  medianComments: number;
  medianViews: number;
  medianEngagement: number;

  // Post details
  posts: Array<{
    id: string;
    shortcode: string;
    type: string;
    date: string;
    likes: number;
    comments: number;
    views: number | null;
    engagement: number;
    isViral: boolean;
    isNegativeOutlier: boolean;
    url: string;
  }>;

  reportUpdatedAt: string;
  dataSource: 'posts';
  url: string;

  // PATCHY LOGIC: Profile picture extracted from posts data (from first post's user object)
  // This is needed because primary analytics doesn't include profile picture
  profilePicUrl?: string;
  profilePicBase64?: string;
}

function parseCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed.replace(/,/g, '').replace(/\s+/g, '');
  const match = normalized.match(/^([0-9]*\.?[0-9]+)([KMB])?$/i);
  if (!match) {
    const digitsOnly = normalized.replace(/[^0-9]/g, '');
    return digitsOnly ? Number(digitsOnly) : 0;
  }

  const base = Number(match[1]);
  if (!Number.isFinite(base)) {
    return 0;
  }

  const suffix = (match[2] || '').toUpperCase();
  const multiplier = suffix === 'K' ? 1_000 : suffix === 'M' ? 1_000_000 : suffix === 'B' ? 1_000_000_000 : 1;
  return Math.round(base * multiplier);
}

/**
 * Fetch Instagram profile data using Apify
 */
async function fetchInstagramData(username: string): Promise<FollowerData> {
  const client = getApifyClient();

  const input = {
    usernames: [username],
    resultsType: 'details',
    resultsLimit: 1,
  };

  const run = await client.actor(APIFY_CONFIG.ACTORS.instagram).call(input);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  const profile = items[0] as any;

  return {
    platform: 'instagram',
    username,
    followerCount: (profile.followersCount as number) || 0,
    profileUrl: profile.url as string,
    displayName: (profile.fullName as string) || (profile.username as string),
    verified: (profile.isVerified as boolean) || false,
  };
}

/**
 * Fetch YouTube channel data using Apify
 */
async function fetchYouTubeData(username: string): Promise<FollowerData> {
  const client = getApifyClient();

  const input = {
    startUrls: [{ url: `https://www.youtube.com/@${username}` }],
    maxResults: 1,
  };

  const run = await client.actor(APIFY_CONFIG.ACTORS.youtube).call(input);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  const channel = items[0] as any;

  return {
    platform: 'youtube',
    username,
    followerCount:
      parseCount(
        channel.numberOfSubscribers ??
          channel.subscriberCount ??
          channel.subscribers ??
          channel.subscribersCount ??
          channel.subscribersText
      ) || 0,
    profileUrl: (channel.channelUrl as string) || (channel.url as string),
    displayName: (channel.channelName as string) || (channel.title as string),
    verified: (channel.isVerified as boolean) || false,
  };
}

/**
 * Fetch Facebook page data using Apify
 */
async function fetchFacebookData(username: string): Promise<FollowerData> {
  const client = getApifyClient();

  const input = {
    startUrls: [{ url: `https://www.facebook.com/${username}` }],
    resultsType: 'details',
    resultsLimit: 1,
  };

  const run = await client.actor(APIFY_CONFIG.ACTORS.facebook).call(input);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  const page = items[0] as any;

  const rawFollowerCount =
    page.likes ??
    page.followersCount ??
    page.followers ??
    page.followers_count ??
    page.followersCountText ??
    page.followersText ??
    page.followersString ??
    page.likesCount ??
    page.likes ??
    page.likes_count ??
    page.likesCountText ??
    page.likesText;

  return {
    platform: 'facebook',
    username,
    followerCount: parseCount(rawFollowerCount),
    profileUrl: (page.url as string) || (page.pageUrl as string),
    displayName: (page.name as string) || (page.title as string),
    verified: (page.verified as boolean) || false,
  };
}

// ============================================
// MAIN FETCHER FUNCTION
// ============================================

/**
 * Fetch follower count from social media platform
 */
export async function fetchFollowerCount(
  platform: string,
  username: string
): Promise<FollowerData> {
  // Validate inputs
  if (!username || username.trim().length === 0) {
    throw new Error(ERRORS.INVALID_USERNAME);
  }

  const cleanUsername = username.trim().replace('@', '');

  // Platform-specific fetchers
  switch (platform) {
    case 'instagram':
      return await fetchInstagramData(cleanUsername);

    case 'youtube':
      return await fetchYouTubeData(cleanUsername);

    case 'facebook':
      return await fetchFacebookData(cleanUsername);

    default:
      throw new Error(ERRORS.INVALID_PLATFORM);
  }
}

/**
 * Fetch multiple profiles in parallel (max 3 at a time)
 */
export async function fetchMultipleFollowerCounts(
  requests: Array<{ platform: string; username: string }>
): Promise<FollowerData[]> {
  const results: FollowerData[] = [];

  // Process in batches of 3 to avoid overwhelming the API
  for (let i = 0; i < requests.length; i += 3) {
    const batch = requests.slice(i, i + 3);
    const batchResults = await Promise.allSettled(
      batch.map(req => fetchFollowerCount(req.platform, req.username))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Log error but continue with other requests
        console.error(`Failed to fetch ${batch[index].platform}/${batch[index].username}:`, result.reason);
      }
    });
  }

  return results;
}

// ============================================
// INSTAGRAM ANALYTICS FETCHER
// ============================================

/**
 * Fetch detailed Instagram profile analytics using Fake Followers Checker
 * This uses the datadoping/fake-followers-checker actor for comprehensive data
 */
export async function fetchInstagramAnalytics(
  username: string
): Promise<InstagramAnalyticsData> {
  if (!username || username.trim().length === 0) {
    throw new Error(ERRORS.INVALID_USERNAME);
  }

  const cleanUsername = username.trim().replace('@', '');
  const client = getApifyClient();

  const input = {
    usernames: [cleanUsername],
    // The analyzer will automatically get detailed analytics
  };

  const run = await client.actor(APIFY_CONFIG.ACTORS.instagramAnalyzer).call(input);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  const analytics = items[0] as any;

  // Check if the result contains an error field from the actor
  if (analytics.error || analytics.errorMessage || (analytics.message && analytics.message.includes('User not found'))) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  // Also check if the actor returned a result with 0 followers and no username
  // This can happen when the user is not found but the actor still returns an item
  if ((!analytics.username || analytics.followers === 0) && !analytics.fullName) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  // Map the response to our interface
  return {
    username: analytics.username || cleanUsername,
    fullName: analytics.fullName || '',
    bio: analytics.bio || '',
    isVerified: analytics.isVerified || false,
    fakeFollowers: analytics.fakeFollowers || 0,
    audienceCredibility: analytics.audienceCredibility || 0,
    followers: analytics.followers || 0,
    averageLikes: analytics.averageLikes || 0,
    averageComments: analytics.averageComments || 0,
    averageReelPlays: analytics.averageReelPlays || 0,
    engagementRate: analytics.engagementRate || 0,
    followersOverTime: analytics.followersOverTime || [],
    likesOverTime: analytics.likesOverTime || [],
    mostUsedMentions: analytics.mostUsedMentions || [],
    mostUsedHashtags: analytics.mostUsedHashtags || [],
    audienceTypes: analytics.audienceTypes || {
      suspiciousMassFollowers: 0,
      bots: 0,
      realPeople: 0,
      influencers: 0,
      massFollowers: 0,
    },
    audienceCities: analytics.audienceCities || [],
    audienceCountries: analytics.audienceCountries || [],
    genderSplit: analytics.genderSplit || [],
    popularPosts: analytics.popularPosts || [],
    engagementForRecentPosts: analytics.engagementForRecentPosts || undefined,
    reportUpdatedAt: analytics.reportUpdatedAt || new Date().toISOString(),
    location: analytics.location || '',
    url: analytics.url || `https://www.instagram.com/${cleanUsername}`,
  };
}

/**
 * Fetch Instagram profile analytics using alternative actor
 * This uses the powerful_bachelor/instagram-profile-scraper-pro-pay-per-result actor
 * as a backup when the primary analyzer fails
 */
export async function fetchInstagramAnalyticsAlt(
  username: string
): Promise<InstagramAnalyticsAltData> {
  if (!username || username.trim().length === 0) {
    throw new Error(ERRORS.INVALID_USERNAME);
  }

  const cleanUsername = username.trim().replace('@', '');
  const client = getApifyClient();

  const input = {
    usernames: [cleanUsername],
    resultsType: 'posts',
    resultsLimit: 24,
    addParentData: true,
  };

  const run = await client.actor(APIFY_CONFIG.ACTORS.instagramAnalyzerAlt).call(input);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  const profile = items[0] as any;

  // Check if the result contains an error field from the actor
  if (profile.error || profile.errorMessage) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  // Fetch profile picture and convert to base64
  let profilePicBase64 = '';
  const profilePicUrl = profile.profile_pic_hd || profile.profile_pic_url || '';
  if (profilePicUrl) {
    try {
      const response = await fetch(profilePicUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        // Detect content type from URL or default to jpeg
        const contentType = 'image/jpeg';
        profilePicBase64 = `data:${contentType};base64,${base64}`;
      }
    } catch (error) {
      // If fetching fails, continue without profile pic
      console.warn('Failed to fetch profile picture:', error);
    }
  }

  // Transform latest_posts to our simplified format (no thumbnail URLs)
  const latestPosts = (profile.latest_posts || []).map((post: any) => {
    const node = post.node || post;

    // Check if post is pinned by the current profile user
    const pinnedForUsers = node.pinned_for_users || [];
    const isPinned = pinnedForUsers.some((user: any) =>
      user.username === cleanUsername || user.username === profile.username
    );

    return {
      id: node.id || '',
      shortcode: node.shortcode || '',
      type: node.__typename || node.type || 'post',
      text: node.edge_media_to_caption?.edges?.[0]?.node?.text || node.caption || null,
      likes: node.edge_liked_by?.count || node.likes || 0,
      comments: node.edge_media_to_comment?.count || node.comments || 0,
      videoViews: node.is_video ? (node.video_view_count || 0) : null,
      isVideo: node.is_video || false,
      timestamp: node.taken_at_timestamp || Date.now(),
      url: node.shortcode ? `https://www.instagram.com/p/${node.shortcode}/` : `https://www.instagram.com/${cleanUsername}/`,
      isPinned,
    };
  });

  // Map the response to our alternative interface
  return {
    username: profile.username || cleanUsername,
    fullName: profile.full_name || '',
    bio: profile.biography || '',
    isVerified: profile.is_verified || false,
    isPrivate: profile.is_private || false,
    followers: profile.followers_count || 0,
    follows: profile.follows_count || 0,
    postsCount: profile.posts_count || 0,
    averageLikes: profile.average_likes || 0,
    averageComments: profile.average_comments || 0,
    averageViews: profile.average_views || 0,
    engagementRate: profile.engagement_rate || 0,
    profilePicBase64,
    externalUrl: profile.external_url || '',
    businessCategoryName: profile.business_category_name || null,
    isBusinessAccount: profile.is_business_account || false,
    joinedRecently: profile.joined_recently || false,
    hasChannel: profile.has_channel || false,
    highlightReelCount: profile.highlight_reel_count || 0,
    igtvVideoCount: profile.igtv_video_count || 0,
    popularPosts: latestPosts,
    dataSource: 'alt',
    reportUpdatedAt: new Date().toISOString(),
    url: `https://www.instagram.com/${cleanUsername}/`,
  };
}

// ============================================
// INSTAGRAM POSTS ANALYTICS FETCHER
// ============================================

/**
 * Calculate engagement rate for a post
 * Formula: (likes + 2*comments) / followers * 100
 */
function calculateEngagement(likes: number, comments: number, followers: number): number {
  if (followers === 0) return 0;
  return ((likes + 2 * comments) / followers) * 100;
}

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Fetch Instagram posts and calculate engagement metrics
 * This uses the apify/fast-instagram-post-scraper actor
 */
export async function fetchInstagramPostsAnalytics(
  username: string,
  followersCount: number,
  maxPosts: number = 36
): Promise<InstagramPostsAnalyticsData> {
  if (!username || username.trim().length === 0) {
    throw new Error(ERRORS.INVALID_USERNAME);
  }

  if (followersCount <= 0) {
    throw new Error('Valid follower count is required for engagement calculation');
  }

  const cleanUsername = username.trim().replace('@', '');
  const client = getApifyClient();

  // Configuration constants
  const TIME_WINDOW_DAYS = 60;
  const MIN_POST_AGE_HOURS = 24;
  const MIN_POSTS_REQUIRED = 10;
  const NEGATIVE_OUTLIER_THRESHOLD = 0.05; // 5% of median
  const NEGATIVE_OUTLIER_MIN_ENGAGEMENT = 10; // Minimum engagement for negative outlier check
  const NEGATIVE_OUTLIER_MAX_REMOVALS = 3; // Maximum posts to remove as negative outliers
  const NEGATIVE_OUTLIER_MAX_PERCENTAGE = 0.2; // 20% of total posts
  const VIRAL_MULTIPLIER = 3; // 3x median for viral detection

  const now = Date.now();
  const minPostTimestamp = now - (TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000); // 60 days ago
  const minAllowedTimestamp = now - (MIN_POST_AGE_HOURS * 60 * 60 * 1000); // 24 hours ago

  // Fetch posts from Apify
  const input = {
    instagramUsernames: [cleanUsername],
    postsPerProfile: maxPosts,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ['RESIDENTIAL'],
      apifyProxyCountry: 'US',
    },
    retries: 3,
  };

  const run = await client.actor(APIFY_CONFIG.ACTORS.instagramAnalyzerPosts).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error(ERRORS.NOT_FOUND);
  }

  const rawPosts = items as unknown as InstagramPostData[];

  // PATCHY LOGIC: Extract profile picture URL from first post's user object
  // The primary analytics actor doesn't provide profile picture, so we get it from posts
  let profilePicUrl: string | undefined;
  let profilePicBase64: string | undefined;
  if (rawPosts.length > 0) {
    const firstPost = items[0] as any;
    const picUrl = firstPost?.user?.profile_pic_url || firstPost?.owner?.profile_pic_url;
    if (picUrl) {
      profilePicUrl = picUrl;

      // Convert to base64
      try {
        const response = await fetch(picUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          profilePicBase64 = `data:image/jpeg;base64,${base64}`;
        }
      } catch (error) {
        // If fetching fails, continue without profile pic
        console.warn('Failed to fetch profile picture from posts:', error);
      }
    }
  }

  // Deduplicate posts based on 'pk' field (Apify may return duplicates when posts < 36)
  const uniquePostsMap = new Map<string, InstagramPostData>();
  for (const post of rawPosts) {
    if (!uniquePostsMap.has(post.pk)) {
      uniquePostsMap.set(post.pk, post);
    }
  }
  const deduplicatedPosts = Array.from(uniquePostsMap.values());

  // Filter posts by date range
  let filteredPosts = deduplicatedPosts.filter(post => {
    const postTimestamp = new Date(post.date).getTime();

    // Skip posts older than 60 days
    if (postTimestamp < minPostTimestamp) {
      return false;
    }

    // Skip posts newer than 24 hours
    if (postTimestamp > minAllowedTimestamp) {
      return false;
    }

    return true;
  });

  const tooRecentCount = deduplicatedPosts.length - filteredPosts.length -
    deduplicatedPosts.filter(p => new Date(p.date).getTime() < minPostTimestamp).length;
  const tooOldCount = deduplicatedPosts.filter(p => new Date(p.date).getTime() < minPostTimestamp).length;

  // Log filtering results for debugging
  const logger = require('firebase-functions/logger');
  logger.info(`Posts filtering for ${cleanUsername}:`, {
    totalFetched: deduplicatedPosts.length,
    tooOld: tooOldCount,
    tooRecent: tooRecentCount,
    withinWindow: filteredPosts.length,
    minRequired: MIN_POSTS_REQUIRED,
  });

  // Check if we have minimum required posts
  if (filteredPosts.length < MIN_POSTS_REQUIRED) {
    // Scenario 1: Very few posts overall (less than 10 unique posts)
    if (deduplicatedPosts.length < MIN_POSTS_REQUIRED) {
      throw new InsufficientDataError(
        `Very few posts. Profile has only ${deduplicatedPosts.length} post${deduplicatedPosts.length === 1 ? '' : 's'} in total. ` +
        `Need at least ${MIN_POSTS_REQUIRED} posts for analysis.`,
        filteredPosts.length,
        MIN_POSTS_REQUIRED,
        'very_few_posts',
        deduplicatedPosts.length
      );
    }

    // Scenario 2: Enough posts but filtered out due to date constraints
    let message = `Few posts after filtering. Found ${filteredPosts.length} eligible post${filteredPosts.length === 1 ? '' : 's'} ` +
      `(need ${MIN_POSTS_REQUIRED}). `;

    if (tooOldCount > 0) {
      message += `${tooOldCount} post${tooOldCount === 1 ? ' is' : 's are'} older than 60 days. `;
    }
    if (tooRecentCount > 0) {
      message += `${tooRecentCount} post${tooRecentCount === 1 ? ' is' : 's are'} newer than 24 hours. `;
    }
    message += `Try again later when more posts are eligible.`;

    throw new InsufficientDataError(
      message,
      filteredPosts.length,
      MIN_POSTS_REQUIRED,
      'filtered_posts',
      deduplicatedPosts.length,
      tooOldCount,
      tooRecentCount
    );
  }

  // Calculate engagement for all posts
  const postsWithEngagement = filteredPosts.map(post => ({
    ...post,
    engagement: calculateEngagement(post.like_count, post.comment_count, followersCount),
  }));

  // Calculate medians
  const likesValues = postsWithEngagement.map(p => p.like_count);
  const commentsValues = postsWithEngagement.map(p => p.comment_count);
  const viewsValues = postsWithEngagement.filter(p => p.view_count !== null).map(p => p.view_count!);
  const engagementValues = postsWithEngagement.map(p => p.engagement);

  const medianLikes = calculateMedian(likesValues);
  const medianComments = calculateMedian(commentsValues);
  const medianViews = calculateMedian(viewsValues);
  const medianEngagement = calculateMedian(engagementValues);

  // Identify negative outliers
  const negativeOutlierThreshold = Math.max(
    NEGATIVE_OUTLIER_MIN_ENGAGEMENT,
    NEGATIVE_OUTLIER_THRESHOLD * medianEngagement
  );

  const negativeOutliers = postsWithEngagement.filter(p => p.engagement < negativeOutlierThreshold);

  // Calculate how many negative outliers to remove
  const maxOutlierRemovals = Math.min(
    NEGATIVE_OUTLIER_MAX_REMOVALS,
    Math.floor(filteredPosts.length * NEGATIVE_OUTLIER_MAX_PERCENTAGE)
  );

  // Sort negative outliers by engagement (lowest first) and mark for removal
  const sortedNegativeOutliers = negativeOutliers
    .sort((a, b) => a.engagement - b.engagement)
    .slice(0, maxOutlierRemovals)
    .map(p => p.id);

  // Identify viral posts (views > 3x median OR engagement > 3x median)
  const postsWithFlags = postsWithEngagement.map(post => {
    const isViralViews = post.view_count !== null && post.view_count > (VIRAL_MULTIPLIER * medianViews);
    const isViralEngagement = post.engagement > (VIRAL_MULTIPLIER * medianEngagement);
    const isViral = isViralViews || isViralEngagement;
    const isNegativeOutlier = sortedNegativeOutliers.includes(post.id);

    return {
      ...post,
      isViral,
      isNegativeOutlier,
    };
  });

  // Remove negative outliers
  const postsAfterNegativeRemoval = postsWithFlags.filter(p => !p.isNegativeOutlier);

  // Calculate general metrics (after negative outlier removal)
  const generalPosts = postsAfterNegativeRemoval;
  const generalAvgLikes = generalPosts.reduce((sum, p) => sum + p.like_count, 0) / generalPosts.length;
  const generalAvgComments = generalPosts.reduce((sum, p) => sum + p.comment_count, 0) / generalPosts.length;
  const generalAvgViews = generalPosts.filter(p => p.view_count !== null).length > 0
    ? generalPosts.filter(p => p.view_count !== null).reduce((sum, p) => sum + p.view_count!, 0) /
      generalPosts.filter(p => p.view_count !== null).length
    : 0;
  const generalEngagementRate = calculateEngagement(generalAvgLikes, generalAvgComments, followersCount);

  // Identify viral posts for typical calculation
  const viralPosts = postsAfterNegativeRemoval.filter(p => p.isViral);

  // Cap viral posts at 3x median for typical metrics
  const postsForTypical = postsAfterNegativeRemoval.map(post => {
    if (post.isViral) {
      return {
        ...post,
        like_count: Math.min(post.like_count, VIRAL_MULTIPLIER * medianLikes),
        comment_count: Math.min(post.comment_count, VIRAL_MULTIPLIER * medianComments),
        view_count: post.view_count !== null
          ? Math.min(post.view_count, VIRAL_MULTIPLIER * medianViews)
          : null,
      };
    }
    return post;
  });

  // Calculate typical metrics (with viral cap)
  const typicalAvgLikes = postsForTypical.reduce((sum, p) => sum + p.like_count, 0) / postsForTypical.length;
  const typicalAvgComments = postsForTypical.reduce((sum, p) => sum + p.comment_count, 0) / postsForTypical.length;
  const typicalAvgViews = postsForTypical.filter(p => p.view_count !== null).length > 0
    ? postsForTypical.filter(p => p.view_count !== null).reduce((sum, p) => sum + p.view_count!, 0) /
      postsForTypical.filter(p => p.view_count !== null).length
    : 0;
  const typicalEngagementRate = calculateEngagement(typicalAvgLikes, typicalAvgComments, followersCount);

  // Calculate viral post statistics
  const viralPostsCount = viralPosts.length;
  const viralPostsAvgViews = viralPosts.filter(p => p.view_count !== null).length > 0
    ? viralPosts.filter(p => p.view_count !== null).reduce((sum, p) => sum + p.view_count!, 0) /
      viralPosts.filter(p => p.view_count !== null).length
    : 0;
  const viralPostsAvgEngagement = viralPosts.length > 0
    ? viralPosts.reduce((sum, p) => sum + p.engagement, 0) / viralPosts.length
    : 0;

  // ============================================
  // VIDEO-ONLY METRICS (Reels only)
  // ============================================

  // Filter only video posts (type === 'Video' or has view_count)
  const videoPostsAfterNegativeRemoval = postsAfterNegativeRemoval.filter(p =>
    p.type === 'Video' || p.view_count !== null
  );

  // General video engagement rate
  const generalVideoAvgLikes = videoPostsAfterNegativeRemoval.length > 0
    ? videoPostsAfterNegativeRemoval.reduce((sum, p) => sum + p.like_count, 0) / videoPostsAfterNegativeRemoval.length
    : 0;
  const generalVideoAvgComments = videoPostsAfterNegativeRemoval.length > 0
    ? videoPostsAfterNegativeRemoval.reduce((sum, p) => sum + p.comment_count, 0) / videoPostsAfterNegativeRemoval.length
    : 0;
  const generalVideoEngagementRate = videoPostsAfterNegativeRemoval.length > 0
    ? calculateEngagement(generalVideoAvgLikes, generalVideoAvgComments, followersCount)
    : 0;

  // Typical video engagement rate (with viral cap)
  const videoPostsForTypical = videoPostsAfterNegativeRemoval.map(post => {
    if (post.isViral) {
      return {
        ...post,
        like_count: Math.min(post.like_count, VIRAL_MULTIPLIER * medianLikes),
        comment_count: Math.min(post.comment_count, VIRAL_MULTIPLIER * medianComments),
      };
    }
    return post;
  });

  const typicalVideoAvgLikes = videoPostsForTypical.length > 0
    ? videoPostsForTypical.reduce((sum, p) => sum + p.like_count, 0) / videoPostsForTypical.length
    : 0;
  const typicalVideoAvgComments = videoPostsForTypical.length > 0
    ? videoPostsForTypical.reduce((sum, p) => sum + p.comment_count, 0) / videoPostsForTypical.length
    : 0;
  const typicalVideoEngagementRate = videoPostsForTypical.length > 0
    ? calculateEngagement(typicalVideoAvgLikes, typicalVideoAvgComments, followersCount)
    : 0;

  // Post type breakdown
  const imagePosts = postsAfterNegativeRemoval.filter(p => p.type === 'Image' || p.type === 'Carousel');
  const videoPostsType = postsAfterNegativeRemoval.filter(p => p.type === 'Video' || p.view_count !== null);
  const postTypeBreakdown = {
    imageCount: imagePosts.length,
    videoCount: videoPostsType.length,
    totalCount: postsAfterNegativeRemoval.length,
  };

  // Format post details for response
  const formattedPosts = postsWithFlags.map(post => ({
    id: post.id,
    shortcode: post.shortcode,
    type: post.type,
    date: post.date,
    likes: post.like_count,
    comments: post.comment_count,
    views: post.view_count,
    engagement: post.engagement,
    isViral: post.isViral,
    isNegativeOutlier: post.isNegativeOutlier,
    url: post.post_url,
  }));

  return {
    username: cleanUsername,
    followers: followersCount,
    totalPostsFetched: deduplicatedPosts.length,
    postsAnalyzed: postsAfterNegativeRemoval.length,
    postsFiltered: {
      tooRecent: tooRecentCount,
      tooOld: tooOldCount,
      negativeOutliers: sortedNegativeOutliers.length,
    },
    postTypeBreakdown,
    avgLikes: Math.round(generalAvgLikes * 100) / 100,
    avgComments: Math.round(generalAvgComments * 100) / 100,
    avgViews: Math.round(generalAvgViews * 100) / 100,
    generalEngagementRate: Math.round(generalEngagementRate * 100) / 100,
    typicalAvgLikes: Math.round(typicalAvgLikes * 100) / 100,
    typicalAvgComments: Math.round(typicalAvgComments * 100) / 100,
    typicalAvgViews: Math.round(typicalAvgViews * 100) / 100,
    typicalEngagementRate: Math.round(typicalEngagementRate * 100) / 100,
    generalVideoEngagementRate: Math.round(generalVideoEngagementRate * 100) / 100,
    typicalVideoEngagementRate: Math.round(typicalVideoEngagementRate * 100) / 100,
    viralPostsCount,
    viralPostsAvgViews: Math.round(viralPostsAvgViews * 100) / 100,
    viralPostsAvgEngagement: Math.round(viralPostsAvgEngagement * 100) / 100,
    medianLikes: Math.round(medianLikes * 100) / 100,
    medianComments: Math.round(medianComments * 100) / 100,
    medianViews: Math.round(medianViews * 100) / 100,
    medianEngagement: Math.round(medianEngagement * 100) / 100,
    posts: formattedPosts,
    reportUpdatedAt: new Date().toISOString(),
    dataSource: 'posts',
    url: `https://www.instagram.com/${cleanUsername}/`,
    profilePicUrl,
    profilePicBase64,
  };
}
