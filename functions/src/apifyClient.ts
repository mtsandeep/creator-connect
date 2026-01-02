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
