// ============================================
// DEMO: Brand Discover Flow - Step 1: Browse
// Simplified influencer search page for brands
// ============================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa';
import { LuSearch, LuMapPin, LuStar } from 'react-icons/lu';
import { MdVerified } from 'react-icons/md';
import * as Popover from '@radix-ui/react-popover';
import DemoLayout from '../../../components/demo/DemoLayout';
import { demoInfluencers, type DemoInfluencer } from '../../../data/demoData';

// Categories that match the demo influencers
const DEMO_CATEGORIES = [
  'Fashion',
  'Lifestyle',
  'Fitness',
  'Food',
  'Technology',
];

interface DemoFilters {
  followerRanges: string[];
  verifiedOnly: boolean;
  category: string | null;
}

const FOLLOWER_RANGES = [
  { id: '1K-10K', label: '1K - 10K', min: 1000, max: 10000 },
  { id: '10K-100K', label: '10K - 100K', min: 10000, max: 100000 },
  { id: '100K+', label: '100K+', min: 100000, max: Infinity },
];

const infoItems = [
  {
    icon: '1',
    title: 'Smart Filters',
    description: 'Brands can filter influencers by follower count, verification status, and content categories to find the perfect match.',
  },
  {
    icon: '2',
    title: 'Verified Creators',
    description: 'Look for verified badges to find trustworthy influencers who have completed our verification process.',
  },
  {
    icon: '3',
    title: 'Quick Access',
    description: 'Click on any profile card to view detailed information and start a conversation.',
  },
];

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

function getSocialIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <FaInstagram className="w-4 h-4 text-pink-500" />;
    case 'youtube':
      return <FaYoutube className="w-4 h-4 text-red-500" />;
    case 'facebook':
      return <FaFacebook className="w-4 h-4 text-blue-500" />;
    default:
      return null;
  }
}

interface InfluencerCardProps {
  influencer: DemoInfluencer;
  onClick: () => void;
}

