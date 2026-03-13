// ============================================
// AVATAR UTILITY FUNCTIONS
// ============================================

import type { User } from '../types';

export type UserRole = 'promoter' | 'influencer';

/**
 * Get the appropriate DiceBear style based on user role
 * - Promoters: bottts-neutral (robot-style avatars)
 * - Influencers: initials (text-based avatars)
 */
function getDiceBearStyle(role: UserRole): string {
  return role === 'promoter' ? 'bottts-neutral' : 'initials';
}

/**
 * Generate a DiceBear avatar URL
 */
function getDiceBearAvatar(seed: string, role: UserRole): string {
  const style = getDiceBearStyle(role);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed || 'User')}`;
}

/**
 * Get avatar URL - returns uploaded avatar if available, otherwise DiceBear fallback
 *
 * @param user - Full user object (can be null/undefined for DiceBear fallback)
 * @param role - Required role ('promoter' | 'influencer')
 * @returns Avatar URL (uploaded or DiceBear)
 *
 * @example
 * // Promoter page
 * getAvatar(user, 'promoter')
 *
 * @example
 * // Influencer page
 * getAvatar(user, 'influencer')
 *
 * @example
 * // Handle null user with fallback
 * getAvatar(null, 'promoter')
 */
export function getAvatar(user: User | null | undefined, role: UserRole): string {
  if (!user) {
    return getDiceBearAvatar('User', role);
  }

  // Check for uploaded avatar based on role
  if (role === 'promoter' && user.promoterProfile?.logo) {
    return user.promoterProfile.logo;
  }

  if (role === 'influencer' && user.influencerProfile?.profileImage) {
    return user.influencerProfile.profileImage;
  }

  // Fallback to DiceBear
  // Promoters: use company name as seed (consistent bot)
  // Influencers: use displayName as seed (shows initials)
  const seed = role === 'promoter'
    ? user.promoterProfile?.name || user.uid || user.email || 'Promoter'
    : user.influencerProfile?.displayName || user.email || user.uid || 'User';

  return getDiceBearAvatar(seed, role);
}

/**
 * Get DiceBear avatar by seed string (when you don't have a user object)
 *
 * @param seed - String to generate avatar from (name, userId, etc.)
 * @param role - Required role ('promoter' | 'influencer')
 * @returns DiceBear avatar URL
 *
 * @example
 * // Use display name as seed
 * getAvatarBySeed(displayName, 'influencer')
 *
 * @example
 * // Fallback on image error
 * e.currentTarget.src = getAvatarBySeed(profile.name, 'promoter')
 */
export function getAvatarBySeed(seed: string, role: UserRole): string {
  return getDiceBearAvatar(seed, role);
}
