import React from 'react';
import { IoLogoInstagram, IoLogoYoutube, IoLogoFacebook } from 'react-icons/io5';
import { Check, AlertCircle, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import { InstagramCard } from './instagram';
import RandomBalls from './loading/RandomBalls';
import type { InstagramAnalytics, InstagramAnalyticsAlt } from '../types';

const PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: IoLogoInstagram,
    color: 'text-pink-500',
    urlPrefix: 'instagram.com/',
    placeholder: 'username'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: IoLogoYoutube,
    color: 'text-red-500',
    urlPrefix: 'youtube.com/@',
    placeholder: 'channelname'
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: IoLogoFacebook,
    color: 'text-blue-500',
    urlPrefix: 'facebook.com/',
    placeholder: 'page-or-profile'
  }
];

interface SocialMediaSectionProps {
  // For both signup and profile
  socialMediaLinks: Array<{
    platform: string;
    url: string;
    followerCount: number;
  }>;
  selectedPlatforms: string[];
  onPlatformToggle: (platformId: string) => void;
  onSocialMediaChange: (index: number, field: string, value: any) => void;

  // For signup only
  fetchingStatus?: Record<string, boolean>;
  fetchError?: Record<string, string>;
  manuallyEnteredFollowers?: Record<string, boolean>;
  instagramAnalytics?: InstagramAnalytics | InstagramAnalyticsAlt;
  isInstagramReportExpanded?: boolean;
  setIsInstagramReportExpanded?: (expanded: boolean) => void;
  onSocialMediaBlur?: (index: number, platform: string, value: string) => void;

  // For profile edit mode - strip URL prefix for display
  stripUrlPrefix?: (platform: string, fullUrl: string) => string;
}

export default function SocialMediaSection({
  socialMediaLinks,
  selectedPlatforms,
  onPlatformToggle,
  onSocialMediaChange,
  fetchingStatus = {},
  fetchError = {},
  manuallyEnteredFollowers = {},
  instagramAnalytics,
  isInstagramReportExpanded = false,
  setIsInstagramReportExpanded,
  onSocialMediaBlur,
  stripUrlPrefix
}: SocialMediaSectionProps) {
  return (
    <>
      {/* Platform Selection Checkboxes */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatforms.includes(platform.id);
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => onPlatformToggle(platform.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                ? 'bg-[#00D9FF]/10 border-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className={`text-4xl ${isSelected ? platform.color : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {platform.label}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#00D9FF] bg-[#00D9FF]' : 'border-gray-600'
                  }`}>
                  {isSelected && (
                    <Check className="w-3 h-3 text-gray-900" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Platforms Input Fields */}
      {selectedPlatforms.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-gray-400">Enter details for your selected platforms</p>
          {socialMediaLinks
            .filter(link => selectedPlatforms.includes(link.platform))
            .map((link) => {
              const originalIndex = socialMediaLinks.findIndex(l => l.platform === link.platform);
              const platform = PLATFORMS.find(p => p.id === link.platform);
              if (!platform) return null;
              const Icon = platform.icon;

              const platformCard = (
                <div key={link.platform} className="p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={`text-2xl ${platform.color}`} />
                    <span className="text-white font-medium">{platform.label}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-white text-sm whitespace-nowrap sm:whitespace-normal">https://{platform.urlPrefix}</span>
                        <input
                          type="text"
                          value={stripUrlPrefix ? stripUrlPrefix(link.platform, link.url) : link.url}
                          onChange={(e) => onSocialMediaChange(originalIndex, 'url', e.target.value)}
                          onBlur={(e) => onSocialMediaBlur?.(originalIndex, link.platform, e.target.value)}
                          placeholder={platform.placeholder}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                        />
                      </div>
                      {link.followerCount > 0 && !fetchError[link.platform] && !manuallyEnteredFollowers[link.platform] && (
                        <p className="text-xs text-[#00D9FF] mt-1.5 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Fetched {link.followerCount.toLocaleString()} followers
                        </p>
                      )}
                    </div>

                    <input
                      type="number"
                      value={link.followerCount || ''}
                      onChange={(e) => onSocialMediaChange(originalIndex, 'followerCount', parseInt(e.target.value) || 0)}
                      placeholder={platform.id === 'youtube' ? 'Subscriber count' : 'Follower count'}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                    />
                    {fetchingStatus[link.platform] && (
                      <div className="text-xs text-gray-400 mt-1.5 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-500 border-t-transparent"></div>
                        Fetching {platform.id === 'youtube' ? 'subscribers' : 'followers'}...
                      </div>
                    )}
                    {fetchError[link.platform] && !fetchingStatus[link.platform] && (
                      <div className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fetchError[link.platform]}
                      </div>
                    )}
                  </div>
                </div>
              );

              // Add Instagram analytics report right after Instagram section
              if (link.platform === 'instagram' && setIsInstagramReportExpanded) {
                return (
                  <React.Fragment key={`${link.platform}-analytics`}>
                    {platformCard}
                    <div className="mt-4">
                      <button
                        onClick={() => setIsInstagramReportExpanded(!isInstagramReportExpanded)}
                        className={`w-full flex items-center justify-between text-white font-semibold p-3 hover:bg-white/5 rounded-xl transition-colors ${fetchingStatus.instagram ? 'instagram-border pr-0' : ''}`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <BarChart3 className="w-5 h-5 text-[#00D9FF]" />
                          <span className="flex-shrink-0">Instagram Analytics Report</span>
                          {fetchingStatus.instagram && (
                            <div className="flex-1 relative overflow-hidden -my-3 py-6">
                              <RandomBalls
                                count={24}
                                colors={['#f58529', '#dd2a7b', '#8134af']}
                                minSize={6}
                                maxSize={20}
                                minDuration={3}
                                maxDuration={6}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {instagramAnalytics && !fetchingStatus.instagram && (isInstagramReportExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          ))}
                          {!instagramAnalytics && !fetchingStatus.instagram && (
                            <span className="text-xs text-gray-400">Edit/click instagram username to see report</span>
                          )}
                        </div>
                      </button>
                      {isInstagramReportExpanded && !fetchingStatus.instagram && instagramAnalytics && (
                        <div className="mt-4">
                          <InstagramCard analytics={instagramAnalytics as InstagramAnalytics | InstagramAnalyticsAlt} fromCache={(instagramAnalytics as any).fromCache} />
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              }

              return platformCard;
            })}
        </div>
      )}
    </>
  );
}