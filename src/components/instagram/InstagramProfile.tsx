// ============================================
// INSTAGRAM PROFILE COMPONENT
// Basic profile information
// ============================================

import type { InstagramAnalytics, InstagramAnalyticsAlt } from '../../types';
import { ExternalLink, Lock, CheckCircle } from 'lucide-react';

interface InstagramProfileProps {
  analytics: InstagramAnalytics | InstagramAnalyticsAlt;
  fromCache?: boolean;
}

export default function InstagramProfile({ analytics, fromCache }: InstagramProfileProps) {
  const isAlt = 'dataSource' in analytics && analytics.dataSource === 'alt';

  const profileData = {
    username: analytics.username,
    fullName: analytics.fullName,
    bio: analytics.bio,
    isVerified: analytics.isVerified,
    followers: analytics.followers,
    profilePicBase64: 'profilePicBase64' in analytics ? analytics.profilePicBase64 : undefined,
    url: analytics.url,
    // Alt-specific fields
    ...(isAlt && {
      isPrivate: (analytics as InstagramAnalyticsAlt).isPrivate,
      isBusinessAccount: (analytics as InstagramAnalyticsAlt).isBusinessAccount,
      externalUrl: (analytics as InstagramAnalyticsAlt).externalUrl,
    }),
  };

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
      {/* Header with Profile Picture and Basic Info */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Profile Picture */}
        {profileData.profilePicBase64 && (
          <img
            src={profileData.profilePicBase64}
            alt={`${profileData.username} profile`}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/20 flex-shrink-0 mx-auto sm:mx-0"
          />
        )}

        {/* User Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h3 className="text-md text-white">@{profileData.username}</h3>
            {profileData.isVerified && (
              <div title="Verified Account">
                <svg 
                  aria-label="Verified" 
                  fill="rgb(0, 149, 246)" 
                  height="18" 
                  role="img" 
                  viewBox="0 0 40 40" 
                  width="18"
                >
                  <title>Verified</title>
                  <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path>
                </svg>
              </div>
            )}
            {profileData.isPrivate && (
              <div title="Private Profile">
                <Lock className="w-4 h-4 text-yellow-500" />
              </div>
            )}
            {profileData.isBusinessAccount && (
              <div title="Business Account">
                <CheckCircle className="w-4 h-4 text-blue-500" />
              </div>
            )}
            {/* {isAlt && (
              <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                Alt Data
              </span>
            )} */}
          </div>
          <p className="text-white">{profileData.fullName}</p>

          {/* Badges */}
          {/* <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 flex-wrap">
            {fromCache && (
              <span className="text-xs text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full">
                Cached data
              </span>
            )}
          </div> */}
        </div>

        {/* Follower Count */}
        <div className="text-center sm:text-right flex-shrink-0">
          <div className="text-2xl font-black text-white">
            {formatNumber(profileData.followers)}
          </div>
          <p className="text-xs text-gray-400">Followers</p>
        </div>
      </div>

      {/* Bio */}
      {profileData.bio && (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-gray-300 text-sm whitespace-pre-wrap break-all">{profileData.bio}</p>
        </div>
      )}

      {/* Links */}
      <div className="flex items-center gap-3 flex-wrap">
        <a
          href={profileData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Instagram profile</span>
        </a>
      </div>
    </div>
  );
}
