// ============================================
// APIFY CLIENT SERVICE
// ============================================

import { ApifyClient } from 'apify';
import { APIFY_CONFIG, ERRORS } from './config';

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