function DemoInfluencerCard({ influencer, onClick }: InfluencerCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-[#B8FF00]/50 transition-all cursor-pointer group"
    >
      {/* Profile Image */}
      <div className="relative px-4 py-3 bg-[#0a0a0a]">
        <img
          src={influencer.profileImage}
          alt={influencer.displayName}
          className="w-20 h-20 rounded-2xl object-cover mx-auto"
        />
        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-1">
          {influencer.isVerified && (
            <div className="w-5 h-5 bg-[#0a0a0a]/90 rounded-full flex items-center justify-center" title="Verified">
              <MdVerified className="w-4 h-4 text-green-400" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-semibold truncate text-sm">{influencer.displayName}</h3>
          <span className="text-gray-500 text-xs">@{influencer.username}</span>
        </div>

        {/* Social Media Links */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {influencer.socialMediaLinks
            .filter((link) => link.followerCount > 0)
            .slice(0, 3)
            .map((link) => (
              <div key={link.platform} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                {getSocialIcon(link.platform)}
                <span className="text-gray-400 text-xs">{formatFollowers(link.followerCount)}</span>
              </div>
            ))}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1 mb-2">
          {influencer.categories.slice(0, 2).map((cat) => (
            <span key={cat} className="px-2 py-0.5 bg-[#B8FF00]/10 text-[#B8FF00] text-[10px] rounded-md">
              {cat}
            </span>
          ))}
        </div>

        {/* Location & Rating */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <LuMapPin className="w-3 h-3" />
            <span className="truncate">{influencer.location}</span>
          </div>
          {influencer.totalReviews > 0 && (
            <div className="flex items-center gap-1">
              <LuStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-gray-400">{influencer.avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandDiscoverBrowse() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DemoFilters>({
    followerRanges: [],
    verifiedOnly: false,
    category: null,
  });

  const filteredInfluencers = useMemo(() => {
    return demoInfluencers.filter((influencer) => {
      const totalFollowers = influencer.socialMediaLinks.reduce(
        (sum, link) => sum + (link.followerCount || 0),
        0
      );

      // Follower range filter
      if (filters.followerRanges.length > 0) {
        const matchesRange = filters.followerRanges.some((rangeId) => {
          const range = FOLLOWER_RANGES.find((r) => r.id === rangeId);
          if (!range) return false;
          return totalFollowers >= range.min && totalFollowers <= range.max;
        });
        if (!matchesRange) return false;
      }

      // Verified filter
      if (filters.verifiedOnly && !influencer.isVerified) {
        return false;
      }

      // Category filter
      if (filters.category && !influencer.categories.includes(filters.category)) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const toggleFollowerRange = (rangeId: string) => {
    setFilters((prev) => ({
      ...prev,
      followerRanges: prev.followerRanges.includes(rangeId)
        ? prev.followerRanges.filter((r) => r !== rangeId)
        : [...prev.followerRanges, rangeId],
    }));
  };

  const toggleVerified = () => {
    setFilters((prev) => ({ ...prev, verifiedOnly: !prev.verifiedOnly }));
  };

  const selectCategory = (category: string | null) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const handleInfluencerClick = (influencer: DemoInfluencer) => {
    // Navigate to profile with the influencer id
    navigate(`/demo/brand-discover/profile?influencer=${influencer.uid}`);
  };

  return (
    <DemoLayout
      currentStep={1}
      totalSteps={4}
      nextPath="/demo/brand-discover/profile"
      nextLabel="View Profile"
      perspective="brand"
    >
      {/* Info Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 font-medium">Brands search for influencers using filters</span>
          <div className="flex items-center gap-1">
            {infoItems.map((item, index) => (
              <Popover.Root key={index}>
                <Popover.Trigger asChild>
                  <button className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 text-[11px] font-semibold leading-none text-white transition-all data-[state=open]:bg-white/30 data-[state=open]:border-white/40 cursor-pointer">
                    {item.icon}
                  </button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    className="w-72 p-3 bg-gray-800 rounded-xl border border-white/10 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={8}
                    side="bottom"
                  >
                    <Popover.Arrow className="fill-gray-800" width={12} height={8} />
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Panel - Simplified */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Search Filters</h2>
          {(filters.followerRanges.length > 0 || filters.verifiedOnly || filters.category) && (
            <button
              onClick={() => setFilters({ followerRanges: [], verifiedOnly: false, category: null })}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Follower Count - Side by side */}
        <div className="flex items-center gap-3 mb-3">
          <label className="text-xs text-gray-400 w-20 shrink-0">Followers</label>
          <div className="flex flex-wrap gap-1.5">
            {FOLLOWER_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={() => toggleFollowerRange(range.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  filters.followerRanges.includes(range.id)
                    ? 'bg-[#B8FF00] text-gray-900 font-semibold'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category - Side by side */}
        <div className="flex items-center gap-3 mb-3">
          <label className="text-xs text-gray-400 w-20 shrink-0">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => selectCategory(filters.category === category ? null : category)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  filters.category === category
                    ? 'bg-[#B8FF00] text-gray-900 font-semibold'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Verified Toggle - Side by side */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-20 shrink-0">Verified</label>
          <button
            onClick={toggleVerified}
            className={`w-10 h-5 rounded-full transition-colors ${
              filters.verifiedOnly ? 'bg-[#B8FF00]' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                filters.verifiedOnly ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Results count */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400">
            {filteredInfluencers.length} {filteredInfluencers.length === 1 ? 'influencer' : 'influencers'} found
          </p>
        </div>
      </div>

      {/* Influencer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredInfluencers.map((influencer) => (
          <DemoInfluencerCard
            key={influencer.uid}
            influencer={influencer}
            onClick={() => handleInfluencerClick(influencer)}
          />
        ))}
      </div>

      {filteredInfluencers.length === 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
          <LuSearch className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1 text-sm">No influencers found</h3>
          <p className="text-gray-400 text-xs">Try adjusting your filters</p>
        </div>
      )}
    </DemoLayout>
  );
}
