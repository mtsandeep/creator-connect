// ============================================
// INSTAGRAM REPORT CARD COMPONENT
// ============================================

import type { InstagramAnalytics } from '../types';
import { Users, Heart, MessageCircle, Eye, TrendingUp } from 'lucide-react';
import { IoMdFemale, IoMdMale, IoIosPeople } from "react-icons/io";

interface InstagramReportCardProps {
  analytics: InstagramAnalytics;
  fromCache?: boolean;
}

export default function InstagramReportCard({ analytics, fromCache }: InstagramReportCardProps) {
  const {
    username,
    fullName,
    bio,
    isVerified,
    followers,
    averageLikes,
    averageComments,
    averageReelPlays,
    engagementRate,
    fakeFollowers,
    audienceCredibility,
    audienceTypes,
    audienceCountries,
    audienceCities,
    genderSplit,
  } = analytics;

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Convert decimal to percentage
  const toPercent = (value: number) => (value * 100).toFixed(2);

  // Get credibility color (score is 0-1, convert to 0-100)
  const getCredibilityColor = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get credibility label (score is 0-1, convert to 0-100)
  const getCredibilityLabel = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Poor';
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">@{username}</h3>
            {isVerified && (
              <svg aria-label="Verified" fill="rgb(0, 149, 246)" height="18" role="img" viewBox="0 0 40 40" width="18"><title>Verified</title><path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path></svg>
            )}
          </div>
          <p className="text-white font-medium">{fullName}</p>
          {fromCache && (
            <span className="text-xs text-gray-500 mt-1 block">Cached data</span>
          )}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black ${getCredibilityColor(audienceCredibility)}`}>
            {toPercent(audienceCredibility)}%
          </div>
          <p className="text-xs text-gray-400">Audience Credibility</p>
          <span className={`text-xs font-semibold ${getCredibilityColor(audienceCredibility)}`}>
            {getCredibilityLabel(audienceCredibility)}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Followers"
          value={formatNumber(followers)}
          color="text-pink-500"
        />
        <MetricCard
          icon={<Heart className="w-5 h-5" />}
          label="Avg Likes"
          value={formatNumber(averageLikes)}
          color="text-red-500"
        />
        <MetricCard
          icon={<MessageCircle className="w-5 h-5" />}
          label="Avg Comments"
          value={formatNumber(averageComments)}
          color="text-blue-500"
        />
        <MetricCard
          icon={<Eye className="w-5 h-5" />}
          label="Avg Reel Views"
          value={formatNumber(averageReelPlays)}
          color="text-purple-500"
        />
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
          Average engagement per post
        </p>
      </div>

      {/* Audience Quality Breakdown */}
      <div className="space-y-3">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <IoIosPeople className="w-5 h-5 text-yellow-500" />
          Audience Quality
        </h4>
        <ProgressBar
          label="Fake/Suspicious Followers"
          value={fakeFollowers * 100}
          color="bg-red-500"
        />
        <ProgressBar
          label="Real People"
          value={audienceTypes.realPeople * 100}
          color="bg-green-500"
        />
        <ProgressBar
          label="Influencers"
          value={audienceTypes.influencers * 100}
          color="bg-blue-500"
        />
        <ProgressBar
          label="Mass Followers"
          value={audienceTypes.massFollowers * 100}
          color="bg-yellow-500"
        />
      </div>

      {/* Gender Split */}
      {genderSplit.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Gender Distribution
          </h4>
          <div className="flex gap-4">
            {genderSplit.map((item) => (
              <div key={item.label} className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 capitalize flex items-center gap-1">
                    {item.label === 'male' ? (
                      <IoMdMale className="w-3 h-3" />
                    ) : (
                      <IoMdFemale className="w-3 h-3" />
                    )}
                    {item.label}
                  </span>
                  <span className="text-white font-semibold">{toPercent(item.value)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${item.value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Countries */}
      {audienceCountries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Top Audience Countries
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {audienceCountries.slice(0, 5).map((country) => (
              <div key={country.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{country.name}</span>
                <span className="text-white font-semibold">{toPercent(country.weight)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Cities */}
      {audienceCities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Top Audience Cities
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {audienceCities.slice(0, 5).map((city) => (
              <div key={city.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{city.name}</span>
                <span className="text-white font-semibold">{toPercent(city.weight)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {bio && (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{bio}</p>
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

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
}

function ProgressBar({ label, value, color }: ProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-semibold px-2 py-1 rounded-sm ${color}`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
