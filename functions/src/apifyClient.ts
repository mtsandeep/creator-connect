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

/**
 * Fetch Instagram profile data using Apify
 */
async function fetchInstagramData(username: string): Promise<FollowerData> {
  const client = getApifyClient();

  const input = {
    directUrls: [`https://www.instagram.com/${username}/`],
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
    followerCount: (channel.subscriberCount as number) || 0,
    profileUrl: channel.url as string,
    displayName: channel.title as string,
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

  return {
    platform: 'facebook',
    username,
    followerCount: (page.followersCount as number) || (page.likesCount as number) || 0,
    profileUrl: page.url as string,
    displayName: page.name as string,
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
