// ============================================
// INSTAGRAM REPORT CARD COMPONENT (ALTERNATIVE DATA SOURCE)
// ============================================

import type { InstagramAnalyticsAlt } from '../types';
import { Users, Heart, MessageCircle, Eye, TrendingUp, ExternalLink, Lock, CheckCircle, Film, Image as ImageIcon, Pin } from 'lucide-react';

interface InstagramReportCardAltProps {
  analytics: InstagramAnalyticsAlt;
  fromCache?: boolean;
}

export default function InstagramReportCardAlt({ analytics, fromCache }: InstagramReportCardAltProps) {
  const {
    username,
    fullName,
    bio,
    isVerified,
    isPrivate,
    followers,
    follows,
    postsCount,
    averageLikes,
    averageComments,
    averageViews,
    engagementRate,
    profilePicBase64,
    externalUrl,
    businessCategoryName,
    isBusinessAccount,
    popularPosts,
  } = analytics;

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Convert decimal to percentage
  const toPercent = (value: number) => (value * 100).toFixed(2);

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Profile Picture (Base64) */}
          {profilePicBase64 && (
            <img
              src={profilePicBase64}
              alt={`${username} profile`}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">@{username}</h3>
              {isVerified && (
                <svg aria-label="Verified" fill="rgb(0, 149, 246)" height="16" role="img" viewBox="0 0 40 40" width="16">
                  <title>Verified</title>
                  <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path>
                </svg>
              )}
              {isPrivate && (
                <Lock className="w-4 h-4 text-yellow-500" title="Private Account" />
              )}
              {isBusinessAccount && (
                <CheckCircle className="w-4 h-4 text-blue-500" title="Business Account" />
              )}
            </div>
            <p className="text-white font-medium">{fullName}</p>
            <div className="flex items-center gap-2 mt-1">
              {fromCache && (
                <span className="text-xs text-gray-500">Cached data</span>
              )}
              <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                Alt Data Source
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{bio}</p>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{externalUrl}</span>
            </a>
          )}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Followers"
          value={formatNumber(followers)}
          color="text-pink-500"
        />
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Following"
          value={formatNumber(follows)}
          color="text-blue-500"
        />
        <MetricCard
          icon={<ImageIcon className="w-5 h-5" />}
          label="Posts"
          value={formatNumber(postsCount)}
          color="text-green-500"
        />
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-red-500">
            <Heart className="w-4 h-4" />
            <span className="text-xs text-gray-400">Avg Likes</span>
          </div>
          <p className="text-white font-black text-xl">{formatNumber(averageLikes)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-blue-500">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs text-gray-400">Avg Comments</span>
          </div>
          <p className="text-white font-black text-xl">{formatNumber(averageComments)}</p>
        </div>
        {averageViews > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2 text-purple-500">
              <Eye className="w-4 h-4" />
              <span className="text-xs text-gray-400">Avg Views</span>
            </div>
            <p className="text-white font-black text-xl">{formatNumber(averageViews)}</p>
          </div>
        )}
      </div>

      {/* Engagement Rate */}
      <div className="bg-gradient-to-r from-[#00D9FF]/10 to-transparent rounded-xl p-4 border border-[#00D9FF]/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00D9FF]" />
            <span className="text-white font-medium">Engagement Rate</span>
          </div>
          <span className="text-2xl font-black text-[#00D9FF]">
            {toPercent(engagementRate)}%
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Calculated from recent posts
        </p>
      </div>

      {/* Business Info */}
      {businessCategoryName && (
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
          <p className="text-sm text-gray-400">Business Category</p>
          <p className="text-white font-semibold">{businessCategoryName}</p>
        </div>
      )}

      {/* Recent Posts as List */}
      {popularPosts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Recent Posts
          </h4>
          <div className="space-y-2">
            {popularPosts.slice(0, 10).map((post) => (
              <a
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white/5 rounded-xl border border-white/10 hover:border-[#00D9FF]/30 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.isPinned && (
                      <Pin className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    )}
                    {post.isVideo ? (
                      <Film className="w-4 h-4 text-purple-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {post.text && (
                      <p className="text-gray-300 text-sm line-clamp-2 mb-2">{post.text}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatDate(post.timestamp)}</span>
                      {post.isPinned && (
                        <span className="text-yellow-500 font-medium">Pinned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-red-400">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm font-semibold">{formatNumber(post.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-400">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">{formatNumber(post.comments)}</span>
                    </div>
                    {post.isVideo && post.videoViews && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-semibold">{formatNumber(post.videoViews)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
      <div className={`flex items-center gap-2 mb-1 ${color}`}>
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-white font-black text-lg">{value}</p>
    </div>
  );
}
