// ============================================
// INFLUENCER CARD COMPONENT
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa';
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

  const totalFollowers = profile.socialMediaLinks.reduce((sum, link) => sum + (link.followerCount || 0), 0);

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
        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#B8FF00]/50 transition-all cursor-pointer group"
      >
        <div className="flex items-start gap-6">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            <img
              src={imageError ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}` : profile.profileImage}
              alt={profile.displayName}
              onError={() => setImageError(true)}
              className="w-20 h-20 rounded-xl object-cover"
            />
            {/* Badges */}
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              {isVerified && (
                <div className="w-6 h-6 bg-[#B8FF00] rounded-full flex items-center justify-center" title="Verified">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {isTrusted && (
                <div className="w-6 h-6 bg-[#00D9FF] rounded-full flex items-center justify-center" title="Trusted">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {onToggleFavorite && (
              <button
                onClick={handleFavoriteClick}
                className="absolute -top-2 -right-2 w-8 h-8 bg-[#0a0a0a]/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  className={`w-4 h-4 ${isFavorite ? 'text-red-400 fill-red-400' : 'text-gray-400'}`}
                  fill={isFavorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
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
                </div>
                <p className="text-gray-400 text-sm line-clamp-2 mb-2">{profile.bio}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              {/* Followers */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-gray-400">{formatFollowers(totalFollowers)} followers</span>
              </div>

              {/* Rating */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-gray-400">{avgRating.toFixed(1)}</span>
                  <span className="text-gray-500">({totalReviews})</span>
                </div>
              )}

              {/* Completed Projects */}
              {completedProjects > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-400">{completedProjects} completed</span>
                </div>
              )}
            </div>

            {/* Categories & Location */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{profile.location || 'Remote'}</span>
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
      {/* Cover Image / Profile */}
      <div className="relative h-40 bg-gradient-to-br from-[#B8FF00]/20 to-[#00D9FF]/20">
        <img
          src={imageError ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}` : profile.profileImage}
          alt={profile.displayName}
          onError={() => setImageError(true)}
          className="absolute -bottom-12 left-6 w-24 h-24 rounded-2xl border-4 border-[#0a0a0a] object-cover"
        />
        {/* Badges */}
        <div className="absolute bottom-2 left-28 flex gap-1">
          {isVerified && (
            <div className="w-6 h-6 bg-[#B8FF00] rounded-full flex items-center justify-center" title="Verified">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {isTrusted && (
            <div className="w-6 h-6 bg-[#00D9FF] rounded-full flex items-center justify-center" title="Trusted">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-4 right-4 w-10 h-10 bg-[#0a0a0a]/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg
              className={`w-5 h-5 ${isFavorite ? 'text-red-400 fill-red-400' : 'text-gray-400'}`}
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="pt-14 pb-5 px-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold truncate">{profile.displayName}</h3>
          <span className="text-gray-500 text-sm truncate">{profile.username}</span>
        </div>

        <p className="text-gray-400 text-sm line-clamp-2 mb-3 min-h-[40px]">{profile.bio}</p>

        {/* Social Media Links */}
        <div className="flex items-center gap-2 mb-3">
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
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{profile.location || 'Remote'}</span>
          </div>
          {completedProjects > 0 && (
            <span className="text-gray-500">{completedProjects} projects</span>
          )}
        </div>
      </div>
    </div>
  );
}
