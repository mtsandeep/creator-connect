# Firebase Cloud Functions Setup Guide

This project includes Firebase Cloud Functions for automatically fetching follower/subscriber counts from social media platforms using Apify.

## Features

- **Auto-fetch follower counts** from Instagram, YouTube, and Facebook
- **Rate limiting**: 5 API calls per platform per user (24-hour window)
- **Smart caching**: Results cached for 1 hour
- **Batch processing**: Fetch multiple profiles at once (max 10)
- **Visual feedback**: Loading spinners and success indicators in the UI

## Prerequisites

1. **Apify Account**
   - Sign up at https://console.apify.com/
   - Get your API key from Settings > Integrations

2. **Firebase Project**
   - Ensure your Firebase project has the Blaze (Pay as you go) plan (required for Cloud Functions)

## Setup Instructions

### 1. Install Functions Dependencies

```bash
cd functions
npm install
```

### 2. Configure Apify API Key

**Local Development:**
Create a `.env` file in the `functions/` directory:

```bash
cd functions
echo "APIFY_API_KEY=your_actual_api_key_here" > .env
```

Or copy the example file:
```bash
cp .env.example .env
# Edit .env and add your API key
```

**CI/CD (GitHub Actions):**
Set `APIFY_API_KEY` in your GitHub repository secrets:
1. Go to repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `APIFY_API_KEY`
4. Value: Your Apify API key from https://console.apify.com/

### 3. Deploy Firestore Rules

Update your Firestore security rules to include the new collections:

```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Cloud Functions

```bash
# From project root
firebase deploy --only functions
```

### 5. Verify Deployment

Check that functions are deployed in Firebase Console:
https://console.firebase.google.com/project/creator-connect-c19ba/functions

## Available Functions

### `fetchFollowerCountFunction`
Fetch follower count for a single social media profile.

**Usage:**
```typescript
const result = await fetchFollowerCount('instagram', 'username');
```

**Returns:**
```typescript
{
  platform: string,
  username: string,
  followerCount: number,
  profileUrl: string,
  displayName: string,
  verified: boolean
}
```

### `fetchMultipleFollowerCountsFunction`
Batch fetch multiple profiles (max 10).

**Usage:**
```typescript
const results = await fetchMultipleFollowerCounts([
  { platform: 'instagram', username: 'user1' },
  { platform: 'youtube', username: 'user2' },
  { platform: 'facebook', username: 'page3' }
]);
```

### `getRateLimitStatusFunction`
Check current rate limit status for the user.

**Usage:**
```typescript
const status = await getRateLimitStatus('instagram');
// Returns: { remaining: number, resetAt: number }
```

## Rate Limiting

- **5 calls per platform per user** per 24 hours
- Rate limit data stored in `rateLimits` collection
- Users can check their remaining quota anytime
- Limits reset after 24 hours from first call

## Caching

- Fetched data cached in `apiCache` collection
- Cache duration: 1 hour
- Reduces API costs and improves performance
- Automatic cache invalidation after expiry

## Frontend Integration

The auto-fetch feature is already integrated into the Influencer Signup form:

1. User types their username (e.g., "johnsmith")
2. System automatically fetches follower count from social media
3. Shows loading spinner while fetching
4. Displays success message with fetched count
5. User can still manually edit the count if needed

## Firestore Collections

### `rateLimits`
Tracks API usage per user/platform:
- `userId`: User's Firebase UID
- `platform`: Social platform name
- `count`: Number of API calls made
- `resetAt`: When the counter resets (24h window)
- `lastCallAt`: Timestamp of last API call

### `apiCache`
Caches fetched data to reduce API calls:
- `platform`: Social platform name
- `username`: Profile username
- `followerCount`: Fetched follower count
- `profileUrl`: Profile URL
- `displayName`: Profile display name
- `verified`: Verification status
- `cachedAt`: When data was cached

## Testing Locally

Use Firebase emulator for local testing:

```bash
firebase emulators:start
```

The functions will be available at `http://localhost:5001`

## Monitoring

Monitor your functions in Firebase Console:
- Functions > Logs: View execution logs
- Functions > Usage: Check invocation counts
- Apify Console: Monitor API quota and usage

## Cost Optimization

- Rate limiting prevents abuse
- Caching reduces redundant API calls
- Consider upgrading Apify plan for higher quotas
- Monitor usage in Firebase and Apify consoles

## Troubleshooting

**"Apify API key not configured"**
- Run: `firebase functions:config:get apify`
- Ensure API key is set

**"Rate limit exceeded"**
- Wait for 24-hour window to reset
- Or reset manually from Firestore Console (admin only)

**Profile not found**
- Verify username is correct
- Check if profile is public
- Some platforms may have restrictions

## Security Notes

- All functions require authentication
- Functions run with admin privileges
- Rate limiting enforced server-side
- Users cannot bypass rate limits

## Support

For issues or questions:
1. Check Firebase Functions logs
2. Check Apify dashboard
3. Review Firestore rules
4. Verify API key configuration
