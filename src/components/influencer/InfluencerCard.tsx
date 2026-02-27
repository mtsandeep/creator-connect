// ============================================
// INFLUENCER CARD COMPONENT
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa';
import { LuStar, LuCircleCheck, LuHeart, LuMapPin } from 'react-icons/lu';
import { MdVerified, MdVerifiedUser } from 'react-icons/md';
import type { InfluencerProfile } from '../../types';

interface InfluencerCardProps {
  uid: string;
  profile: InfluencerProfile;
  avgRating: number;
  totalReviews: number;
  completedProjects?: number;
  isVerified?: boolean;
  isTrusted?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (uid: string) => void;
  viewMode?: 'grid' | 'list';
}

export default function InfluencerCard({
  uid,
  profile,
  avgRating,
  totalReviews,
  completedProjects = 0,
  isVerified = false,
  isTrusted = false,
  isFavorite = false,
  onToggleFavorite,
  viewMode = 'grid',
}: InfluencerCardProps) {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <FaInstagram className="w-4 h-4 text-pink-500" />;
      case 'youtube':
        return <FaYoutube className="w-4 h-4 text-red-600" />;
      case 'facebook':
        return <FaFacebook className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(uid);
  };

  const handleCardClick = () => {
    navigate(`/influencers/${uid}`);
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 hover:border-[#B8FF00]/50 transition-all cursor-pointer group"
      >
        <div className="flex items-start gap-4">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            <img
              src={imageError ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}` : profile.profileImage}
              alt={profile.displayName}
              onError={() => setImageError(true)}
              className="w-26 h-26 rounded-xl object-cover"
            />
            {onToggleFavorite && (
              <button
                onClick={handleFavoriteClick}
                className="absolute -top-2 -right-2 w-8 h-8 bg-[#0a0a0a]/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <LuHeart className={`w-4 h-4 ${isFavorite ? 'text-red-400 fill-red-400' : 'text-gray-400'}`} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold truncate">{profile.displayName}</h3>
                  <span className="text-gray-500 text-sm truncate">{profile.username}</span>
                  {isVerified && (
                    <MdVerified className="w-4 h-4 text-green-400 flex-shrink-0" title="Verified Influencer" />
                  )}
                  {isTrusted && (
                    <MdVerifiedUser className="w-4 h-4 text-[#00D9FF] flex-shrink-0" title="Trusted Influencer" />
                  )}
                </div>
                <p className="text-gray-400 text-sm line-clamp-2 mb-2">{profile.bio}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              {/* Social Media */}
            <div className="flex items-center gap-3 flex-wrap">
              {profile.socialMediaLinks.map((link, index) => {
                const icon = getSocialIcon(link.platform);
                if (!icon || !link.followerCount) return null;
                
                return (
                  <div key={index} className="flex items-center gap-1">
                    {icon}
                    <span className="text-gray-500 text-xs capitalize">{link.platform}</span>
                    <span className="text-gray-400 text-sm">{formatFollowers(link.followerCount)}</span>
                  </div>
                );
              })}
            </div>

              {/* Rating */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <LuStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-gray-400">{avgRating.toFixed(1)}</span>
                  <span className="text-gray-500">({totalReviews})</span>
                </div>
              )}

              {/* Completed Projects */}
              {completedProjects > 0 && (
                <div className="flex items-center gap-1">
                  <LuCircleCheck className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">{completedProjects} completed</span>
                </div>
              )}
            </div>

            {/* Categories & Location */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <LuMapPin className="w-4 h-4" />
                <span>{profile.location || 'On the web'}</span>
              </div>
              <div className="flex items-center gap-1">
                {profile.categories.slice(0, 3).map((cat) => (
                  <span key={cat} className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded-md">
                    {cat}
                  </span>
                ))}
                {profile.categories.length > 3 && (
                  <span className="text-gray-500 text-xs">+{profile.categories.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={handleCardClick}
      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-[#B8FF00]/50 transition-all cursor-pointer group"
    >
      {/* Profile Image */}
      <div className="relative px-4 py-2 bg-[#0a0a0a]">
        <img
          src={imageError ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}` : profile.profileImage}
          alt={profile.displayName}
          onError={() => setImageError(true)}
          className="w-26 h-26 rounded-2xl object-cover mx-auto"
        />
        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-1">
          {isVerified && (
            <div className="w-5 h-5 bg-[#0a0a0a]/90 rounded-full flex items-center justify-center" title="Verified Influencer">
              <MdVerified className="w-4 h-4 text-green-400" />
            </div>
          )}
          {isTrusted && (
            <div className="w-5 h-5 bg-[#0a0a0a]/90 rounded-full flex items-center justify-center" title="Trusted Influencer">
              <MdVerifiedUser className="w-4 h-4 text-[#00D9FF]" />
            </div>
          )}
        </div>
        {onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-4 left-4 w-10 h-10 bg-[#0a0a0a]/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <LuHeart className={`w-5 h-5 ${isFavorite ? 'text-red-400 fill-red-400' : 'text-gray-400'}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="pb-3 px-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold truncate">{profile.displayName}</h3>
          <span className="text-gray-500 text-sm truncate">{profile.username}</span>
        </div>
        <p className="text-gray-400 text-sm line-clamp-2 mb-2">{profile.bio}</p>

        {/* Social Media Links */}
        <div className="flex items-center gap-2 mb-2">
          {profile.socialMediaLinks
            .filter((link) => link.followerCount > 0)
            .slice(0, 3)
            .map((link) => (
              <div key={link.platform} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg">
                {getSocialIcon(link.platform)}
                <span className="text-gray-400 text-xs">{formatFollowers(link.followerCount)}</span>
              </div>
            ))}
        </div>

        {/* Rating */}
        {totalReviews > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <LuStar
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                />
              ))}
            </div>
            <span className="text-gray-400 text-sm">{avgRating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({totalReviews} reviews)</span>
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5">
          {profile.categories.slice(0, 3).map((cat) => (
            <span key={cat} className="px-2 py-1 bg-[#B8FF00]/10 text-[#B8FF00] text-xs rounded-md">
              {cat}
            </span>
          ))}
          {profile.categories.length > 3 && (
            <span className="text-gray-500 text-xs px-2 py-1">+{profile.categories.length - 3} more</span>
          )}
        </div>

        {/* Location & Projects */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <LuMapPin className="w-4 h-4" />
            <span>{profile.location || 'On the web'}</span>
          </div>
          {completedProjects > 0 && (
            <span className="text-gray-500">{completedProjects} projects</span>
          )}
        </div>
      </div>
    </div>
  );
}
