// ============================================
// FILTER PANEL COMPONENT
// ============================================

import { useState, useEffect } from 'react';
import type { InfluencerFilters } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { LuChevronDown, LuSearch } from 'react-icons/lu';

interface FilterPanelProps {
  filters: InfluencerFilters;
  onFiltersChange: (filters: InfluencerFilters) => void;
  onClearFilters: () => void;
  resultCount?: number;
  isOpen: boolean;
  onToggle: () => void;
}

const FOLLOWER_RANGES = [
  { id: '1K-10K', label: '1K - 10K', min: 1000, max: 10000 },
  { id: '10K-50K', label: '10K - 50K', min: 10000, max: 50000 },
  { id: '50K-100K', label: '50K - 100K', min: 50000, max: 100000 },
  { id: '100K-500K', label: '100K - 500K', min: 100000, max: 500000 },
  { id: '500K+', label: '500K+', min: 500000, max: Infinity },
];

export default function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  resultCount = 0,
  isOpen,
  onToggle,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<InfluencerFilters>(filters);

  // Sync localFilters when filters prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...localFilters, search: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = localFilters.categories?.includes(category)
      ? localFilters.categories.filter(c => c !== category)
      : [...(localFilters.categories || []), category];

    const newFilters = { ...localFilters, categories: newCategories };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFollowerRangeToggle = (rangeId: string) => {
    const newRanges = localFilters.followerRanges?.includes(rangeId)
      ? localFilters.followerRanges.filter(r => r !== rangeId)
      : [...(localFilters.followerRanges || []), rangeId];

    const newFilters = { ...localFilters, followerRanges: newRanges };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRatingChange = (rating: number) => {
    const newRating = localFilters.minRating === rating ? undefined : rating;
    const newFilters = { ...localFilters, minRating: newRating };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleVerifiedToggle = () => {
    const newFilters = { ...localFilters, verifiedOnly: !localFilters.verifiedOnly };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTrustedToggle = () => {
    const newFilters = { ...localFilters, trustedOnly: !localFilters.trustedOnly };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    const emptyFilters: InfluencerFilters = {};
    setLocalFilters(emptyFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between mb-4"
      >
        <span className="text-white font-medium">Filters</span>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-[#B8FF00] text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
              {Object.values(localFilters).filter(v =>
                Array.isArray(v) ? v.length > 0 : v !== undefined
              ).length}
            </span>
          )}
          <LuChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Filter Panel */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 sticky top-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={localFilters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
              <LuSearch className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    localFilters.categories?.includes(category)
                      ? 'bg-[#B8FF00] text-gray-900'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Follower Count */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Followers</label>
            <div className="space-y-2">
              {FOLLOWER_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => handleFollowerRangeToggle(range.id)}
                  className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all ${
                    localFilters.followerRanges?.includes(range.id)
                      ? 'bg-[#B8FF00] text-gray-900'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Minimum Rating</label>
            <div className="flex gap-2">
              {[4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                    localFilters.minRating === rating
                      ? 'bg-[#B8FF00] text-gray-900'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {rating}+ ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Verified Only */}
          <div className="mb-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={handleVerifiedToggle}
                className={`w-12 h-6 rounded-full transition-colors ${
                  localFilters.verifiedOnly ? 'bg-[#B8FF00]' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    localFilters.verifiedOnly ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-gray-400 text-sm">Verified influencers only</span>
            </label>
          </div>

          {/* Trusted Only */}
          <div className="mb-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={handleTrustedToggle}
                className={`w-12 h-6 rounded-full transition-colors ${
                  localFilters.trustedOnly ? 'bg-[#B8FF00]' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    localFilters.trustedOnly ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-gray-400 text-sm">Trusted influencers only</span>
            </label>
          </div>

          {/* Results count */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              {resultCount} {resultCount === 1 ? 'result' : 'results'} found
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
